import { error, fail } from '@sveltejs/kit';
import { getList, queryLeads, removeLeadsFromList } from '@oso-ahia/db';
import { db } from '$lib/server/db';
import { requireDesk } from '$lib/server/guard';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { workspace } = requireDesk(locals);
	const list = await getList(db, workspace.id, params.id);
	if (!list) error(404, 'List not found.');
	const result = await queryLeads(db, workspace.id, { listId: list.id, pageSize: 50 });
	return { list, rows: result.rows, total: result.total };
};

export const actions: Actions = {
	remove: async ({ request, locals, params }) => {
		const { workspace } = requireDesk(locals);
		const selected = (await request.formData()).getAll('ids').map(String);
		if (selected.length === 0) return fail(400, { message: 'Select leads to remove.' });
		await removeLeadsFromList(db, workspace.id, params.id, selected);
		return { message: 'Removed from the list.' };
	}
};
