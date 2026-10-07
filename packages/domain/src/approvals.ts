import type { ApprovalStatus } from './types.js';

const EDGES: Record<ApprovalStatus, ApprovalStatus[]> = {
	pending: ['approved', 'rejected'],
	approved: ['sent'],
	rejected: [],
	sent: []
};

export function canTransition(from: ApprovalStatus, to: ApprovalStatus): boolean {
	return EDGES[from].includes(to);
}

export function assertTransition(from: ApprovalStatus, to: ApprovalStatus): void {
	if (!canTransition(from, to)) {
		throw new Error(`Cannot move an approval from ${from} to ${to}.`);
	}
}
