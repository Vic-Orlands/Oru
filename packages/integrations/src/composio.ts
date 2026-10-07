import type { Toolkit } from './toolkits.js';

const BASE = 'https://backend.composio.dev/api/v3';

type Json = Record<string, unknown>;

async function composio<T>(apiKey: string, path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`${BASE}${path}`, {
		...init,
		headers: {
			'x-api-key': apiKey,
			'Content-Type': 'application/json',
			...(init?.headers ?? {})
		}
	});
	const text = await response.text();
	const body = text ? (JSON.parse(text) as T) : ({} as T);
	if (!response.ok) {
		const message =
			typeof body === 'object' && body && 'error' in body
				? JSON.stringify((body as Json).error)
				: text.slice(0, 280);
		throw new Error(`Composio ${response.status}: ${message}`);
	}
	return body;
}

export async function connectToolkit(options: {
	apiKey: string;
	userId: string;
	toolkit: Toolkit;
	callbackUrl: string;
}): Promise<{ redirectUrl: string }> {
	const listed = await composio<{ items?: { id: string }[] }>(
		options.apiKey,
		`/auth_configs?toolkit_slug=${options.toolkit.slug}&limit=1`
	);
	let authConfigId = listed.items?.[0]?.id;
	if (!authConfigId) {
		const created = await composio<{ id?: string; auth_config?: { id?: string } }>(
			options.apiKey,
			'/auth_configs',
			{
				method: 'POST',
				body: JSON.stringify({
					toolkit: { slug: options.toolkit.slug.toLowerCase() },
					auth_scheme: options.toolkit.auth === 'api_key' ? 'API_KEY' : 'OAUTH2',
					type: options.toolkit.managed ? 'use_composio_managed_auth' : 'use_custom_auth'
				})
			}
		);
		authConfigId = created.auth_config?.id ?? created.id;
	}
	if (!authConfigId) {
		throw new Error(`Composio did not return an auth config for ${options.toolkit.name}.`);
	}
	const link = await composio<{ redirect_url?: string; redirectUrl?: string; connectionData?: { val?: { redirectUrl?: string } } }>(
		options.apiKey,
		'/connected_accounts/link',
		{
			method: 'POST',
			body: JSON.stringify({
				auth_config_id: authConfigId,
				user_id: options.userId,
				callback_url: options.callbackUrl
			})
		}
	);
	const redirectUrl =
		link.redirect_url ?? link.redirectUrl ?? link.connectionData?.val?.redirectUrl ?? '';
	if (!redirectUrl) {
		throw new Error(`Composio did not return a connect link for ${options.toolkit.name}.`);
	}
	return { redirectUrl };
}

export async function executeTool(options: {
	apiKey: string;
	userId: string;
	tool: string;
	arguments: Record<string, unknown>;
}): Promise<unknown> {
	return composio(options.apiKey, `/tools/execute/${options.tool}`, {
		method: 'POST',
		body: JSON.stringify({
			user_id: options.userId,
			arguments: options.arguments
		})
	});
}
