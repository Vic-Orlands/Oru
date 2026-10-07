import { listApprovals } from '@oso-ahia/db';
import { flags } from '#lib/server/flags.js';
import { db } from '#lib/server/db.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user || !locals.workspace) {
		return { desk: null };
	}
	const pending = await listApprovals(db, locals.workspace.id, 'pending');
	const state = flags();
	let notice: string | null = null;
	if (state.demo && !state.openRouter) {
		notice = 'Demo mode. The agent and judge use a local stand-in until OPENROUTER_API_KEY is set.';
	} else if (state.demo && !state.composio) {
		notice = 'Models can run live. Inbox and CRM stays simulated until COMPOSIO_API_KEY is set.';
	}
	return {
		desk: {
			workspace: locals.workspace.name,
			userName: locals.user.name,
			pending: pending.length,
			notice
		}
	};
};
