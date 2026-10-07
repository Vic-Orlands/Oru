import {
	BETTER_AUTH_SECRET,
	BETTER_AUTH_URL,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET
} from '$app/env/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { account, session, user, verification } from '@oso-ahia/db';
import { db } from './db.js';

const googleReady = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
	baseURL: BETTER_AUTH_URL,
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: { user, session, account, verification }
	}),
	emailAndPassword: { enabled: true },
	socialProviders: googleReady
		? {
				google: {
					clientId: GOOGLE_CLIENT_ID,
					clientSecret: GOOGLE_CLIENT_SECRET
				}
			}
		: undefined,
	plugins: [sveltekitCookies(getRequestEvent)]
});

export const googleAuthEnabled = googleReady;
