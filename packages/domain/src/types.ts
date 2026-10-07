export const LEAD_STATUSES = [
	'new',
	'qualified',
	'contacted',
	'replied',
	'meeting',
	'unqualified'
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const DEAL_STAGES = [
	'lead',
	'qualified',
	'meeting',
	'proposal',
	'negotiation',
	'won',
	'lost'
] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export const HAPPY_PATH_STAGES = [
	'lead',
	'qualified',
	'meeting',
	'proposal',
	'negotiation',
	'won'
] as const;

export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected', 'sent'] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const APPROVAL_TYPES = ['email', 'crm_sync', 'meeting', 'slack'] as const;
export type ApprovalType = (typeof APPROVAL_TYPES)[number];

export const STEP_KINDS = ['email', 'wait', 'condition', 'task'] as const;
export type StepKind = (typeof STEP_KINDS)[number];

export const ENROLLMENT_STATUSES = [
	'active',
	'waiting_approval',
	'paused',
	'completed',
	'stopped'
] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export type Icp = {
	titles: string[];
	industries: string[];
	geos: string[];
	minEmployees: number;
	maxEmployees: number;
	notes: string;
};

export type ModelSettings = {
	chatModel: string;
	judgeModel: string;
};

export type Prospect = {
	firstName: string;
	lastName: string;
	email: string;
	title: string;
	company: string;
	domain: string;
	linkedinUrl: string;
	location: string;
	industry: string;
	employeeCount: number;
	phone: string;
};

export type JudgeResult = {
	fit: boolean;
	score: number;
	confidence: number;
	reasons: string[];
	source: 'jev' | 'fallback' | 'heuristic';
};

export const DEFAULT_ICP: Icp = {
	titles: [
		'vp sales',
		'head of sales',
		'head of growth',
		'cro',
		'revops',
		'revenue operations'
	],
	industries: ['fintech', 'saas', 'developer tools', 'logistics'],
	geos: ['lagos', 'accra', 'nairobi', 'london', 'berlin', 'new york', 'austin'],
	minEmployees: 30,
	maxEmployees: 800,
	notes: 'Mid-market B2B teams standing up a real sales desk. Prefer companies already running outbound. Skip tiny founder-led shops unless a senior revenue leader is in seat.'
};

export const DEFAULT_MODELS: ModelSettings = {
	chatModel: '',
	judgeModel: ''
};
