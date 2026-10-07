import {
	DEFAULT_ICP,
	DEFAULT_MODELS,
	dedupeKey,
	furthestStage,
	partitionNew,
	type DealStage,
	type Icp,
	type LeadStatus,
	type ModelSettings,
	type Prospect
} from '@oso-ahia/domain';
import { and, asc, desc, eq, ilike, inArray, isNotNull, lte, or, sql } from 'drizzle-orm';
import type { Database } from './client.js';
import {
	activities,
	apiKeys,
	approvals,
	campaigns,
	connections,
	conversations,
	deals,
	enrollments,
	leads,
	listLeads as listMemberships,
	lists,
	members,
	messages,
	sequenceSteps,
	tasks,
	workspaces
} from './schema.js';

export type ScoredProspect = Prospect & {
	score: number;
	icpFit: boolean;
	fitReasons: string[];
	source: string;
	status?: LeadStatus;
};

const DAY = 86_400_000;

export async function getWorkspaceForUser(db: Database, userId: string) {
	const [row] = await db
		.select({ workspace: workspaces, member: members })
		.from(members)
		.innerJoin(workspaces, eq(workspaces.id, members.workspaceId))
		.where(eq(members.userId, userId))
		.limit(1);
	return row ?? null;
}

export async function claimWorkspace(
	db: Database,
	user: { id: string; email: string; name: string }
) {
	const email = user.email.toLowerCase();
	const existing = await getWorkspaceForUser(db, user.id);
	if (existing) return existing.workspace;

	const [byEmail] = await db.select().from(members).where(eq(members.email, email)).limit(1);
	if (byEmail) {
		await db.update(members).set({ userId: user.id, name: user.name || byEmail.name }).where(eq(members.id, byEmail.id));
		const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, byEmail.workspaceId));
		if (!workspace) throw new Error('Workspace not found for this member.');
		return workspace;
	}

	const [workspace] = await db
		.insert(workspaces)
		.values({
			name: `${user.name.split(' ')[0] || 'Personal'} desk`,
			slug: `desk-${user.id.slice(0, 8)}`,
			icp: DEFAULT_ICP,
			modelSettings: DEFAULT_MODELS
		})
		.returning();
	if (!workspace) throw new Error('Could not create a workspace.');
	await db.insert(members).values({
		workspaceId: workspace.id,
		userId: user.id,
		email,
		name: user.name,
		role: 'owner'
	});
	await db.insert(activities).values({
		workspaceId: workspace.id,
		kind: 'workspace',
		summary: 'Workspace created. Define an ICP before the agent starts sourcing.',
		actor: user.name
	});
	return workspace;
}

export async function updateWorkspace(
	db: Database,
	workspaceId: string,
	patch: { name?: string; icp?: Icp; modelSettings?: ModelSettings }
) {
	await db
		.update(workspaces)
		.set({ ...patch, updatedAt: new Date() })
		.where(eq(workspaces.id, workspaceId));
}

export async function listMembers(db: Database, workspaceId: string) {
	return db.select().from(members).where(eq(members.workspaceId, workspaceId)).orderBy(asc(members.createdAt));
}

export async function inviteMember(
	db: Database,
	workspaceId: string,
	input: { email: string; name: string; role: string }
) {
	const email = input.email.trim().toLowerCase();
	if (!email.includes('@')) throw new Error('Enter a valid email address.');
	await db.insert(members).values({
		workspaceId,
		email,
		name: input.name.trim() || email,
		role: input.role === 'admin' ? 'admin' : 'member'
	});
}

export async function removeMember(db: Database, workspaceId: string, memberId: string) {
	const [member] = await db
		.select()
		.from(members)
		.where(and(eq(members.id, memberId), eq(members.workspaceId, workspaceId)));
	if (!member) throw new Error('Member not found.');
	if (member.role === 'owner') throw new Error('The workspace owner cannot be removed.');
	await db.delete(members).where(eq(members.id, memberId));
}

export type LeadFilters = {
	q?: string;
	status?: string;
	listId?: string;
	minScore?: number;
	sort?: string;
	dir?: string;
	page?: number;
	pageSize?: number;
	includeArchived?: boolean;
};

