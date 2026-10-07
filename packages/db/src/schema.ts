import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid
} from 'drizzle-orm/pg-core';
import type {
	ApprovalStatus,
	ApprovalType,
	DealStage,
	EnrollmentStatus,
	Icp,
	LeadStatus,
	ModelSettings,
	StepKind
} from '@oso-ahia/domain';

const timestamps = {
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
};

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
	image: text('image'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
		token: text('token').notNull().unique(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' })
	},
	(table) => [index('session_user_idx').on(table.userId)]
);

export const account = pgTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true, mode: 'date' }),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
			withTimezone: true,
			mode: 'date'
		}),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [index('account_user_idx').on(table.userId)]
);

export const verification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow()
});

export const workspaces = pgTable('workspaces', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	icp: jsonb('icp').$type<Icp>().notNull(),
	modelSettings: jsonb('model_settings').$type<ModelSettings>().notNull(),
	...timestamps
});

export const members = pgTable(
	'members',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		workspaceId: uuid('workspace_id')
			.notNull()
			.references(() => workspaces.id, { onDelete: 'cascade' }),
		userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
		email: text('email').notNull(),
		name: text('name').notNull(),
		role: text('role').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('members_workspace_idx').on(table.workspaceId),
		uniqueIndex('members_workspace_email_idx').on(table.workspaceId, table.email)
	]
);

export const leads = pgTable(
	'leads',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		workspaceId: uuid('workspace_id')
			.notNull()
			.references(() => workspaces.id, { onDelete: 'cascade' }),
		firstName: text('first_name').notNull(),
		lastName: text('last_name').notNull(),
		email: text('email').notNull(),
		title: text('title').notNull(),
		company: text('company').notNull(),
		domain: text('domain').notNull().default(''),
		linkedinUrl: text('linkedin_url').notNull().default(''),
		location: text('location').notNull().default(''),
		phone: text('phone').notNull().default(''),
		industry: text('industry').notNull().default(''),
		employeeCount: integer('employee_count').notNull().default(0),
		source: text('source').notNull().default('manual'),
		score: integer('score').notNull().default(0),
		icpFit: boolean('icp_fit').notNull().default(false),
		fitReasons: jsonb('fit_reasons').$type<string[]>().notNull().default([]),
		status: text('status').$type<LeadStatus>().notNull().default('new'),
		archived: boolean('archived').notNull().default(false),
		...timestamps
	},
	(table) => [
		index('leads_workspace_idx').on(table.workspaceId),
		index('leads_workspace_status_idx').on(table.workspaceId, table.status),
		uniqueIndex('leads_workspace_email_idx').on(table.workspaceId, table.email)
	]
);

export const lists = pgTable(
	'lists',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		workspaceId: uuid('workspace_id')
			.notNull()
			.references(() => workspaces.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		description: text('description').notNull().default(''),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [index('lists_workspace_idx').on(table.workspaceId)]
);

export const listLeads = pgTable(
	'list_leads',
	{
		listId: uuid('list_id')
			.notNull()
			.references(() => lists.id, { onDelete: 'cascade' }),
		leadId: uuid('lead_id')
			.notNull()
			.references(() => leads.id, { onDelete: 'cascade' }),
		addedAt: timestamp('added_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		primaryKey({ columns: [table.listId, table.leadId] }),
		index('list_leads_lead_idx').on(table.leadId)
	]
);

export const conversations = pgTable(
	'conversations',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		workspaceId: uuid('workspace_id')
			.notNull()
			.references(() => workspaces.id, { onDelete: 'cascade' }),
		userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
		title: text('title').notNull(),
		...timestamps
	},
	(table) => [index('conversations_workspace_idx').on(table.workspaceId)]
);

export const messages = pgTable(
	'messages',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		conversationId: uuid('conversation_id')
			.notNull()
			.references(() => conversations.id, { onDelete: 'cascade' }),
		role: text('role').notNull(),
		parts: jsonb('parts').$type<unknown[]>().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [index('messages_conversation_idx').on(table.conversationId)]
);

export const approvals = pgTable(
	'approvals',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		workspaceId: uuid('workspace_id')
			.notNull()
			.references(() => workspaces.id, { onDelete: 'cascade' }),
		type: text('type').$type<ApprovalType>().notNull(),
		status: text('status').$type<ApprovalStatus>().notNull().default('pending'),
		leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
		campaignId: uuid('campaign_id'),
		toEmail: text('to_email').notNull().default(''),
		subject: text('subject').notNull().default(''),
		body: text('body').notNull().default(''),
		note: text('note').notNull().default(''),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'date' })
	},
	(table) => [
		index('approvals_workspace_status_idx').on(table.workspaceId, table.status),
		index('approvals_lead_idx').on(table.leadId)
	]
);

