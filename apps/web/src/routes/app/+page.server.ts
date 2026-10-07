import { dashboard } from '@oso-ahia/db';
import { funnelFromFurthest } from '@oso-ahia/domain';
import { weeklyBuckets } from '#lib/weeks.js';
import { db } from '#lib/server/db.js';
import { requireDesk } from '#lib/server/guard.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { workspace } = requireDesk(locals);
	const data = await dashboard(db, workspace.id);
	const funnel = funnelFromFurthest(data.deals.map((row) => row.deal.furthestStage));
	const chart = weeklyBuckets(
		data.chartActivity.map((row) => ({ kind: row.kind, createdAt: row.createdAt }))
	);
	const campaignStats = data.campaigns.map((campaign) => {
		const rows = data.enrollments.filter((row) => row.campaignId === campaign.id);
		return {
			id: campaign.id,
			name: campaign.name,
			status: campaign.status,
			enrolled: rows.length,
			waiting: rows.filter((row) => row.status === 'waiting_approval').length,
			completed: rows.filter((row) => row.status === 'completed').length
		};
	});
	return {
		pipelineValue: data.pipelineValue,
		wonValue: data.wonValue,
		openDeals: data.openDeals,
		pendingApprovals: data.pendingApprovals,
		leads: data.leads,
		fitLeads: data.fitLeads,
		meetings: data.meetings,
		funnel,
		chart,
		campaigns: campaignStats,
		activity: data.activity.map((row) => ({
			id: row.id,
			kind: row.kind,
			summary: row.summary,
			actor: row.actor,
			createdAt: row.createdAt.toISOString()
		}))
	};
};
