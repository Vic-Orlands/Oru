import {
	DISCOVERY_POOL,
	SEEDED_PROSPECTS,
	searchProspects,
	type Icp,
	type Prospect
} from '@oso-ahia/domain';
import { judgeProspect, type JudgeConfig } from '@oso-ahia/ai';
import {
	createApproval,
	createTask,
	getLead,
	insertProspects,
	listCampaigns,
	queryLeads,
	logActivity,
	type Database
} from '@oso-ahia/db';

export type DeskContext = {
	db: Database;
	workspaceId: string;
	icp: Icp;
	judge: JudgeConfig;
	actor: string;
};

export type FoundPerson = {
	name: string;
	title: string;
	company: string;
	email: string;
	score: number;
	fit: boolean;
	location: string;
};

export async function runFindLeads(
	ctx: DeskContext,
	input: { text?: string; industry?: string; location?: string }
) {
	const pool = [...DISCOVERY_POOL, ...SEEDED_PROSPECTS];
	const matches = searchProspects(pool, input, 6);
	const scored = [];
	for (const prospect of matches) {
		const verdict = await judgeProspect(prospect, ctx.icp, ctx.judge);
		scored.push({
			...prospect,
			score: verdict.score,
			icpFit: verdict.fit,
			fitReasons: verdict.reasons,
			source: verdict.source === 'heuristic' ? 'agent-demo' : 'agent'
		});
	}
	const saved = await insertProspects(ctx.db, ctx.workspaceId, scored);
	if (saved.inserted.length > 0) {
		await logActivity(ctx.db, {
			workspaceId: ctx.workspaceId,
			kind: 'leads',
			summary: `Agent added ${saved.inserted.length} lead${saved.inserted.length === 1 ? '' : 's'}.`,
			actor: ctx.actor
		});
	}
	const people: FoundPerson[] = saved.inserted.map((lead) => ({
		name: `${lead.firstName} ${lead.lastName}`.trim(),
		title: lead.title,
		company: lead.company,
		email: lead.email,
		score: lead.score,
		fit: lead.icpFit,
		location: lead.location
	}));
	return {
		people,
		duplicates: saved.duplicates,
		considered: matches.length,
		query: [input.text, input.industry, input.location].filter(Boolean).join(' · ')
	};
}

function fill(template: string, prospect: Prospect) {
	return template
		.replaceAll('{{firstName}}', prospect.firstName)
		.replaceAll('{{company}}', prospect.company)
		.replaceAll('{{title}}', prospect.title);
}

export async function runDraftEmail(
	ctx: DeskContext,
	input: { leadEmail?: string; angle?: string }
) {
	let lead = null;
	if (input.leadEmail) {
		const page = await queryLeads(ctx.db, ctx.workspaceId, { q: input.leadEmail, pageSize: 5 });
		lead =
			page.rows.find((row) => row.email === input.leadEmail?.toLowerCase()) ?? page.rows[0] ?? null;
	}
	if (!lead) {
		const page = await queryLeads(ctx.db, ctx.workspaceId, {
			sort: 'score',
			dir: 'desc',
			pageSize: 1
		});
		lead = page.rows[0] ?? null;
	}
	if (!lead) {
		return { empty: true as const, subject: '', body: '', to: '', approvalId: '', company: '' };
	}
	const full = (await getLead(ctx.db, ctx.workspaceId, lead.id)) ?? lead;
	const prospect: Prospect = {
		firstName: full.firstName,
		lastName: full.lastName,
		email: full.email,
		title: full.title,
		company: full.company,
		domain: full.domain,
		linkedinUrl: full.linkedinUrl,
		location: full.location,
		industry: full.industry,
		employeeCount: full.employeeCount,
		phone: full.phone
	};
	const angle = input.angle?.trim() || 'keeping a person in front of every send';
	const subject = fill('A short note for {{company}}', prospect);
	const body = fill(
		`Hi {{firstName}} — {{company}} looks like a desk that already runs outbound. We keep a human on the send button, and the agent only drafts. Worth fifteen minutes on ${angle}?`,
		prospect
	);
	const approval = await createApproval(ctx.db, {
		workspaceId: ctx.workspaceId,
		type: 'email',
		leadId: full.id,
		toEmail: full.email,
		subject,
		body,
		note: 'Drafted by the agent. Nothing sends until this is approved.'
	});
	await logActivity(ctx.db, {
		workspaceId: ctx.workspaceId,
		kind: 'approval',
		summary: `Draft waiting for ${full.firstName} ${full.lastName} at ${full.company}.`,
		actor: ctx.actor
	});
	return {
		empty: false as const,
		subject,
		body,
		to: full.email,
		approvalId: approval.id,
		company: full.company,
		name: `${full.firstName} ${full.lastName}`.trim()
	};
}

export async function runCreateTask(ctx: DeskContext, input: { title: string; notes?: string }) {
	const due = new Date(Date.now() + 86_400_000);
	const task = await createTask(ctx.db, {
		workspaceId: ctx.workspaceId,
		title: input.title,
		notes: input.notes ?? '',
		dueAt: due,
		assigneeName: ctx.actor,
		source: 'agent'
	});
	await logActivity(ctx.db, {
		workspaceId: ctx.workspaceId,
		kind: 'task',
		summary: `Task added: ${input.title}`,
		actor: ctx.actor
	});
	return {
		id: task?.id ?? '',
		title: input.title,
		notes: input.notes ?? '',
		due: due.toISOString(),
		assignee: ctx.actor
	};
}

export async function runCampaignSummary(ctx: DeskContext) {
	const campaigns = await listCampaigns(ctx.db, ctx.workspaceId);
	const summaries = [];
	for (const campaign of campaigns) {
		summaries.push({
			id: campaign.id,
			name: campaign.name,
			status: campaign.status,
			description: campaign.description
		});
	}
	return { campaigns: summaries };
}
