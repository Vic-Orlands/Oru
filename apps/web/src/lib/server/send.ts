import { COMPOSIO_API_KEY, DEMO_MODE } from '$app/env/private';
import { assertTransition } from '@oso-ahia/domain';
import { executeTool } from '@oso-ahia/integrations';
import {
	getApproval,
	listConnections,
	logActivity,
	patchApproval,
	setLeadStatus,
	type Database
} from '@oso-ahia/db';

export async function sendApproval(
	db: Database,
	workspaceId: string,
	approvalId: string,
	actor: string,
	userId: string
) {
	const approval = await getApproval(db, workspaceId, approvalId);
	if (!approval) throw new Error('Approval not found.');
	assertTransition(approval.status, 'sent');
	const connections = await listConnections(db, workspaceId);
	const gmail = connections.find((row) => row.toolkit === 'GMAIL' && row.status === 'connected');
	let detail: string;
	if (approval.type === 'email') {
		if (COMPOSIO_API_KEY && gmail && gmail.mode === 'live') {
			await executeTool({
				apiKey: COMPOSIO_API_KEY,
				userId,
				tool: 'GMAIL_SEND_EMAIL',
				arguments: {
					recipient_email: approval.toEmail,
					subject: approval.subject,
					body: approval.body
				}
			});
			detail = `Sent through Gmail to ${approval.toEmail}.`;
		} else if (DEMO_MODE) {
			detail = `Simulated send to ${approval.toEmail}. Connect Gmail with a Composio key to deliver it.`;
		} else {
			throw new Error('Connect Gmail before sending. Nothing was delivered.');
		}
	} else if (DEMO_MODE && !COMPOSIO_API_KEY) {
		detail = `Simulated ${approval.type.replace('_', ' ')}. Connect the toolkit to run it live.`;
	} else if (!COMPOSIO_API_KEY) {
		throw new Error('Add COMPOSIO_API_KEY before running this action.');
	} else {
		detail = `Approved ${approval.type.replace('_', ' ')} recorded. The connected toolkit can pick it up.`;
	}
	await patchApproval(db, workspaceId, approvalId, {
		status: 'sent',
		resolvedAt: new Date(),
		note: detail
	});
	if (approval.leadId && approval.type === 'email') {
		await setLeadStatus(db, workspaceId, [approval.leadId], 'contacted');
	}
	await logActivity(db, {
		workspaceId,
		kind: approval.type === 'email' ? 'email_sent' : approval.type,
		summary: detail,
		actor
	});
	return detail;
}
