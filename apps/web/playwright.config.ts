import { defineConfig, devices } from '@playwright/test';

const origin = 'http://127.0.0.1:4173';

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.ts',
	timeout: 60_000,
	use: {
		baseURL: origin,
		...devices['Desktop Chrome']
	},
	webServer: {
		command: 'pnpm exec vite build && pnpm exec vite preview --host 127.0.0.1 --port 4173',
		url: origin,
		timeout: 180_000,
		reuseExistingServer: false,
		env: {
			...process.env,
			DATABASE_URL:
				process.env.DATABASE_URL ?? 'postgres://root:mysecretpassword@127.0.0.1:5432/local',
			BETTER_AUTH_SECRET:
				process.env.BETTER_AUTH_SECRET ?? 'dev-secret-oso-ahia-please-change-this-value',
			BETTER_AUTH_URL: origin,
			ORIGIN: origin,
			DEMO_MODE: 'true',
			OPENROUTER_API_KEY: '',
			COMPOSIO_API_KEY: '',
			GOOGLE_CLIENT_ID: '',
			GOOGLE_CLIENT_SECRET: ''
		}
	}
});
