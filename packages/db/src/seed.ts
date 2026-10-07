import { config as loadEnv } from 'dotenv';
import { eq } from 'drizzle-orm';
import {
	DEFAULT_ICP,
	DEFAULT_MODELS,
	hashApiKey,
	judgeHeuristic,
	SEEDED_PROSPECTS,
	type DealStage,
	type LeadStatus
} from '@oso-ahia/domain';
import { getDb } from './client.js';
import {
	activities,
	apiKeys,
	approvals,
	campaigns,
	conversations,
	deals,
	enrollments,
	leads,
	listLeads,
	lists,
	members,
	messages,
	sequenceSteps,
	tasks,
	workspaces
} from './schema.js';

loadEnv({ path: '../../.env' });
loadEnv({ path: '../../apps/web/.env' });

const DAY = 86_400_000;

function daysAgo(days: number, hours = 10) {
	const date = new Date();
	date.setHours(hours, 0, 0, 0);
	date.setTime(date.getTime() - days * DAY);
	return date;
}

function daysAhead(days: number) {
	return new Date(Date.now() + days * DAY);
}

async function main() {
	const db = getDb();
	const [existing] = await db.select().from(workspaces).where(eq(workspaces.slug, 'ahia-studio'));
	if (existing) {
		await db.delete(workspaces).where(eq(workspaces.id, existing.id));
	}

	const [workspace] = await db
		.insert(workspaces)
		.values({
			name: 'Ahịa Studio',
			slug: 'ahia-studio',
			icp: DEFAULT_ICP,
			modelSettings: DEFAULT_MODELS
		})
		.returning();
	if (!workspace) throw new Error('Seed failed to create workspace.');

	await db.insert(members).values([
		{
			workspaceId: workspace.id,
			email: 'chimezie@osoahia.dev',
			name: 'Chimezie',
			role: 'owner'
		},
		{
			workspaceId: workspace.id,
			email: 'adaeze@osoahia.dev',
			name: 'Adaeze Nwosu',
			role: 'admin'
		},
		{
			workspaceId: workspace.id,
			email: 'jonah@osoahia.dev',
			name: 'Jonah Hale',
			role: 'member'
		}
	]);

	const statusFor = (index: number, fit: boolean): LeadStatus => {
		if (!fit) return index % 2 === 0 ? 'unqualified' : 'new';
		const cycle: LeadStatus[] = ['qualified', 'contacted', 'replied', 'meeting', 'new', 'qualified'];
		return cycle[index % cycle.length] ?? 'new';
	};

	const scored = SEEDED_PROSPECTS.map((prospect, index) => {
		const judged = judgeHeuristic(prospect, DEFAULT_ICP);
		return { prospect, judged, status: statusFor(index, judged.fit) };
	});

	const insertedLeads = await db
		.insert(leads)
		.values(
			scored.map((row, index) => ({
				workspaceId: workspace.id,
				...row.prospect,
				source: index % 5 === 0 ? 'csv' : 'sample',
				score: row.judged.score,
				icpFit: row.judged.fit,
				fitReasons: row.judged.reasons,
				status: row.status,
				createdAt: daysAgo(30 - (index % 21))
			}))
		)
		.returning();

	const byEmail = new Map(insertedLeads.map((lead) => [lead.email, lead]));
	const westAfrica = insertedLeads.filter((lead) =>
		['Lagos', 'Accra', 'Nairobi'].includes(lead.location)
	);
	const europe = insertedLeads.filter((lead) => ['London', 'Berlin'].includes(lead.location));
	const highScore = insertedLeads.filter((lead) => lead.score >= 85);
	const hold = insertedLeads.filter((lead) => !lead.icpFit);

	const insertedLists = await db
		.insert(lists)
		.values([
			{
				workspaceId: workspace.id,
				name: 'West Africa outbound',
				description: 'Fintech, logistics, and SaaS desks in Lagos, Accra, and Nairobi.'
			},
			{
				workspaceId: workspace.id,
				name: 'UK & EU expansion',
				description: 'London and Berlin accounts for the second sequence.'
			},
			{
				workspaceId: workspace.id,
				name: 'High score',
				description: 'ICP score of 85 or better. Review before enrollment.'
			},
			{
				workspaceId: workspace.id,
				name: 'Hold',
				description: 'Outside the ICP. Kept so we do not source them again.'
			}
		])
		.returning();

	const [westList, euList, highList, holdList] = insertedLists;
	if (!westList || !euList || !highList || !holdList) throw new Error('Lists missing.');

	const pairs = [
		...westAfrica.map((lead) => ({ listId: westList.id, leadId: lead.id })),
		...europe.map((lead) => ({ listId: euList.id, leadId: lead.id })),
		...highScore.map((lead) => ({ listId: highList.id, leadId: lead.id })),
		...hold.map((lead) => ({ listId: holdList.id, leadId: lead.id }))
	];
	if (pairs.length) await db.insert(listLeads).values(pairs);

	const [lagos, europeCampaign] = await db
		.insert(campaigns)
		.values([
			{
				workspaceId: workspace.id,
				name: 'Lagos fintech intro',
				status: 'active',
				description: 'A short first-touch sequence for West African fintech revenue leaders.',
				createdAt: daysAgo(18)
			},
			{
				workspaceId: workspace.id,
				name: 'EU developer tools',
				status: 'paused',
				description: 'Paused while copy for the second email is rewritten.',
				createdAt: daysAgo(12)
			}
		])
		.returning();
	if (!lagos || !europeCampaign) throw new Error('Campaigns missing.');

	await db.insert(sequenceSteps).values([
		{
			campaignId: lagos.id,
			position: 0,
			kind: 'email',
			config: {
				subject: 'A quieter way to run outbound',
				body: 'Hi {{firstName}} — I have been looking at how {{company}} is staffing revenue. We built Oso-Ahia so an agent can draft the note and a person still approves the send. Worth ten minutes next week?'
			}
		},
		{ campaignId: lagos.id, position: 1, kind: 'wait', config: { days: 3 } },
		{ campaignId: lagos.id, position: 2, kind: 'condition', config: { if: 'replied', then: 'stop' } },
		{
			campaignId: lagos.id,
			position: 3,
			kind: 'email',
			config: {
				subject: 'Re: a quieter way to run outbound',
				body: 'Hi {{firstName}} — leaving this here in case the first note landed in a busy week. Happy to send a two-slide look at the approval queue instead of a call.'
			}
		},
		{
			campaignId: lagos.id,
			position: 4,
			kind: 'task',
			config: { title: 'Call if still quiet', notes: 'Only if both emails were approved and sent.' }
		},
		{
			campaignId: europeCampaign.id,
			position: 0,
			kind: 'email',
			config: {
				subject: 'Tool calls, then a human',
				body: 'Hi {{firstName}} — developer-tool teams tend to hate sequences that send themselves. Ours do not. The draft waits. You edit. Then it goes.'
			}
		},
		{ campaignId: europeCampaign.id, position: 1, kind: 'wait', config: { days: 2 } },
		{
			campaignId: europeCampaign.id,
			position: 2,
			kind: 'task',
			config: { title: 'Check reply intent', notes: 'Read the thread before the next step.' }
		}
	]);

	const amara = byEmail.get('amara.diallo@kolaform.com');
	const chinedu = byEmail.get('chinedu.okeke@bramblepay.com');
	const ngozi = byEmail.get('ngozi.ekwueme@palmregistry.com');
	const lena = byEmail.get('lena.vogt@northglass.dev');
	const jonah = byEmail.get('jonah.pike@fieldnote.io');
	const ruth = byEmail.get('ruth.adebanjo@lanternbank.com');
	const grace = byEmail.get('grace.mwangi@twigafreight.com');
	const malik = byEmail.get('malik.johnson@copperline.io');
	const maya = byEmail.get('maya.chen@northwinddesk.com');
	const samuel = byEmail.get('samuel.adeyemi@orangecircuit.dev');

	const pendingBodies = [
		{
			lead: amara,
			subject: 'A quieter way to run outbound',
			body: 'Hi Amara — Kolaform’s sales desk is growing faster than the process around it. We keep an agent on research and drafting, and a person on the send button. Open to a short look next Tuesday?'
		},
		{
			lead: chinedu,
			subject: 'Growth at Bramble Pay',
			body: 'Hi Chinedu — I saw Bramble Pay hiring around growth. Before anyone writes a sequence, the copy sits in an approval queue. If that is how you already want outbound to work, I can show the desk.'
		},
		{
			lead: ngozi,
			subject: 'Palm Registry, briefly',
			body: 'Hi Ngozi — revenue teams your size usually have a pile of drafted notes and no clean place to say yes or no. That queue is the product. Fifteen minutes if it is useful.'
		},
		{
			lead: lena,
			subject: 'Northglass and human send',
			body: 'Hi Lena — developer-tool buyers can smell an unsupervised sequence. Ours cannot send until someone on your team approves the draft. Worth a look?'
		}
	];

	const createdApprovals = await db
		.insert(approvals)
		.values([
			...pendingBodies.flatMap((item) =>
				item.lead
					? [
							{
								workspaceId: workspace.id,
								type: 'email' as const,
								status: 'pending' as const,
								leadId: item.lead.id,
								campaignId: item.lead.location === 'Berlin' ? europeCampaign.id : lagos.id,
								toEmail: item.lead.email,
								subject: item.subject,
								body: item.body,
								createdAt: daysAgo(1, 9)
							}
						]
					: []
			),
			{
				workspaceId: workspace.id,
				type: 'crm_sync',
				status: 'pending',
				leadId: ruth?.id,
				toEmail: ruth?.email ?? '',
				subject: 'Create HubSpot contact',
				body: 'Push Ruth Adebanjo, VP Sales at Lantern Bank, into HubSpot as a contact on the EU expansion list.',
				note: 'Waiting on a HubSpot connection.',
				createdAt: daysAgo(2, 15)
			},
			{
				workspaceId: workspace.id,
				type: 'meeting',
				status: 'pending',
				leadId: grace?.id,
				toEmail: grace?.email ?? '',
				subject: '30 min with Grace Mwangi',
				body: 'Propose Thursday 10:00 WAT. Log the hold on Google Calendar once approved.',
				createdAt: daysAgo(0, 8)
			},
			{
				workspaceId: workspace.id,
				type: 'email',
				status: 'sent',
				leadId: malik?.id,
				toEmail: malik?.email ?? '',
				subject: 'Copperline pipeline',
				body: 'Hi Malik — sent last week after Adaeze approved the copy. He replied and a meeting is booked.',
				createdAt: daysAgo(9),
				resolvedAt: daysAgo(9)
			},
			{
				workspaceId: workspace.id,
				type: 'email',
				status: 'rejected',
				leadId: samuel?.id,
				toEmail: samuel?.email ?? '',
				subject: 'Orange Circuit',
				body: 'Hi Samuel — this draft leaned too hard on a discount. Rejected. Rewrite before it is enrolled again.',
				note: 'Tone was off.',
				createdAt: daysAgo(4),
				resolvedAt: daysAgo(4)
			}
		])
		.returning();

	const amaraApproval = createdApprovals.find((row) => row.leadId === amara?.id);

	const enrollmentSeeds = [
		amara && {
			campaignId: lagos.id,
			leadId: amara.id,
			status: 'waiting_approval' as const,
			stepIndex: 0,
			stepEnteredAt: daysAgo(1),
			approvalId: amaraApproval?.id
		},
		chinedu && {
			campaignId: lagos.id,
			leadId: chinedu.id,
			status: 'waiting_approval' as const,
			stepIndex: 0,
			stepEnteredAt: daysAgo(1)
		},
		ngozi && {
			campaignId: lagos.id,
			leadId: ngozi.id,
			status: 'active' as const,
			stepIndex: 1,
			stepEnteredAt: daysAgo(2)
		},
		lena && {
			campaignId: europeCampaign.id,
			leadId: lena.id,
			status: 'paused' as const,
			stepIndex: 0,
			stepEnteredAt: daysAgo(6)
		},
		jonah && {
			campaignId: europeCampaign.id,
			leadId: jonah.id,
			status: 'paused' as const,
			stepIndex: 1,
			stepEnteredAt: daysAgo(5)
		}
	].filter((row): row is NonNullable<typeof row> => Boolean(row));

	if (enrollmentSeeds.length) await db.insert(enrollments).values(enrollmentSeeds);

	const dealPlan: { lead?: typeof amara; stage: DealStage; furthest: DealStage; value: number; title: string }[] = [
		{ lead: malik, stage: 'meeting', furthest: 'meeting', value: 42000, title: 'Copperline — sales desk' },
		{ lead: maya, stage: 'proposal', furthest: 'proposal', value: 36000, title: 'Northwind Desk rollout' },
		{ lead: ruth, stage: 'negotiation', furthest: 'negotiation', value: 88000, title: 'Lantern Bank EU' },
		{ lead: grace, stage: 'qualified', furthest: 'qualified', value: 54000, title: 'Twiga Freight' },
		{ lead: amara, stage: 'lead', furthest: 'lead', value: 28000, title: 'Kolaform intro' },
		{ lead: lena, stage: 'qualified', furthest: 'qualified', value: 31000, title: 'Northglass' },
		{ lead: byEmail.get('ben.carter@harborhume.com'), stage: 'won', furthest: 'won', value: 24000, title: 'Harbor & Hume' },
		{ lead: byEmail.get('ifeanyi.eze@marketday.app'), stage: 'lost', furthest: 'lead', value: 6000, title: 'Marketday' },
		{ lead: byEmail.get('daniel.cho@relayboard.com'), stage: 'meeting', furthest: 'meeting', value: 47000, title: 'Relayboard' },
		{ lead: byEmail.get('priya.raman@ledgerandco.com'), stage: 'proposal', furthest: 'proposal', value: 61000, title: 'Ledger & Co' }
	];

	await db.insert(deals).values(
		dealPlan.flatMap((item) =>
			item.lead
				? [
						{
							workspaceId: workspace.id,
							leadId: item.lead.id,
							title: item.title,
							value: item.value,
							stage: item.stage,
							furthestStage: item.furthest,
							ownerName: item.stage === 'won' ? 'Adaeze Nwosu' : 'Chimezie',
							createdAt: daysAgo(20),
							updatedAt: daysAgo(item.stage === 'lead' ? 1 : 3)
						}
					]
				: []
		)
	);

	await db.insert(tasks).values([
		{
			workspaceId: workspace.id,
			title: 'Review the Lagos approval queue',
			notes: 'Four drafts are waiting. Edit Amara’s subject before approving.',
			dueAt: daysAhead(0),
			assigneeName: 'Chimezie',
			source: 'manual',
			status: 'open'
		},
		{
			workspaceId: workspace.id,
			title: 'Rewrite EU second touch',
			notes: 'Campaign is paused until this copy is less generic.',
			dueAt: daysAhead(1),
			assigneeName: 'Adaeze Nwosu',
			source: 'manual',
			leadId: lena?.id
		},
		{
			workspaceId: workspace.id,
			title: 'Prep Grace Mwangi call',
			notes: 'Twiga Freight, 500 people, logistics. Read the last enrichment note.',
			dueAt: daysAhead(2),
			assigneeName: 'Chimezie',
			source: 'agent',
			leadId: grace?.id
		},
		{
			workspaceId: workspace.id,
			title: 'Weekly ICP review',
			notes: 'Check whether healthtech should stay out of the ICP.',
			dueAt: daysAhead(3),
			assigneeName: 'Jonah Hale',
			source: 'schedule',
			recurrence: 'weekly'
		},
		{
			workspaceId: workspace.id,
			title: 'Morning queue sweep',
			notes: 'Anything pending more than two days gets a decision.',
			dueAt: daysAgo(0),
			assigneeName: 'Chimezie',
			source: 'schedule',
			recurrence: 'daily'
		},
		{
			workspaceId: workspace.id,
			title: 'Send Copperline recap',
			notes: 'Done after the meeting was booked.',
			dueAt: daysAgo(6),
			assigneeName: 'Adaeze Nwosu',
			source: 'agent',
			status: 'done',
			completedAt: daysAgo(6),
			leadId: malik?.id
		},
		{
			workspaceId: workspace.id,
			title: 'Import the conference CSV',
			notes: 'Lagos fintech dinner list is already in the West Africa list.',
			dueAt: daysAgo(8),
			assigneeName: 'Jonah Hale',
			source: 'manual',
			status: 'done',
			completedAt: daysAgo(8)
		}
	]);

	const [thread] = await db
		.insert(conversations)
		.values({
			workspaceId: workspace.id,
			title: 'Find fintech VPs in Lagos',
			createdAt: daysAgo(2),
			updatedAt: daysAgo(2)
		})
		.returning();
	if (thread) {
		await db.insert(messages).values([
			{
				conversationId: thread.id,
				role: 'user',
				parts: [{ type: 'text', text: 'Find fintech VPs in Lagos we have not already mailed.' }],
				createdAt: daysAgo(2, 11)
			},
			{
				conversationId: thread.id,
				role: 'assistant',
				parts: [
					{
						type: 'text',
						text: 'I kept this to titles that match the ICP and skipped anyone already in a sequence.'
					},
					{
						type: 'tool-findLeads',
						toolCallId: 'seed-find',
						state: 'output-available',
						input: { query: 'fintech VP Lagos' },
						output: {
							inserted: 0,
							duplicates: 2,
							leads: insertedLeads
								.filter((lead) => lead.location === 'Lagos' && lead.industry === 'fintech')
								.slice(0, 3)
								.map((lead) => ({
									name: `${lead.firstName} ${lead.lastName}`,
									title: lead.title,
									company: lead.company,
									score: lead.score,
									email: lead.email
								}))
						}
					}
				],
				createdAt: daysAgo(2, 11)
			}
		]);
	}

	const activityRows: {
		kind: string;
		summary: string;
		actor: string;
		createdAt: Date;
	}[] = [];
	for (let week = 7; week >= 0; week -= 1) {
		const sent = 8 - week;
		const replies = Math.max(1, Math.round(sent * 0.34));
		for (let index = 0; index < sent; index += 1) {
			activityRows.push({
				kind: 'email_sent',
				summary: `Approved email sent · week ${8 - week}`,
				actor: index % 2 === 0 ? 'Chimezie' : 'Adaeze Nwosu',
				createdAt: daysAgo(week * 7 + (index % 5), 9 + (index % 6))
			});
		}
		for (let index = 0; index < replies; index += 1) {
			activityRows.push({
				kind: 'reply',
				summary: 'Reply landed in the workspace.',
				actor: 'Prospect',
				createdAt: daysAgo(week * 7 + 1, 14)
			});
		}
	}
	activityRows.push(
		{
			kind: 'approval',
			summary: 'Adaeze approved the Copperline note.',
			actor: 'Adaeze Nwosu',
			createdAt: daysAgo(9, 16)
		},
		{
			kind: 'deal',
			summary: 'Harbor & Hume moved to won.',
			actor: 'Adaeze Nwosu',
			createdAt: daysAgo(5, 12)
		},
		{
			kind: 'import',
			summary: 'CSV import added 9 leads to West Africa outbound.',
			actor: 'Jonah Hale',
			createdAt: daysAgo(8, 10)
		}
	);
	await db.insert(activities).values(activityRows.map((row) => ({ ...row, workspaceId: workspace.id })));

	await db.insert(apiKeys).values({
		workspaceId: workspace.id,
		name: 'Warehouse sync',
		prefix: 'oso_live_seeded',
		hash: hashApiKey('oso_live_seeded_demo_only_rotate_me')
	});

	console.log(`Seeded Ahịa Studio with ${insertedLeads.length} leads.`);
	process.exit(0);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
