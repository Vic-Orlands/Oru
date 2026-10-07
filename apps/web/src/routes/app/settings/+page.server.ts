import { fail } from '@sveltejs/kit';
import { generateApiKey } from '@oso-ahia/domain';
import { SALES_TOOLKITS, connectToolkit } from '@oso-ahia/integrations';
import {
	insertApiKey,
	inviteMember,
	listApiKeys,
	listConnections,
	listMembers,
	removeMember,
	revokeApiKey,
	updateWorkspace,
	upsertConnection
} from '@oso-ahia/db';
import { BETTER_AUTH_URL, COMPOSIO_API_KEY, DEMO_MODE } from '$app/env/private';
import { db } from '$lib/server/db';
import { flags, resolvedModels } from '$lib/server/flags';
import { requireDesk } from '$lib/server/guard';
import type { Actions, PageServerLoad } from './$types';

function splitList(value: string) {
	return value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const { workspace, user } = requireDesk(locals);
	const connected = url.searchParams.get('connected');
	if (connected && SALES_TOOLKITS.some((toolkit) => toolkit.slug === connected)) {
		await upsertConnection(db, {
			workspaceId: workspace.id,
			toolkit: connected,
			status: 'connected',
			mode: 'live',
			detail: 'Returned from the provider.'
		});
	}
	const [members, connections, keys] = await Promise.all([
		listMembers(db, workspace.id),
		listConnections(db, workspace.id),
		listApiKeys(db, workspace.id)
	]);
	const state = flags();
	const models = resolvedModels(workspace.modelSettings);
	return {
		workspace: {
			name: workspace.name,
			slug: workspace.slug,
			icp: workspace.icp
		},
		models,
		members,
		keys: keys.map((key) => ({
			id: key.id,
			name: key.name,
			prefix: key.prefix,
			createdAt: key.createdAt.toISOString(),
			lastUsedAt: key.lastUsedAt?.toISOString() ?? null
		})),
		toolkits: SALES_TOOLKITS.map((toolkit) => {
			const row = connections.find((item) => item.toolkit === toolkit.slug);
			return {
				...toolkit,
				status: row?.status ?? 'disconnected',
				mode: row?.mode ?? '',
				detail: row?.detail ?? ''
			};
		}),
		services: {
			google: state.google,
			openRouter: state.openRouter,
			composio: state.composio,
			demo: state.demo,
			email: user.email
		}
	};
};

export const actions: Actions = {
	workspace: async ({ request, locals }) => {
		const { workspace } = requireDesk(locals);
		const name = String((await request.formData()).get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Workspace name is required.' });
		await updateWorkspace(db, workspace.id, { name });
		return { message: 'Workspace updated.' };
	},
	invite: async ({ request, locals }) => {
		const { workspace } = requireDesk(locals);
		const data = await request.formData();
		try {
			await inviteMember(db, workspace.id, {
				email: String(data.get('email') ?? ''),
				name: String(data.get('name') ?? ''),
				role: String(data.get('role') ?? 'member')
			});
		} catch (error) {
			return fail(400, { message: error instanceof Error ? error.message : 'Could not invite.' });
		}
		return {
			message: 'Invite recorded. They join this workspace when they sign in with that email.'
		};
	},
	remove: async ({ request, locals }) => {
		const { workspace } = requireDesk(locals);
		try {
			await removeMember(db, workspace.id, String((await request.formData()).get('id') ?? ''));
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Could not remove the member.'
			});
		}
		return { message: 'Member removed.' };
	},
	icp: async ({ request, locals }) => {
		const { workspace } = requireDesk(locals);
		const data = await request.formData();
		const minEmployees = Number(data.get('minEmployees') ?? '0');
		const maxEmployees = Number(data.get('maxEmployees') ?? '0');
		if (
			!Number.isFinite(minEmployees) ||
			!Number.isFinite(maxEmployees) ||
			minEmployees > maxEmployees
		) {
			return fail(400, { message: 'Employee range is invalid.' });
		}
		await updateWorkspace(db, workspace.id, {
			icp: {
				titles: splitList(String(data.get('titles') ?? '')).map((item) => item.toLowerCase()),
				industries: splitList(String(data.get('industries') ?? '')).map((item) =>
					item.toLowerCase()
				),
				geos: splitList(String(data.get('geos') ?? '')).map((item) => item.toLowerCase()),
				minEmployees,
				maxEmployees,
				notes: String(data.get('notes') ?? '')
			}
		});
		return { message: 'ICP saved. The next score uses it.' };
	},
	models: async ({ request, locals }) => {
		const { workspace } = requireDesk(locals);
		const data = await request.formData();
		await updateWorkspace(db, workspace.id, {
			modelSettings: {
				chatModel: String(data.get('chatModel') ?? '').trim(),
				judgeModel: String(data.get('judgeModel') ?? '').trim()
			}
		});
		return { message: 'Model overrides saved. Empty fields use the environment defaults.' };
	},
	connect: async ({ request, locals }) => {
		const { workspace, user } = requireDesk(locals);
		const slug = String((await request.formData()).get('slug') ?? '');
		const toolkit = SALES_TOOLKITS.find((item) => item.slug === slug);
		if (!toolkit) return fail(400, { message: 'Unknown toolkit.' });
		if (!COMPOSIO_API_KEY) {
			if (!DEMO_MODE) return fail(400, { message: 'Set COMPOSIO_API_KEY to connect accounts.' });
			await upsertConnection(db, {
				workspaceId: workspace.id,
				toolkit: toolkit.slug,
				status: 'connected',
				mode: 'demo',
				detail: 'Simulated connection. Sends stay inside the desk.'
			});
			return { message: `${toolkit.name} is simulated.` };
		}
		try {
			const link = await connectToolkit({
				apiKey: COMPOSIO_API_KEY,
				userId: user.id,
				toolkit,
				callbackUrl: `${BETTER_AUTH_URL}/app/settings?connected=${toolkit.slug}`
			});
			return { redirectTo: link.redirectUrl };
		} catch (error) {
			return fail(400, {
				message: error instanceof Error ? error.message : 'Composio did not return a link.'
			});
		}
	},
	disconnect: async ({ request, locals }) => {
		const { workspace } = requireDesk(locals);
		const slug = String((await request.formData()).get('slug') ?? '');
		await upsertConnection(db, {
			workspaceId: workspace.id,
			toolkit: slug,
			status: 'disconnected',
			mode: 'live',
			detail: ''
		});
		return { message: 'Disconnected.' };
	},
	createKey: async ({ request, locals }) => {
		const { workspace } = requireDesk(locals);
		const name = String((await request.formData()).get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Name the key.' });
		const generated = generateApiKey();
		await insertApiKey(db, {
			workspaceId: workspace.id,
			name,
			prefix: generated.prefix,
			hash: generated.hash
		});
		return { message: 'Copy this key now. It is stored as a hash.', createdKey: generated.raw };
	},
	revokeKey: async ({ request, locals }) => {
		const { workspace } = requireDesk(locals);
		await revokeApiKey(db, workspace.id, String((await request.formData()).get('id') ?? ''));
		return { message: 'Key revoked.' };
	}
};
