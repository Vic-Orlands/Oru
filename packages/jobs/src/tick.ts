import {
	advanceEnrollment,
	decideEnrollment,
	type EnrollmentView,
	type SequenceStep
} from '@oso-ahia/domain';
import {
	activeEnrollments,
	approvals,
	createApproval,
	createTask,
	dueTasks,
	enrollments,
	getDb,
	logActivity,
	stepsForCampaign,
	tasks
} from '@oso-ahia/db';
import { eq } from 'drizzle-orm';

export type TickResult = {
	approvals: number;
	tasks: number;
	advanced: number;
	reminders: number;
};

export async function runTick(now = new Date()): Promise<TickResult> {
	const db = getDb();
	const result: TickResult = { approvals: 0, tasks: 0, advanced: 0, reminders: 0 };
	const rows = await activeEnrollments(db);
	const stepsCache = new Map<string, SequenceStep[]>();

	for (const row of rows) {
		if (row.enrollment.status === 'paused') continue;
		let steps = stepsCache.get(row.enrollment.campaignId);
		if (!steps) {
			const stored = await stepsForCampaign(db, row.enrollment.campaignId);
			steps = stored.map((step) => ({ kind: step.kind, config: step.config }));
			stepsCache.set(row.enrollment.campaignId, steps);
		}
		let approvalStatus: EnrollmentView['approvalStatus'] = null;
		if (row.enrollment.approvalId) {
			const [approval] = await db
				.select()
				.from(approvals)
				.where(eq(approvals.id, row.enrollment.approvalId));
			approvalStatus = approval?.status ?? null;
		}
		const view: EnrollmentView = {
			status: row.enrollment.status,
			stepIndex: row.enrollment.stepIndex,
			stepEnteredAt: row.enrollment.stepEnteredAt.getTime(),
			sideEffectDone: row.enrollment.sideEffectDone,
			approvalStatus,
			leadStatus: row.leadStatus
		};
		const action = decideEnrollment(steps, view, now.getTime());
		if (action.type === 'create_approval') {
			const step = steps[view.stepIndex];
			const approval = await createApproval(db, {
				workspaceId: row.workspaceId,
				type: 'email',
				leadId: row.enrollment.leadId,
				campaignId: row.enrollment.campaignId,
				subject: typeof step?.config.subject === 'string' ? step.config.subject : 'Hello',
				body: typeof step?.config.body === 'string' ? step.config.body : ''
			});
			await db
				.update(enrollments)
				.set({ status: 'waiting_approval', approvalId: approval.id, sideEffectDone: true })
				.where(eq(enrollments.id, row.enrollment.id));
			result.approvals += 1;
		} else if (action.type === 'create_task') {
			await createTask(db, {
				workspaceId: row.workspaceId,
				title: action.title,
				notes: action.notes,
				source: 'agent',
				leadId: row.enrollment.leadId,
				dueAt: now
			});
			await db
				.update(enrollments)
				.set({ sideEffectDone: true })
				.where(eq(enrollments.id, row.enrollment.id));
			result.tasks += 1;
		} else if (action.type === 'advance' || action.type === 'complete') {
			const next = advanceEnrollment(steps, view, now.getTime());
			await db
				.update(enrollments)
				.set({
					status: next.status,
					stepIndex: next.stepIndex,
					stepEnteredAt: new Date(next.stepEnteredAt),
					sideEffectDone: false,
					approvalId: null
				})
				.where(eq(enrollments.id, row.enrollment.id));
			result.advanced += 1;
		} else if (action.type === 'stop') {
			await db
				.update(enrollments)
				.set({ status: 'stopped' })
				.where(eq(enrollments.id, row.enrollment.id));
		}
	}

	const due = await dueTasks(db, now);
	for (const task of due) {
		if (task.lastFiredAt && task.dueAt && task.lastFiredAt >= task.dueAt) continue;
		if (task.recurrence === 'none' && task.source !== 'schedule') continue;
		await logActivity(db, {
			workspaceId: task.workspaceId,
			kind: 'task_due',
			summary: `Scheduled task is due: ${task.title}`,
			actor: 'Worker',
			createdAt: now
		});
		await db.update(tasks).set({ lastFiredAt: now }).where(eq(tasks.id, task.id));
		result.reminders += 1;
	}

	return result;
}
