import { error } from '@sveltejs/kit';
import { getConversation, listConversations } from '@oso-ahia/db';
import type { UIMessage } from 'ai';
import { db } from '#lib/server/db.js';
import { requireDesk } from '#lib/server/guard.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { workspace } = requireDesk(locals);
	const record = await getConversation(db, workspace.id, params.id);
	if (!record) error(404, 'Thread not found.');
	const conversations = await listConversations(db, workspace.id);
	const messages: UIMessage[] = record.messages.map((message) => ({
		id: message.id,
		role: message.role as UIMessage['role'],
		parts: message.parts as UIMessage['parts']
	}));
	return {
		conversation: { id: record.conversation.id, title: record.conversation.title },
		messages,
		conversations: conversations.map((row) => ({
			id: row.id,
			title: row.title,
			updatedAt: row.updatedAt.toISOString()
		}))
	};
};
