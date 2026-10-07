import { fail, redirect } from '@sveltejs/kit';
import { createList, listLists } from '@oso-ahia/db';
import { db } from '#lib/server/db.js';
import { requireDesk } from '#lib/server/guard.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { workspace } = requireDesk(locals);
	return { lists: await listLists(db, workspace.id) };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { workspace } = requireDesk(locals);
		const data = await request.formData();
		const name = String(data.get('name') ?? '');
		const description = String(data.get('description') ?? '');
		try {
			const list = await createList(db, workspace.id, name, description);
			if (!list) return fail(500, { message: 'Could not create the list.' });
			redirect(303, `/app/lists/${list.id}`);
		} catch (error) {
			if (error && typeof error === 'object' && 'status' in error) throw error;
			return fail(400, {
				message: error instanceof Error ? error.message : 'Could not create the list.'
			});
		}
	}
};