export async function queryLeads(db: Database, workspaceId: string, filters: LeadFilters) {
	const pageSize = Math.min(50, Math.max(5, filters.pageSize ?? 20));
	const page = Math.max(1, filters.page ?? 1);
	const conditions = [eq(leads.workspaceId, workspaceId)];
	if (!filters.includeArchived) conditions.push(eq(leads.archived, false));
	if (filters.status) conditions.push(eq(leads.status, filters.status as LeadStatus));
	if (filters.minScore) conditions.push(sql`${leads.score} >= ${filters.minScore}`);
	if (filters.q) {
		const pattern = `%${filters.q}%`;
		conditions.push(
			or(
				ilike(leads.firstName, pattern),
				ilike(leads.lastName, pattern),
				ilike(leads.email, pattern),
				ilike(leads.company, pattern),
				ilike(leads.title, pattern)
			)!
		);
	}
	if (filters.listId) {
		conditions.push(
			sql`${leads.id} in (select ${listMemberships.leadId} from ${listMemberships} where ${listMemberships.listId} = ${filters.listId})`
		);
	}
	const where = and(...conditions);
	const sortColumn =
		filters.sort === 'company'
			? leads.company
			: filters.sort === 'status'
				? leads.status
				: filters.sort === 'name'
					? leads.lastName
					: filters.sort === 'created'
						? leads.createdAt
						: leads.score;
	const order = filters.dir === 'asc' ? asc(sortColumn) : desc(sortColumn);
	const [countRow] = await db
		.select({ total: sql<number>`count(*)::int` })
		.from(leads)
		.where(where);
	const rows = await db
		.select()
		.from(leads)
		.where(where)
		.orderBy(order)
		.limit(pageSize)
		.offset((page - 1) * pageSize);
	return { rows, total: countRow?.total ?? 0, page, pageSize };
}

export async function getLead(db: Database, workspaceId: string, leadId: string) {
	const [lead] = await db
		.select()
		.from(leads)
		.where(and(eq(leads.id, leadId), eq(leads.workspaceId, workspaceId)));
	return lead ?? null;
}

export async function insertProspects(db: Database, workspaceId: string, rows: ScoredProspect[]) {
	const existing = await db
		.select({ email: leads.email, linkedinUrl: leads.linkedinUrl, firstName: leads.firstName, lastName: leads.lastName, company: leads.company })
		.from(leads)
		.where(eq(leads.workspaceId, workspaceId));
	const { fresh, duplicates } = partitionNew(rows, existing.map((row) => dedupeKey(row)), dedupeKey);
	if (fresh.length === 0) return { inserted: [], duplicates: duplicates.length };
	const inserted = await db
		.insert(leads)
		.values(
			fresh.map((row) => ({
				workspaceId,
				firstName: row.firstName,
				lastName: row.lastName,
				email: row.email.toLowerCase(),
				title: row.title,
				company: row.company,
				domain: row.domain,
				linkedinUrl: row.linkedinUrl,
				location: row.location,
				phone: row.phone,
				industry: row.industry,
				employeeCount: row.employeeCount,
				source: row.source,
				score: row.score,
				icpFit: row.icpFit,
				fitReasons: row.fitReasons,
				status: row.status ?? (row.icpFit ? 'qualified' : 'new')
			}))
		)
		.returning();
	return { inserted, duplicates: duplicates.length };
}

export async function setLeadStatus(db: Database, workspaceId: string, ids: string[], status: LeadStatus) {
	if (ids.length === 0) return;
	await db
		.update(leads)
		.set({ status, updatedAt: new Date() })
		.where(and(eq(leads.workspaceId, workspaceId), inArray(leads.id, ids)));
}

export async function archiveLeads(db: Database, workspaceId: string, ids: string[]) {
	if (ids.length === 0) return;
	await db
		.update(leads)
		.set({ archived: true, updatedAt: new Date() })
		.where(and(eq(leads.workspaceId, workspaceId), inArray(leads.id, ids)));
}

export async function listLists(db: Database, workspaceId: string) {
	const rows = await db
		.select({
			id: lists.id,
			name: lists.name,
			description: lists.description,
			createdAt: lists.createdAt,
			count: sql<number>`count(${listMemberships.leadId})::int`
		})
		.from(lists)
		.leftJoin(listMemberships, eq(listMemberships.listId, lists.id))
		.where(eq(lists.workspaceId, workspaceId))
		.groupBy(lists.id)
		.orderBy(desc(lists.createdAt));
	return rows;
}

