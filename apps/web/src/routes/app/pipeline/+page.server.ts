import { fail } from '@sveltejs/kit';
import { DEAL_STAGES, funnelFromFurthest, type DealStage } from '@oso-ahia/domain';
import { createDeal, listDeals, moveDeal } from '@oso-ahia/db';
import { db } from '$lib/server/db';
import { requireDesk } from '$lib/server/guard';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { workspace } = requireDesk(locals);
	const rows = await listDeals(db, workspace.id);
	const deals = rows.map((row) => ({
		id: row.deal.id,
		title: row.deal.title,
		value: row.deal.value,
		stage: row.deal.stage,
		furthestStage: row.deal.furthestStage,
		ownerName: row.deal.ownerName,
		company: row.company ?? ''
	}));
	return {
		stages: DEAL_STAGES,
		deals,
		funnel: funnelFromFurthest(deals.map((deal) => deal.furthestStage))
	};
};

export const actions: Actions = {
	move: async ({ request, locals }) => {
		const { workspace } = requireDesk(locals);
		const data = await request.formData();
		const stage = String(data.get('stage') ?? '') as DealStage;
		if (!DEAL_STAGES.includes(stage)) return fail(400, { message: 'Unknown stage.' });
		try {
			await moveDeal(db, workspace.id, String(data.get('id') ?? ''), stage);
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Could not move the deal.'
			});
		}
		return { message: 'Deal moved.' };
	},
	create: async ({ request, locals }) => {
		const { workspace, user } = requireDesk(locals);
		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const value = Number(data.get('value') ?? '0');
		if (!title) return fail(400, { message: 'Name the deal.' });
		if (!Number.isFinite(value) || value < 0)
			return fail(400, { message: 'Value must be a number.' });
		await createDeal(db, workspace.id, {
			title,
			value: Math.round(value),
			ownerName: user.name
		});
		return { message: 'Deal opened.' };
	}
};
