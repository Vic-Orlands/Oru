import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import type { Actions, PageServerLoad } from './$types';
import { auth, googleAuthEnabled } from '#lib/server/auth.js';
import { flags } from '#lib/server/flags.js';

export const load: PageServerLoad = ({ locals }) => {
	const state = flags();
	return {
		signedIn: Boolean(locals.user),
		google: googleAuthEnabled,
		demo: state.demo,
		demoEmail: state.demoEmail,
		demoPassword: state.demoPassword
	};
};

export const actions: Actions = {
	demo: async () => {
		const state = flags();
		if (!state.demo) {
			return fail(403, { message: 'Demo sign-in is off. Use Google or set DEMO_MODE=true.' });
		}
		try {
			await auth.api.signInEmail({
				body: { email: state.demoEmail, password: state.demoPassword }
			});
		} catch {
			try {
				await auth.api.signUpEmail({
					body: {
						email: state.demoEmail,
						password: state.demoPassword,
						name: 'Chimezie'
					}
				});
			} catch (error) {
				const message = error instanceof APIError ? error.message : 'Demo sign-in failed.';
				return fail(400, { message });
			}
		}
		redirect(303, '/app');
	},
	google: async () => {
		if (!googleAuthEnabled) {
			return fail(400, {
				message: 'Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google.'
			});
		}
		const result = await auth.api.signInSocial({
			body: { provider: 'google', callbackURL: '/app' }
		});
		if (result.url) redirect(302, result.url);
		return fail(500, { message: 'Google did not return a sign-in URL.' });
	},
	signOut: async (event) => {
		await auth.api.signOut({ headers: event.request.headers });
		redirect(303, '/');
	}
};
