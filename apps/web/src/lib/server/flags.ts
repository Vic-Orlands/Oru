import {
	COMPOSIO_API_KEY,
	DEMO_MODE,
	DEMO_USER_EMAIL,
	DEMO_USER_PASSWORD,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	OPENROUTER_API_KEY,
	OPENROUTER_CHAT_MODEL,
	OPENROUTER_JUDGE_FALLBACK_MODEL,
	OPENROUTER_JUDGE_MODEL
} from '$app/env/private';

export function flags() {
	const openRouter = Boolean(OPENROUTER_API_KEY);
	const composio = Boolean(COMPOSIO_API_KEY);
	const google = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
	return {
		demo: DEMO_MODE,
		openRouter,
		composio,
		google,
		chatModel: OPENROUTER_CHAT_MODEL,
		judgeModel: OPENROUTER_JUDGE_MODEL,
		judgeFallbackModel: OPENROUTER_JUDGE_FALLBACK_MODEL,
		demoEmail: DEMO_USER_EMAIL,
		demoPassword: DEMO_USER_PASSWORD,
		aiMode: openRouter && !DEMO_MODE ? 'live' : openRouter ? 'live' : 'demo'
	};
}

export function resolvedModels(settings: { chatModel: string; judgeModel: string }) {
	const current = flags();
	return {
		chatModel: settings.chatModel || current.chatModel,
		judgeModel: settings.judgeModel || current.judgeModel,
		demoAi: !current.openRouter
	};
}