export async function createList(db: Database, workspaceId: string, name: string, description: string) {
	const trimmed = name.trim();
	if (!trimmed) throw new Error('List name is required.');
	const [list] = await db
		.insert(lists)
		.values({ workspaceId, name: trimmed, description })
		.returning();
	return list;
}

export async function getList(db: Database, workspaceId: string, listId: string) {
	const [list] = await db
		.select()
		.from(lists)
		.where(and(eq(lists.id, listId), eq(lists.workspaceId, workspaceId)));
	return list ?? null;
}

export async function deleteList(db: Database, workspaceId: string, listId: string) {
	await db.delete(lists).where(and(eq(lists.id, listId), eq(lists.workspaceId, workspaceId)));
}

export async function removeLeadsFromList(
	db: Database,
	workspaceId: string,
	listId: string,
	leadIds: string[]
) {
	const list = await getList(db, workspaceId, listId);
	if (!list || leadIds.length === 0) return;
	await db
		.delete(listMemberships)
		.where(and(eq(listMemberships.listId, listId), inArray(listMemberships.leadId, leadIds)));
}

export async function addLeadsToList(db: Database, workspaceId: string, listId: string, leadIds: string[]) {
	const list = await getList(db, workspaceId, listId);
	if (!list) throw new Error('List not found.');
	if (leadIds.length === 0) return;
	const owned = await db
		.select({ id: leads.id })
		.from(leads)
		.where(and(eq(leads.workspaceId, workspaceId), inArray(leads.id, leadIds)));
	if (owned.length === 0) return;
	await db
		.insert(listMemberships)
		.values(owned.map((lead) => ({ listId, leadId: lead.id })))
		.onConflictDoNothing();
}

export async function listApprovals(db: Database, workspaceId: string, status?: string) {
	const conditions = [eq(approvals.workspaceId, workspaceId)];
	if (status) conditions.push(eq(approvals.status, status as 'pending'));
	return db
		.select({
			approval: approvals,
			leadFirst: leads.firstName,
			leadLast: leads.lastName,
			company: leads.company
		})
		.from(approvals)
		.leftJoin(leads, eq(leads.id, approvals.leadId))
		.where(and(...conditions))
		.orderBy(desc(approvals.createdAt));
}

export async function getApproval(db: Database, workspaceId: string, id: string) {
	const [row] = await db
		.select()
		.from(approvals)
		.where(and(eq(approvals.id, id), eq(approvals.workspaceId, workspaceId)));
	return row ?? null;
}

export async function createApproval(
	db: Database,
	input: {
		workspaceId: string;
		type: 'email' | 'crm_sync' | 'meeting' | 'slack';
		leadId?: string | null;
		campaignId?: string | null;
		toEmail?: string;
		subject?: string;
		body?: string;
		note?: string;
	}
) {
	const [row] = await db
		.insert(approvals)
		.values({
			workspaceId: input.workspaceId,
			type: input.type,
			leadId: input.leadId ?? null,
			campaignId: input.campaignId ?? null,
			toEmail: input.toEmail ?? '',
			subject: input.subject ?? '',
			body: input.body ?? '',
			note: input.note ?? ''
		})
		.returning();
	if (!row) throw new Error('Could not create approval.');
	return row;
}

export async function patchApproval(
	db: Database,
	workspaceId: string,
	id: string,
	patch: Partial<{ status: 'pending' | 'approved' | 'rejected' | 'sent'; subject: string; body: string; note: string; resolvedAt: Date | null }>
) {
	const [row] = await db
		.update(approvals)
		.set(patch)
		.where(and(eq(approvals.id, id), eq(approvals.workspaceId, workspaceId)))
		.returning();
	return row ?? null;
}

export async function listCampaigns(db: Database, workspaceId: string) {
	return db.select().from(campaigns).where(eq(campaigns.workspaceId, workspaceId)).orderBy(desc(campaigns.updatedAt));
}

export async function getCampaign(db: Database, workspaceId: string, id: string) {
	const [campaign] = await db
		.select()
		.from(campaigns)
		.where(and(eq(campaigns.id, id), eq(campaigns.workspaceId, workspaceId)));
	if (!campaign) return null;
	const steps = await db
		.select()
		.from(sequenceSteps)
		.where(eq(sequenceSteps.campaignId, id))
		.orderBy(asc(sequenceSteps.position));
	const enrolled = await db
		.select({
			enrollment: enrollments,
			firstName: leads.firstName,
			lastName: leads.lastName,
			company: leads.company,
			email: leads.email,
			leadStatus: leads.status
		})
		.from(enrollments)
		.innerJoin(leads, eq(leads.id, enrollments.leadId))
		.where(eq(enrollments.campaignId, id));
	return { campaign, steps, enrolled };
}

