import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value ?? '';

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'Postgres connection string.',
		schema: (value) => {
			if (!value) throw new Error('DATABASE_URL is required.');
			return value;
		}
	},
	BETTER_AUTH_SECRET: {
		description: 'Secret used to sign sessions. Use at least 32 characters.',
		schema: (value) => {
			if (!value || value.length < 32) {
				throw new Error('BETTER_AUTH_SECRET must be at least 32 characters.');
			}
			return value;
		}
	},
	BETTER_AUTH_URL: {
		description: 'Public origin of this app, for example http://localhost:5173.',
		schema: (value) => value || 'http://localhost:5173'
	},
	GOOGLE_CLIENT_ID: {
		description: 'Google OAuth client id. Leave empty to hide Google sign-in.',
		schema: optional
	},
	GOOGLE_CLIENT_SECRET: {
		description: 'Google OAuth client secret.',
		schema: optional
	},
	OPENROUTER_API_KEY: {
		description: 'OpenRouter API key. When empty, the agent and judge run in demo mode.',
		schema: optional
	},
	OPENROUTER_CHAT_MODEL: {
		description: 'Main agent model. Default is moonshotai/kimi-k2.5.',
		schema: (value) => value || 'moonshotai/kimi-k2.5'
	},
	OPENROUTER_JUDGE_MODEL: {
		description: 'Fast decision model for yes/no classification. Default is typesafe/jev-1.13.',
		schema: (value) => value || 'typesafe/jev-1.13'
	},
	OPENROUTER_JUDGE_FALLBACK_MODEL: {
		description: 'Chat model used with generateObject if the Decisions API is unavailable.',
		schema: (value) => value || 'google/gemini-2.5-flash-lite'
	},
	COMPOSIO_API_KEY: {
		description: 'Composio API key for live inbox, CRM, and calendar connections.',
		schema: optional
	},
	DEMO_MODE: {
		description: 'Allow demo sign-in and simulated integrations. Set to false in production.',
		schema: (value) => value !== 'false'
	},
	DEMO_USER_EMAIL: {
		description: 'Email for the seeded demo owner.',
		schema: (value) => value || 'chimezie@osoahia.dev'
	},
	DEMO_USER_PASSWORD: {
		description: 'Password for demo sign-in. Shown on the landing page when demo mode is on.',
		schema: (value) => value || 'oso-ahia-demo-password'
	},
	CRON_SECRET: {
		description: 'Shared secret for POST /api/cron. The worker sends this header.',
		schema: (value) => value || 'dev-cron-secret'
	}
});
