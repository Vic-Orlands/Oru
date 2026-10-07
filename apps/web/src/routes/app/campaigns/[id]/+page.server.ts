import { error, fail } from '@sveltejs/kit';
import {
	addStep,
	enrollLeadIds,
	getCampaign,
	queryLeads,
	updateCampaignStatus
} from '@oso-ahia/db';
import { db } from '#lib/server/db.js';
import { requireDesk } from '#lib/server/guard.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { workspace } = requireDesk(locals);
	const record = await getCampaign(db, workspace.id, params.id);
	if (!record) error(404, 'Campaign not found.');
	const people = await queryLeads(db, workspace.id, { pageSize: 30, sort: 'score', dir: 'desc' });
	return {
		campaign: record.campaign,
		steps: record.steps,
		enrolled: record.enrolled.map((row) => ({
			id: row.enrollment.id,
			status: row.enrollment.status,
			stepIndex: row.enrollment.stepIndex,
			name: `${row.firstName} ${row.lastName}`.trim(),
			company: row.company,
			email: row.email
		})),
		people: people.rows.map((lead) => ({
			id: lead.id,
			name: `${lead.firstName} ${lead.lastName}`.trim(),
			company: lead.company
		}))
	};
};

export const actions: Actions = {
	status: async ({ request, locals, params }) => {
		const { workspace } = requireDesk(locals);
		const status = String((await request.formData()).get('status') ?? '');
		if (!['draft', 'active', 'paused'].includes(status))
			return fail(400, { message: 'Unknown status.' });
		await updateCampaignStatus(db, workspace.id, params.id, status);
		return { message: `Sequence is ${status}.` };
	},
	step: async ({ request, locals, params }) => {
		const { workspace } = requireDesk(locals);
		const kind = String((await request.formData()).get('kind') ?? '');
		if (kind !== 'email' && kind !== 'wait' && kind !== 'condition' && kind !== 'task') {
			return fail(400, { message: 'Unknown step.' });
		}
		await addStep(db, workspace.id, params.id, kind);
		return { message: 'Step added.' };
	},
	enroll: async ({ request, locals, params }) => {
		const { workspace } = requireDesk(locals);
		const selected = (await request.formData()).getAll('leadId').map(String).filter(Boolean);
		if (selected.length === 0) return fail(400, { message: 'Pick at least one person.' });
		const count = await enrollLeadIds(db, workspace.id, params.id, selected);
		return { message: `Enrolled ${count}.` };
	}
};
