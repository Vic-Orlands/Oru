import {
	COMPOSIO_API_KEY,
	OPENROUTER_API_KEY,
	OPENROUTER_CHAT_MODEL,
	OPENROUTER_JUDGE_FALLBACK_MODEL,
	OPENROUTER_JUDGE_MODEL
} from '$app/env/private';
import { AGENT_INSTRUCTIONS } from '@oso-ahia/ai';
import { planAgentTurn } from '@oso-ahia/domain';
import { getConversation, replaceMessages } from '@oso-ahia/db';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import {
	convertToModelMessages,
	createUIMessageStream,
	createUIMessageStreamResponse,
	stepCountIs,
	streamText,
	tool,
	type UIMessage
} from 'ai';
import { z } from 'zod';
import { db } from '#lib/server/db.js';
import { resolvedModels } from '#lib/server/flags.js';
import {
	runCampaignSummary,
	runCreateTask,
	runDraftEmail,
	runFindLeads
} from '#lib/server/agent-runs.js';

function lastUserText(messages: UIMessage[]) {
	const message = [...messages].reverse().find((item) => item.role === 'user');
	if (!message) return '';
	return message.parts
		.filter((part) => part.type === 'text')
		.map((part) => part.text)
		.join('\n')
		.trim();
}

async function writeWords(
	write: (part: { type: 'text-delta'; id: string; delta: string }) => void,
	id: string,
	text: string
) {
	const pieces = text.split(/(\s+)/).filter((piece) => piece.length > 0);
	for (const piece of pieces) {
		write({ type: 'text-delta', id, delta: piece });
		await new Promise((resolve) => setTimeout(resolve, 12));
	}
}

export const POST = async ({ request, locals }) => {
	if (!locals.user || !locals.workspace) {
		return new Response('Sign in required.', { status: 401 });
	}
	const payload = (await request.json()) as { messages?: UIMessage[]; conversationId?: string };
	const messages = payload.messages ?? [];
	const conversationId = payload.conversationId ?? '';
	const owned = await getConversation(db, locals.workspace.id, conversationId);
	if (!owned) return new Response('Conversation not found.', { status: 404 });

	const models = resolvedModels(locals.workspace.modelSettings);
	const ctx = {
		db,
		workspaceId: locals.workspace.id,
		icp: locals.workspace.icp,
		actor: locals.user.name,
		judge: {
			apiKey: OPENROUTER_API_KEY,
			model: models.judgeModel || OPENROUTER_JUDGE_MODEL,
			fallbackModel: OPENROUTER_JUDGE_FALLBACK_MODEL,
			demo: models.demoAi
		}
	};

	const stream = createUIMessageStream({
		originalMessages: messages,
		execute: async ({ writer }) => {
			if (models.demoAi || !OPENROUTER_API_KEY) {
				const text = lastUserText(messages);
				const plan = planAgentTurn(text);
				const textId = 'preface';
				writer.write({ type: 'start' });
				writer.write({ type: 'start-step' });
				writer.write({ type: 'text-start', id: textId });
				writer.write({ type: 'text-delta', id: textId, delta: plan.preface.slice(0, 18) });
				let toolOutput: unknown = null;
				let toolName = '';
				let toolInput: unknown = {};
				if (plan.tool === 'findLeads') {
					toolName = 'findLeads';
					toolInput = { text };
					toolOutput = await runFindLeads(ctx, { text });
				} else if (plan.tool === 'draftEmail') {
					toolName = 'draftEmail';
					toolInput = { angle: text };
					toolOutput = await runDraftEmail(ctx, { angle: text });
				} else if (plan.tool === 'createTask') {
					toolName = 'createTask';
					toolInput = { title: text.slice(0, 80) || 'Follow up' };
					toolOutput = await runCreateTask(ctx, { title: text.slice(0, 80) || 'Follow up' });
				} else if (plan.tool === 'campaignSummary') {
					toolName = 'campaignSummary';
					toolInput = {};
					toolOutput = await runCampaignSummary(ctx);
				}
				await writeWords((part) => writer.write(part), textId, plan.preface.slice(18));
				writer.write({ type: 'text-end', id: textId });
				if (toolName) {
					const toolCallId = `call_${toolName}`;
					writer.write({
						type: 'tool-input-available',
						toolCallId,
						toolName,
						input: toolInput
					});
					writer.write({
						type: 'tool-output-available',
						toolCallId,
						output: toolOutput
					});
				}
				writer.write({ type: 'finish-step' });
				writer.write({ type: 'finish', finishReason: 'stop' });
				writer.setOutcome({ status: 'completed' });
				return;
			}

			const openrouter = createOpenRouter({ apiKey: OPENROUTER_API_KEY });
			const result = streamText({
				model: openrouter.chat(models.chatModel || OPENROUTER_CHAT_MODEL),
				system: `${AGENT_INSTRUCTIONS}\n\nWorkspace ICP notes: ${locals.workspace?.icp.notes ?? ''}`,
				messages: await convertToModelMessages(messages),
				stopWhen: stepCountIs(4),
				tools: {
					findLeads: tool({
						description:
							'Find and save leads that match a description. Returns the people actually inserted.',
						inputSchema: z.object({
							text: z.string(),
							industry: z.string().optional(),
							location: z.string().optional()
						}),
						execute: async (input) => runFindLeads(ctx, input)
					}),
					draftEmail: tool({
						description:
							'Draft an outreach email into the approval queue. Does not send the email.',
						inputSchema: z.object({
							leadEmail: z.string().optional(),
							angle: z.string().optional()
						}),
						execute: async (input) => runDraftEmail(ctx, input)
					}),
					createTask: tool({
						description: 'Create a follow-up task on the desk.',
						inputSchema: z.object({
							title: z.string(),
							notes: z.string().optional()
						}),
						execute: async (input) => runCreateTask(ctx, input)
					}),
					campaignSummary: tool({
						description: 'Summarise the workspace campaigns.',
						inputSchema: z.object({}),
						execute: async () => runCampaignSummary(ctx)
					})
				}
			});
			writer.merge(result.toUIMessageStream());
			writer.setOutcome({ status: 'completed' });
		},
		onEnd: async ({ messages: next }) => {
			await replaceMessages(
				db,
				conversationId,
				next.map((message) => ({
					role: message.role,
					parts: message.parts
				}))
			);
		},
		onError: (error) => {
			console.error(error);
			if (!OPENROUTER_API_KEY) return 'The agent is in demo mode.';
			if (!COMPOSIO_API_KEY) return 'The model replied, but a connected tool is missing a key.';
			return 'The agent hit an error. Try again.';
		}
	});

	return createUIMessageStreamResponse({ stream });
};
