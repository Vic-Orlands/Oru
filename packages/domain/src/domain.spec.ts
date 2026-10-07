import { describe, expect, it } from 'vitest';
import { assertTransition, canTransition } from './approvals.js';
import { DISCOVERY_POOL, queryTokens, searchProspects } from './corpus.js';
import { planAgentTurn } from './agent-plan.js';
import { prospectsFromCsv } from './csv.js';
import { dedupeKey, partitionNew } from './dedupe.js';
import { funnelFromFurthest, furthestStage } from './funnel.js';
import { judgeHeuristic } from './judge.js';
import { advanceEnrollment, decideEnrollment, type EnrollmentView, type SequenceStep } from './sequence.js';
import { DEFAULT_ICP, type Prospect } from './types.js';

const prospect = (overrides: Partial<Prospect> = {}): Prospect => ({
	firstName: 'Amara',
	lastName: 'Diallo',
	email: 'amara.diallo@kolaform.com',
	title: 'VP Sales',
	company: 'Kolaform',
	domain: 'kolaform.com',
	linkedinUrl: 'https://www.linkedin.com/in/amara-diallo',
	location: 'Lagos',
	industry: 'fintech',
	employeeCount: 140,
	phone: '',
	...overrides
});

const steps: SequenceStep[] = [
	{ kind: 'email', config: { subject: 'Hello', body: 'Hi' } },
	{ kind: 'wait', config: { days: 2 } },
	{ kind: 'condition', config: { if: 'replied', then: 'stop' } },
	{ kind: 'task', config: { title: 'Call', notes: 'After silence' } }
];

function enrollment(overrides: Partial<EnrollmentView> = {}): EnrollmentView {
	return {
		status: 'active',
		stepIndex: 0,
		stepEnteredAt: 0,
		sideEffectDone: false,
		approvalStatus: null,
		leadStatus: 'contacted',
		...overrides
	};
}

describe('dedupe', () => {
	it('prefers email, then linkedin, then name', () => {
		expect(dedupeKey({ email: 'A@B.com', linkedinUrl: 'https://x' })).toBe('email:a@b.com');
		expect(dedupeKey({ linkedinUrl: 'https://li/in/A/' })).toBe('li:https://li/in/a');
		expect(dedupeKey({ firstName: 'Ada', lastName: 'O', company: 'Kola' })).toBe('name:ada|o|kola');
	});

	it('partitions duplicates inside the same batch', () => {
		const rows = [prospect(), prospect({ firstName: 'Other' }), prospect()];
		const { fresh, duplicates } = partitionNew(rows, [], dedupeKey);
		expect(fresh).toHaveLength(1);
		expect(duplicates).toHaveLength(2);
	});
});

describe('judge', () => {
	it('fits a mid-market VP in a target industry', () => {
		const result = judgeHeuristic(prospect(), DEFAULT_ICP);
		expect(result.fit).toBe(true);
		expect(result.score).toBeGreaterThanOrEqual(70);
		expect(result.source).toBe('heuristic');
	});

	it('rejects a tiny founder in the wrong industry', () => {
		const result = judgeHeuristic(
			prospect({ title: 'Founder', industry: 'healthtech', employeeCount: 8, location: 'Tokyo' }),
			DEFAULT_ICP
		);
		expect(result.fit).toBe(false);
		expect(result.reasons.length).toBeGreaterThan(0);
	});
});

describe('funnel', () => {
	it('computes stage-to-stage rates from furthest progress', () => {
		const steps = funnelFromFurthest(['won', 'meeting', 'lead', 'lost']);
		const first = steps[0];
		expect(first?.fromCount).toBe(3);
		expect(first?.to).toBe('qualified');
		expect(furthestStage('proposal', 'meeting')).toBe('proposal');
		expect(furthestStage('qualified', 'proposal')).toBe('proposal');
		expect(furthestStage('lost', 'meeting')).toBe('meeting');
	});
});

describe('approvals', () => {
	it('only allows pending to approved or rejected, then approved to sent', () => {
		expect(canTransition('pending', 'approved')).toBe(true);
		expect(canTransition('pending', 'sent')).toBe(false);
		expect(canTransition('approved', 'sent')).toBe(true);
		expect(canTransition('rejected', 'approved')).toBe(false);
		expect(() => assertTransition('sent', 'pending')).toThrow(/Cannot move/);
	});
});

describe('sequence', () => {
	it('holds an email step until the approval is sent', () => {
		expect(decideEnrollment(steps, enrollment(), 0).type).toBe('create_approval');
		expect(decideEnrollment(steps, enrollment({ approvalStatus: 'pending' }), 0).type).toBe('hold');
		expect(decideEnrollment(steps, enrollment({ approvalStatus: 'sent' }), 0).type).toBe('advance');
		expect(decideEnrollment(steps, enrollment({ approvalStatus: 'rejected' }), 0).type).toBe('stop');
	});

	it('advances a wait only after the delay', () => {
		const waiting = enrollment({ stepIndex: 1, stepEnteredAt: 0 });
		expect(decideEnrollment(steps, waiting, 86_400_000).type).toBe('hold');
		expect(decideEnrollment(steps, waiting, 2 * 86_400_000).type).toBe('advance');
	});

	it('stops a replied lead on a stop condition and completes after the last step', () => {
		expect(
			decideEnrollment(steps, enrollment({ stepIndex: 2, leadStatus: 'replied' }), 0).type
		).toBe('stop');
		expect(
			decideEnrollment(steps, enrollment({ stepIndex: 2, leadStatus: 'contacted' }), 0).type
		).toBe('advance');
		const task = decideEnrollment(steps, enrollment({ stepIndex: 3 }), 0);
		expect(task).toEqual({ type: 'create_task', title: 'Call', notes: 'After silence' });
		const done = advanceEnrollment(steps, enrollment({ stepIndex: 3 }), 10);
		expect(done.status).toBe('completed');
	});
});

describe('csv', () => {
	it('maps headers and skips rows without an email', () => {
		const csv = `first_name,last_name,email,title,company\nAda,Okeke,ada@kola.com,VP Sales,Kola\nNo,Email,,Founder,Nope\n`;
		const parsed = prospectsFromCsv(csv);
		expect(parsed.prospects).toHaveLength(1);
		expect(parsed.prospects[0]?.email).toBe('ada@kola.com');
		expect(parsed.skipped).toBe(1);
	});
});

describe('agent plan', () => {
	it('routes obvious intents to tools', () => {
		expect(planAgentTurn('find fintech leads in Lagos').tool).toBe('findLeads');
		expect(planAgentTurn('draft an email to Amara').tool).toBe('draftEmail');
		expect(planAgentTurn('create a task to call Friday').tool).toBe('createTask');
		expect(planAgentTurn('how is the campaign doing').tool).toBe('campaignSummary');
		expect(planAgentTurn('hello').tool).toBeUndefined();
	});
});

describe('search', () => {
	it('drops filler words so an agent prompt still matches', () => {
		expect(queryTokens('find fintech VPs in Lagos')).toEqual(['fintech', 'vp', 'lago']);
		const hits = searchProspects(DISCOVERY_POOL, { text: 'find fintech VPs in Lagos' });
		expect(hits.length).toBeGreaterThan(0);
		expect(hits.every((person) => person.location === 'Lagos' || person.industry === 'fintech')).toBe(true);
	});
});
