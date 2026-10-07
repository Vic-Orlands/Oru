import { fail } from '@sveltejs/kit';
import { judgeProspect } from '@oso-ahia/ai';
import {
	DISCOVERY_POOL,
	SEEDED_PROSPECTS,
	prospectsFromCsv,
	searchProspects,
	type LeadStatus
} from '@oso-ahia/domain';
import {
	addLeadsToList,
	archiveLeads,
	enrollLeadIds,
	getLead,
	insertProspects,
	listCampaigns,
	queryLeads,
	listLists,
	logActivity,
	setLeadStatus
} from '@oso-ahia/db';
import {
	OPENROUTER_API_KEY,
	OPENROUTER_JUDGE_FALLBACK_MODEL,
	OPENROUTER_JUDGE_MODEL
} from '$app/env/private';
import { db } from '$lib/server/db';
import { resolvedModels } from '$lib/server/flags';
import { requireDesk } from '$lib/server/guard';
import type { Actions, PageServerLoad } from './$types';

function ids(data: FormData) {
	return data.getAll('ids').map(String).filter(Boolean);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const { workspace } = requireDesk(locals);
	const page = Number(url.searchParams.get('page') ?? '1');
	const filters = {
		q: url.searchParams.get('q') ?? '',
		status: url.searchParams.get('status') ?? '',
		sort: url.searchParams.get('sort') ?? 'score',
		dir: url.searchParams.get('dir') ?? 'desc',
		page: Number.isFinite(page) && page > 0 ? page : 1
	};
	const result = await queryLeads(db, workspace.id, {
		q: filters.q || undefined,
		status: filters.status || undefined,
		sort: filters.sort,
		dir: filters.dir,
		page: filters.page
	});
	const leadId = url.searchParams.get('lead');
	const lead = leadId ? await getLead(db, workspace.id, leadId) : null;
	const [lists, campaigns] = await Promise.all([
		listLists(db, workspace.id),
		listCampaigns(db, workspace.id)
	]);
	return {
		filters,
		total: result.total,
		page: result.page,
		pageSize: result.pageSize,
		rows: result.rows,
		lead,
		lists,
		campaigns: campaigns.map((campaign) => ({ id: campaign.id, name: campaign.name }))
	};
};

async function scoreAndInsert(
	workspace: NonNullable<App.Locals['workspace']>,
	prospects: ReturnType<typeof prospectsFromCsv>['prospects'],
	actor: string,
	source: string
) {
	const models = resolvedModels(workspace.modelSettings);
	const scored = [];
	for (const prospect of prospects) {
		const verdict = await judgeProspect(prospect, workspace.icp, {
			apiKey: OPENROUTER_API_KEY,
			model: models.judgeModel || OPENROUTER_JUDGE_MODEL,
			fallbackModel: OPENROUTER_JUDGE_FALLBACK_MODEL,
			demo: models.demoAi
		});
		scored.push({
			...prospect,
			score: verdict.score,
			icpFit: verdict.fit,
			fitReasons: verdict.reasons,
			source
		});
	}
	const saved = await insertProspects(db, workspace.id, scored);
	await logActivity(db, {
		workspaceId: workspace.id,
		kind: 'import',
		summary: `Added ${saved.inserted.length} leads. Skipped ${saved.duplicates} duplicates.`,
		actor
	});
	return saved;
}

export const actions: Actions = {
	importCsv: async ({ request, locals }) => {
		const { workspace, user } = requireDesk(locals);
		const data = await request.formData();
		const file = data.get('file');
		const pasted = String(data.get('csv') ?? '');
		const text = file instanceof File && file.size > 0 ? await file.text() : pasted;
		if (!text.trim()) return fail(400, { message: 'Paste a CSV or choose a file.' });
		const parsed = prospectsFromCsv(text);
		if (parsed.prospects.length === 0) {
			return fail(400, { message: 'No rows with an email address.' });
		}
		const saved = await scoreAndInsert(workspace, parsed.prospects, user.name, 'csv');
		return {
			message: `Imported ${saved.inserted.length}. ${saved.duplicates} duplicates and ${parsed.skipped} blank rows skipped.`
		};
	},
	find: async ({ request, locals }) => {
		const { workspace, user } = requireDesk(locals);
		const data = await request.formData();
		const text = String(data.get('text') ?? '');
		const industry = String(data.get('industry') ?? '');
		const location = String(data.get('location') ?? '');
		const matches = searchProspects(
			[...DISCOVERY_POOL, ...SEEDED_PROSPECTS],
			{
				text,
				industry,
				location
			},
			8
		);
		if (matches.length === 0) return fail(400, { message: 'No one in the index matched that.' });
		const saved = await scoreAndInsert(workspace, matches, user.name, 'search');
		return {
			message: `Saved ${saved.inserted.length} new leads. ${saved.duplicates} were already here.`
		};
	},
	setStatus: async ({ request, locals }) => {
		const { workspace } = requireDesk(locals);
		const data = await request.formData();
		const status = String(data.get('status') ?? '') as LeadStatus;
		const selected = ids(data);
		if (selected.length === 0) return fail(400, { message: 'Select at least one lead.' });
		await setLeadStatus(db, workspace.id, selected, status);
		return { message: `Updated ${selected.length}.` };
	},
	archive: async ({ request, locals }) => {
		const { workspace } = requireDesk(locals);
		const selected = ids(await request.formData());
		if (selected.length === 0) return fail(400, { message: 'Select at least one lead.' });
		await archiveLeads(db, workspace.id, selected);
		return { message: `Archived ${selected.length}.` };
	},
	addToList: async ({ request, locals }) => {
		const { workspace } = requireDesk(locals);
		const data = await request.formData();
		const listId = String(data.get('listId') ?? '');
		const selected = ids(data);
		if (!listId || selected.length === 0)
			return fail(400, { message: 'Choose a list and some leads.' });
		await addLeadsToList(db, workspace.id, listId, selected);
		return { message: 'Added to the list.' };
	},
	enroll: async ({ request, locals }) => {
		const { workspace } = requireDesk(locals);
		const data = await request.formData();
		const campaignId = String(data.get('campaignId') ?? '');
		const selected = ids(data);
		if (!campaignId || selected.length === 0) {
			return fail(400, { message: 'Choose a campaign and some leads.' });
		}
		const count = await enrollLeadIds(db, workspace.id, campaignId, selected);
		return { message: `Enrolled ${count}.` };
	}
};
