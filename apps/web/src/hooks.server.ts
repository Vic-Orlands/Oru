import type { Handle } from '@sveltejs/kit/hooks';
import { building } from '$app/env';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { claimWorkspace } from '@oso-ahia/db';
import { auth } from '#lib/server/auth.js';
import { db } from '#lib/server/db.js';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	if (building) return resolve(event);
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}
	return svelteKitHandler({ event, resolve, auth, building });
};

const handleWorkspace: Handle = async ({ event, resolve }) => {
	if (event.locals.user) {
		event.locals.workspace = await claimWorkspace(db, {
			id: event.locals.user.id,
			email: event.locals.user.email,
			name: event.locals.user.name
		});
	}
	if (event.url.pathname.startsWith('/app') && !event.locals.user) {
		redirect(303, '/');
	}
	return resolve(event);
};

export const handle: Handle = sequence(handleBetterAuth, handleWorkspace);
