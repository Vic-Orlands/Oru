import { fail, redirect } from '@sveltejs/kit';
import { createConversation, listConversations } from '@oso-ahia/db';
import { db } from '#lib/server/db.js';
import { requireDesk } from '#lib/server/guard.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { workspace } = requireDesk(locals);
	const conversations = await listConversations(db, workspace.id);
	return {
		conversations: conversations.map((row) => ({
			id: row.id,
			title: row.title,
			updatedAt: row.updatedAt.toISOString()
		}))
	};
};

export const actions: Actions = {
	create: async ({ locals }) => {
		const { workspace, user } = requireDesk(locals);
		const conversation = await createConversation(db, workspace.id, user.id, 'New thread');
		if (!conversation) return fail(500, { message: 'Could not start a thread.' });
		redirect(303, `/app/agent/${conversation.id}`);
	}
};