export const campaigns = pgTable(
	'campaigns',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		workspaceId: uuid('workspace_id')
			.notNull()
			.references(() => workspaces.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		status: text('status').notNull().default('draft'),
		description: text('description').notNull().default(''),
		...timestamps
	},
	(table) => [index('campaigns_workspace_idx').on(table.workspaceId)]
);

export const sequenceSteps = pgTable(
	'sequence_steps',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		campaignId: uuid('campaign_id')
			.notNull()
			.references(() => campaigns.id, { onDelete: 'cascade' }),
		position: integer('position').notNull(),
		kind: text('kind').$type<StepKind>().notNull(),
		config: jsonb('config').$type<Record<string, unknown>>().notNull()
	},
	(table) => [index('sequence_steps_campaign_idx').on(table.campaignId, table.position)]
);

export const enrollments = pgTable(
	'enrollments',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		campaignId: uuid('campaign_id')
			.notNull()
			.references(() => campaigns.id, { onDelete: 'cascade' }),
		leadId: uuid('lead_id')
			.notNull()
			.references(() => leads.id, { onDelete: 'cascade' }),
		status: text('status').$type<EnrollmentStatus>().notNull().default('active'),
		stepIndex: integer('step_index').notNull().default(0),
		stepEnteredAt: timestamp('step_entered_at', { withTimezone: true, mode: 'date' })
			.notNull()
			.defaultNow(),
		sideEffectDone: boolean('side_effect_done').notNull().default(false),
		approvalId: uuid('approval_id').references(() => approvals.id, { onDelete: 'set null' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('enrollments_campaign_idx').on(table.campaignId),
		uniqueIndex('enrollments_campaign_lead_idx').on(table.campaignId, table.leadId)
	]
);

export const deals = pgTable(
	'deals',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		workspaceId: uuid('workspace_id')
			.notNull()
			.references(() => workspaces.id, { onDelete: 'cascade' }),
		leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
		title: text('title').notNull(),
		value: integer('value').notNull().default(0),
		stage: text('stage').$type<DealStage>().notNull().default('lead'),
		furthestStage: text('furthest_stage').$type<DealStage>().notNull().default('lead'),
		ownerName: text('owner_name').notNull().default(''),
		...timestamps
	},
	(table) => [
		index('deals_workspace_stage_idx').on(table.workspaceId, table.stage),
		index('deals_lead_idx').on(table.leadId)
	]
);

export const tasks = pgTable(
	'tasks',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		workspaceId: uuid('workspace_id')
			.notNull()
			.references(() => workspaces.id, { onDelete: 'cascade' }),
		leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
		title: text('title').notNull(),
		notes: text('notes').notNull().default(''),
		dueAt: timestamp('due_at', { withTimezone: true, mode: 'date' }),
		assigneeName: text('assignee_name').notNull().default(''),
		status: text('status').notNull().default('open'),
		source: text('source').notNull().default('manual'),
		recurrence: text('recurrence').notNull().default('none'),
		lastFiredAt: timestamp('last_fired_at', { withTimezone: true, mode: 'date' }),
		completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [
		index('tasks_workspace_status_idx').on(table.workspaceId, table.status),
		index('tasks_due_idx').on(table.workspaceId, table.dueAt)
	]
);

export const activities = pgTable(
	'activities',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		workspaceId: uuid('workspace_id')
			.notNull()
			.references(() => workspaces.id, { onDelete: 'cascade' }),
		kind: text('kind').notNull(),
		summary: text('summary').notNull(),
		actor: text('actor').notNull().default('System'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
	},
	(table) => [index('activities_workspace_idx').on(table.workspaceId, table.createdAt)]
);

export const connections = pgTable(
	'connections',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		workspaceId: uuid('workspace_id')
			.notNull()
			.references(() => workspaces.id, { onDelete: 'cascade' }),
		toolkit: text('toolkit').notNull(),
		status: text('status').notNull().default('disconnected'),
		mode: text('mode').notNull().default('live'),
		externalId: text('external_id'),
		detail: text('detail').notNull().default(''),
		connectedAt: timestamp('connected_at', { withTimezone: true, mode: 'date' })
	},
	(table) => [uniqueIndex('connections_workspace_toolkit_idx').on(table.workspaceId, table.toolkit)]
);

export const apiKeys = pgTable(
	'api_keys',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		workspaceId: uuid('workspace_id')
			.notNull()
			.references(() => workspaces.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		prefix: text('prefix').notNull(),
		hash: text('hash').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'date' })
	},
	(table) => [index('api_keys_workspace_idx').on(table.workspaceId)]
);
