import { fail } from '@sveltejs/kit';
import { completeTask, createTask, listTasks } from '@oso-ahia/db';
import { db } from '#lib/server/db.js';
import { requireDesk } from '#lib/server/guard.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { workspace } = requireDesk(locals);
	const rows = await listTasks(db, workspace.id);
	return {
		view: url.searchParams.get('view') === 'calendar' ? 'calendar' : 'list',
		tasks: rows.map((task) => ({
			id: task.id,
			title: task.title,
			notes: task.notes,
			status: task.status,
			source: task.source,
			recurrence: task.recurrence,
			assigneeName: task.assigneeName,
			dueAt: task.dueAt?.toISOString() ?? null
		}))
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { workspace, user } = requireDesk(locals);
		const data = await request.formData();
		const due = String(data.get('due') ?? '');
		try {
			await createTask(db, {
				workspaceId: workspace.id,
				title: String(data.get('title') ?? ''),
				notes: String(data.get('notes') ?? ''),
				dueAt: due ? new Date(due) : null,
				assigneeName: String(data.get('assignee') ?? user.name),
				source: 'manual',
				recurrence: String(data.get('recurrence') ?? 'none')
			});
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Could not add the task.'
			});
		}
		return { message: 'Task added.' };
	},
	complete: async ({ request, locals }) => {
		const { workspace } = requireDesk(locals);
		const id = String((await request.formData()).get('id') ?? '');
		try {
			await completeTask(db, workspace.id, id);
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Could not complete the task.'
			});
		}
		return { message: 'Task updated.' };
	}
};