export async function createCampaign(
	db: Database,
	workspaceId: string,
	input: { name: string; description: string }
) {
	const [campaign] = await db
		.insert(campaigns)
		.values({ workspaceId, name: input.name.trim(), description: input.description, status: 'draft' })
		.returning();
	if (!campaign) throw new Error('Could not create campaign.');
	await db.insert(sequenceSteps).values({
		campaignId: campaign.id,
		position: 0,
		kind: 'email',
		config: {
			subject: `Quick note for {{company}}`,
			body: `Hi {{firstName}} — I noticed {{company}} is building out revenue. Worth a short look at how we keep a human on every send?`
		}
	});
	return campaign;
}

export async function addStep(
	db: Database,
	workspaceId: string,
	campaignId: string,
	kind: 'email' | 'wait' | 'condition' | 'task'
) {
	const campaign = await getCampaign(db, workspaceId, campaignId);
	if (!campaign) throw new Error('Campaign not found.');
	const position = campaign.steps.length;
	const config =
		kind === 'wait'
			? { days: 3 }
			: kind === 'condition'
				? { if: 'replied', then: 'stop' }
				: kind === 'task'
					? { title: 'Manual follow-up', notes: 'Call if the thread has gone quiet.' }
					: { subject: 'Following up', body: 'Hi {{firstName}} — circling back once in case this is useful.' };
	await db.insert(sequenceSteps).values({ campaignId, position, kind, config });
}

export async function updateCampaignStatus(db: Database, workspaceId: string, id: string, status: string) {
	await db
		.update(campaigns)
		.set({ status, updatedAt: new Date() })
		.where(and(eq(campaigns.id, id), eq(campaigns.workspaceId, workspaceId)));
}

export async function enrollLeadIds(db: Database, workspaceId: string, campaignId: string, leadIds: string[]) {
	const campaign = await getCampaign(db, workspaceId, campaignId);
	if (!campaign) throw new Error('Campaign not found.');
	const owned = await db
		.select({ id: leads.id })
		.from(leads)
		.where(and(eq(leads.workspaceId, workspaceId), inArray(leads.id, leadIds)));
	if (owned.length === 0) return 0;
	await db
		.insert(enrollments)
		.values(owned.map((lead) => ({ campaignId, leadId: lead.id })))
		.onConflictDoNothing();
	if (campaign.campaign.status === 'draft') {
		await updateCampaignStatus(db, workspaceId, campaignId, 'active');
	}
	return owned.length;
}

export async function listDeals(db: Database, workspaceId: string) {
	return db
		.select({ deal: deals, company: leads.company, email: leads.email })
		.from(deals)
		.leftJoin(leads, eq(leads.id, deals.leadId))
		.where(eq(deals.workspaceId, workspaceId))
		.orderBy(desc(deals.updatedAt));
}

export async function moveDeal(db: Database, workspaceId: string, dealId: string, stage: DealStage) {
	const [current] = await db
		.select()
		.from(deals)
		.where(and(eq(deals.id, dealId), eq(deals.workspaceId, workspaceId)));
	if (!current) throw new Error('Deal not found.');
	const nextFurthest = furthestStage(stage, current.furthestStage);
	await db
		.update(deals)
		.set({ stage, furthestStage: nextFurthest, updatedAt: new Date() })
		.where(eq(deals.id, dealId));
}

export async function createDeal(
	db: Database,
	workspaceId: string,
	input: { title: string; value: number; leadId?: string | null; ownerName: string }
) {
	const [deal] = await db
		.insert(deals)
		.values({
			workspaceId,
			title: input.title,
			value: input.value,
			leadId: input.leadId ?? null,
			ownerName: input.ownerName
		})
		.returning();
	return deal;
}

export async function listTasks(db: Database, workspaceId: string) {
	return db
		.select()
		.from(tasks)
		.where(eq(tasks.workspaceId, workspaceId))
		.orderBy(asc(tasks.dueAt));
}

