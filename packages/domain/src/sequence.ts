import type { EnrollmentStatus } from './types.js';

export type SequenceStep = {
	kind: 'email' | 'wait' | 'condition' | 'task';
	config: Record<string, unknown>;
};

export type EnrollmentView = {
	status: EnrollmentStatus;
	stepIndex: number;
	stepEnteredAt: number;
	sideEffectDone: boolean;
	approvalStatus: 'pending' | 'approved' | 'rejected' | 'sent' | null;
	leadStatus: string;
};

export type TickAction =
	| { type: 'hold' }
	| { type: 'create_approval' }
	| { type: 'create_task'; title: string; notes: string }
	| { type: 'advance' }
	| { type: 'complete' }
	| { type: 'stop' };

export function decideEnrollment(
	steps: SequenceStep[],
	enrollment: EnrollmentView,
	now: number
): TickAction {
	if (
		enrollment.status === 'paused' ||
		enrollment.status === 'completed' ||
		enrollment.status === 'stopped'
	) {
		return { type: 'hold' };
	}
	if (enrollment.stepIndex >= steps.length) return { type: 'complete' };
	const step = steps[enrollment.stepIndex];
	if (!step) return { type: 'complete' };

	if (step.kind === 'email') {
		if (!enrollment.approvalStatus) return { type: 'create_approval' };
		if (enrollment.approvalStatus === 'pending' || enrollment.approvalStatus === 'approved') {
			return { type: 'hold' };
		}
		if (enrollment.approvalStatus === 'rejected') return { type: 'stop' };
		return { type: 'advance' };
	}

	if (step.kind === 'wait') {
		const days = typeof step.config.days === 'number' ? step.config.days : 1;
		const due = enrollment.stepEnteredAt + days * 86_400_000;
		return now >= due ? { type: 'advance' } : { type: 'hold' };
	}

	if (step.kind === 'condition') {
		const gate = step.config.if === 'meeting' ? 'meeting' : 'replied';
		const matched =
			enrollment.leadStatus === gate || (gate === 'replied' && enrollment.leadStatus === 'meeting');
		if (matched && step.config.then !== 'continue') return { type: 'stop' };
		return { type: 'advance' };
	}

	if (!enrollment.sideEffectDone) {
		return {
			type: 'create_task',
			title: typeof step.config.title === 'string' ? step.config.title : 'Sequence task',
			notes: typeof step.config.notes === 'string' ? step.config.notes : ''
		};
	}
	return { type: 'advance' };
}

export function advanceEnrollment(
	steps: SequenceStep[],
	enrollment: EnrollmentView,
	now: number
): EnrollmentView {
	const next: EnrollmentView = {
		...enrollment,
		stepIndex: enrollment.stepIndex + 1,
		stepEnteredAt: now,
		sideEffectDone: false,
		approvalStatus: null,
		status: 'active'
	};
	if (next.stepIndex >= steps.length) {
		return { ...next, status: 'completed' };
	}
	return next;
}
