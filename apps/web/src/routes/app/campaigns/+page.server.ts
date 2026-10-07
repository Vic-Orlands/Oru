import { fail, redirect } from '@sveltejs/kit';
import { createCampaign, listCampaigns } from '@oso-ahia/db';
import { db } from '$lib/server/db';
import { requireDesk } from '$lib/server/guard';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { workspace } = requireDesk(locals);
	const campaigns = await listCampaigns(db, workspace.id);
	return {
		campaigns: campaigns.map((campaign) => ({
			id: campaign.id,
			name: campaign.name,
			status: campaign.status,
			description: campaign.description
		}))
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { workspace } = requireDesk(locals);
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Name the campaign.' });
		const campaign = await createCampaign(db, workspace.id, {
			name,
			description: String(data.get('description') ?? '')
		});
		redirect(303, `/app/campaigns/${campaign.id}`);
	}
};