export async function createTask(
	db: Database,
	input: {
		workspaceId: string;
		title: string;
		notes?: string;
		dueAt?: Date | null;
		assigneeName?: string;
		source?: string;
		recurrence?: string;
		leadId?: string | null;
	}
) {
	const title = input.title.trim();
	if (!title) throw new Error('Task title is required.');
	const [task] = await db
		.insert(tasks)
		.values({
			workspaceId: input.workspaceId,
			title,
			notes: input.notes ?? '',
			dueAt: input.dueAt ?? null,
			assigneeName: input.assigneeName ?? '',
			source: input.source ?? 'manual',
			recurrence: input.recurrence ?? 'none',
			leadId: input.leadId ?? null
		})
		.returning();
	return task;
}

export async function completeTask(db: Database, workspaceId: string, taskId: string) {
	const [task] = await db
		.select()
		.from(tasks)
		.where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)));
	if (!task) throw new Error('Task not found.');
	if (task.recurrence === 'daily' || task.recurrence === 'weekly') {
		const span = task.recurrence === 'daily' ? DAY : 7 * DAY;
		const base = task.dueAt?.getTime() ?? Date.now();
		await db
			.update(tasks)
			.set({
				dueAt: new Date(base + span),
				status: 'open',
				completedAt: null,
				lastFiredAt: new Date()
			})
			.where(eq(tasks.id, taskId));
		return;
	}
	await db
		.update(tasks)
		.set({ status: 'done', completedAt: new Date() })
		.where(eq(tasks.id, taskId));
}

export async function listActivities(db: Database, workspaceId: string, limit = 12) {
	return db
		.select()
		.from(activities)
		.where(eq(activities.workspaceId, workspaceId))
		.orderBy(desc(activities.createdAt))
		.limit(limit);
}

export async function logActivity(
	db: Database,
	input: { workspaceId: string; kind: string; summary: string; actor: string; createdAt?: Date }
) {
	await db.insert(activities).values(input);
}

export async function listConnections(db: Database, workspaceId: string) {
	return db.select().from(connections).where(eq(connections.workspaceId, workspaceId));
}

export async function upsertConnection(
	db: Database,
	input: {
		workspaceId: string;
		toolkit: string;
		status: string;
		mode: string;
		externalId?: string | null;
		detail?: string;
	}
) {
	await db
		.insert(connections)
		.values({
			workspaceId: input.workspaceId,
			toolkit: input.toolkit,
			status: input.status,
			mode: input.mode,
			externalId: input.externalId ?? null,
			detail: input.detail ?? '',
			connectedAt: input.status === 'connected' ? new Date() : null
		})
		.onConflictDoUpdate({
			target: [connections.workspaceId, connections.toolkit],
			set: {
				status: input.status,
				mode: input.mode,
				externalId: input.externalId ?? null,
				detail: input.detail ?? '',
				connectedAt: input.status === 'connected' ? new Date() : null
			}
		});
}

export async function listApiKeys(db: Database, workspaceId: string) {
	return db.select().from(apiKeys).where(eq(apiKeys.workspaceId, workspaceId)).orderBy(desc(apiKeys.createdAt));
}

export async function insertApiKey(
	db: Database,
	input: { workspaceId: string; name: string; prefix: string; hash: string }
) {
	const [row] = await db.insert(apiKeys).values(input).returning();
	return row;
}

export async function revokeApiKey(db: Database, workspaceId: string, id: string) {
	await db.delete(apiKeys).where(and(eq(apiKeys.id, id), eq(apiKeys.workspaceId, workspaceId)));
}

export async function findApiKey(db: Database, hash: string) {
	const [row] = await db.select().from(apiKeys).where(eq(apiKeys.hash, hash));
	return row ?? null;
}

export async function touchApiKey(db: Database, id: string) {
	await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
}

export async function listConversations(db: Database, workspaceId: string) {
	return db
		.select()
		.from(conversations)
		.where(eq(conversations.workspaceId, workspaceId))
		.orderBy(desc(conversations.updatedAt));
}

export async function getConversation(db: Database, workspaceId: string, id: string) {
	const [conversation] = await db
		.select()
		.from(conversations)
		.where(and(eq(conversations.id, id), eq(conversations.workspaceId, workspaceId)));
	if (!conversation) return null;
	const history = await db
		.select()
		.from(messages)
		.where(eq(messages.conversationId, id))
		.orderBy(asc(messages.createdAt));
	return { conversation, messages: history };
}

