import { fail } from '@sveltejs/kit';
import { assertTransition } from '@oso-ahia/domain';
import { getApproval, listApprovals, patchApproval } from '@oso-ahia/db';
import { db } from '#lib/server/db.js';
import { requireDesk } from '#lib/server/guard.js';
import { sendApproval } from '#lib/server/send.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { workspace } = requireDesk(locals);
	const status = url.searchParams.get('status') ?? 'pending';
	const rows = await listApprovals(db, workspace.id, status === 'all' ? undefined : status);
	return {
		status,
		rows: rows.map((row) => ({
			...row.approval,
			createdAt: row.approval.createdAt.toISOString(),
			resolvedAt: row.approval.resolvedAt?.toISOString() ?? null,
			person: [row.leadFirst, row.leadLast].filter(Boolean).join(' '),
			company: row.company ?? ''
		}))
	};
};

export const actions: Actions = {
	edit: async ({ request, locals }) => {
		const { workspace } = requireDesk(locals);
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		const current = await getApproval(db, workspace.id, id);
		if (!current) return fail(404, { message: 'Approval not found.' });
		if (current.status === 'sent' || current.status === 'rejected') {
			return fail(400, { message: 'This item is already closed.' });
		}
		await patchApproval(db, workspace.id, id, {
			subject: String(data.get('subject') ?? current.subject),
			body: String(data.get('body') ?? current.body)
		});
		return { message: 'Draft updated.' };
	},
	decide: async ({ request, locals }) => {
		const { workspace } = requireDesk(locals);
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		const next = String(data.get('next') ?? '');
		const current = await getApproval(db, workspace.id, id);
		if (!current) return fail(404, { message: 'Approval not found.' });
		if (next !== 'approved' && next !== 'rejected')
			return fail(400, { message: 'Choose approve or reject.' });
		try {
			assertTransition(current.status, next);
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Cannot update this item.'
			});
		}
		await patchApproval(db, workspace.id, id, { status: next, resolvedAt: new Date() });
		return {
			message: next === 'approved' ? 'Approved. It can be sent.' : 'Rejected. It will not send.'
		};
	},
	send: async ({ request, locals }) => {
		const { workspace, user } = requireDesk(locals);
		const id = String((await request.formData()).get('id') ?? '');
		try {
			const detail = await sendApproval(db, workspace.id, id, user.name, user.id);
			return { message: detail };
		} catch (error) {
			return fail(400, { message: error instanceof Error ? error.message : 'Send failed.' });
		}
	}
};
