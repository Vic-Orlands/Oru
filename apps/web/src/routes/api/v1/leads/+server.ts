import { hashApiKey } from '@oso-ahia/domain';
import { findApiKey, queryLeads, touchApiKey } from '@oso-ahia/db';
import { json } from '@sveltejs/kit';
import { db } from '#lib/server/db.js';

export const GET = async ({ request, url }) => {
	const header = request.headers.get('authorization') ?? '';
	const raw = header.replace(/^Bearer\s+/i, '').trim();
	if (!raw) return json({ error: 'Send Authorization: Bearer <api key>.' }, { status: 401 });
	const key = await findApiKey(db, hashApiKey(raw));
	if (!key) return json({ error: 'Unknown API key.' }, { status: 401 });
	await touchApiKey(db, key.id);
	const page = Number(url.searchParams.get('page') ?? '1');
	const result = await queryLeads(db, key.workspaceId, {
		q: url.searchParams.get('q') ?? undefined,
		status: url.searchParams.get('status') ?? undefined,
		page: Number.isFinite(page) ? page : 1,
		pageSize: 50
	});
	return json({
		leads: result.rows.map((lead) => ({
			id: lead.id,
			name: `${lead.firstName} ${lead.lastName}`.trim(),
			email: lead.email,
			title: lead.title,
			company: lead.company,
			score: lead.score,
			icpFit: lead.icpFit,
			status: lead.status,
			location: lead.location
		})),
		total: result.total,
		page: result.page
	});
};