export async function createConversation(db: Database, workspaceId: string, userId: string, title: string) {
	const [conversation] = await db
		.insert(conversations)
		.values({ workspaceId, userId, title })
		.returning();
	return conversation;
}

export async function replaceMessages(
	db: Database,
	conversationId: string,
	items: { id?: string; role: string; parts: unknown[] }[]
) {
	await db.delete(messages).where(eq(messages.conversationId, conversationId));
	if (items.length === 0) return;
	await db.insert(messages).values(
		items.map((item) => ({
			conversationId,
			role: item.role,
			parts: item.parts
		}))
	);
	const firstUser = items.find((item) => item.role === 'user');
	const text = firstUser?.parts?.find((part) => {
		return typeof part === 'object' && part !== null && 'type' in part && part.type === 'text' && 'text' in part;
	});
	const title =
		text && typeof text === 'object' && 'text' in text && typeof text.text === 'string'
			? text.text.slice(0, 72)
			: undefined;
	await db
		.update(conversations)
		.set({ updatedAt: new Date(), ...(title ? { title } : {}) })
		.where(eq(conversations.id, conversationId));
}

export async function dashboard(db: Database, workspaceId: string) {
	const dealRows = await listDeals(db, workspaceId);
	const openPipeline = dealRows.filter((row) => row.deal.stage !== 'lost' && row.deal.stage !== 'won');
	const pipelineValue = openPipeline.reduce((sum, row) => sum + row.deal.value, 0);
	const wonValue = dealRows.filter((row) => row.deal.stage === 'won').reduce((sum, row) => sum + row.deal.value, 0);
	const [pending] = await db
		.select({ total: sql<number>`count(*)::int` })
		.from(approvals)
		.where(and(eq(approvals.workspaceId, workspaceId), eq(approvals.status, 'pending')));
	const [leadCount] = await db
		.select({ total: sql<number>`count(*)::int` })
		.from(leads)
		.where(and(eq(leads.workspaceId, workspaceId), eq(leads.archived, false)));
	const [fitCount] = await db
		.select({ total: sql<number>`count(*)::int` })
		.from(leads)
		.where(and(eq(leads.workspaceId, workspaceId), eq(leads.icpFit, true), eq(leads.archived, false)));
	const activity = await db
		.select()
		.from(activities)
		.where(eq(activities.workspaceId, workspaceId))
		.orderBy(desc(activities.createdAt));
	const campaignRows = await listCampaigns(db, workspaceId);
	const enrollmentRows = await db
		.select({ campaignId: enrollments.campaignId, status: enrollments.status })
		.from(enrollments)
		.innerJoin(campaigns, eq(campaigns.id, enrollments.campaignId))
		.where(eq(campaigns.workspaceId, workspaceId));
	return {
		pipelineValue,
		wonValue,
		openDeals: openPipeline.length,
		pendingApprovals: pending?.total ?? 0,
		leads: leadCount?.total ?? 0,
		fitLeads: fitCount?.total ?? 0,
		meetings: dealRows.filter((row) => row.deal.stage === 'meeting').length,
		deals: dealRows,
		activity: activity.slice(0, 8),
		chartActivity: activity,
		campaigns: campaignRows,
		enrollments: enrollmentRows
	};
}

export async function activeEnrollments(db: Database) {
	return db
		.select({
			enrollment: enrollments,
			leadStatus: leads.status,
			workspaceId: campaigns.workspaceId,
			campaignName: campaigns.name,
			campaignStatus: campaigns.status
		})
		.from(enrollments)
		.innerJoin(leads, eq(leads.id, enrollments.leadId))
		.innerJoin(campaigns, eq(campaigns.id, enrollments.campaignId))
		.where(eq(campaigns.status, 'active'));
}

export async function stepsForCampaign(db: Database, campaignId: string) {
	return db
		.select()
		.from(sequenceSteps)
		.where(eq(sequenceSteps.campaignId, campaignId))
		.orderBy(asc(sequenceSteps.position));
}

export async function dueTasks(db: Database, now: Date) {
	return db
		.select()
		.from(tasks)
		.where(and(eq(tasks.status, 'open'), isNotNull(tasks.dueAt), lte(tasks.dueAt, now)));
}
