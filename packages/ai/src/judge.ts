import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import {
	FIT_THRESHOLD,
	judgeFromJev,
	judgeHeuristic,
	scoreFromProbability,
	type Icp,
	type JudgeResult,
	type JevAnswers,
	type Prospect
} from '@oso-ahia/domain';
import { generateObject } from 'ai';
import { z } from 'zod';

const DECISIONS_URL = 'https://openrouter.ai/api/alpha/decisions';

export type JudgeConfig = {
	apiKey?: string;
	model: string;
	fallbackModel?: string;
	demo: boolean;
};

function stateFor(prospect: Prospect, icp: Icp) {
	return [
		`${prospect.firstName} ${prospect.lastName}`,
		prospect.title,
		`${prospect.company} (${prospect.domain})`,
		prospect.industry,
		prospect.location,
		`${prospect.employeeCount} employees`,
		`ICP titles: ${icp.titles.join(', ')}`,
		`ICP industries: ${icp.industries.join(', ')}`,
		`ICP geos: ${icp.geos.join(', ')}`,
		`ICP size: ${icp.minEmployees}-${icp.maxEmployees}`,
		icp.notes
	].join('\n');
}

const questions = {
	icp_fit: {
		type: 'noul',
		instructions:
			'Does this person fit the ICP described in the state? Answer yes only when title, industry, geography, and company size all reasonably match.'
	},
	duplicate: {
		type: 'noul',
		instructions: 'Does the state say this person is already known to the workspace?'
	}
};

const verdictSchema = z.object({
	fit: z.boolean(),
	score: z.number().min(0).max(100),
	reasons: z.array(z.string()).min(1).max(4)
});

async function judgeWithObject(
	prospect: Prospect,
	icp: Icp,
	config: JudgeConfig
): Promise<JudgeResult> {
	if (!config.apiKey) return judgeHeuristic(prospect, icp);
	const openrouter = createOpenRouter({ apiKey: config.apiKey });
	const { object } = await generateObject({
		model: openrouter.chat(config.fallbackModel || 'google/gemini-2.5-flash-lite'),
		schema: verdictSchema,
		prompt: `Score this person against the ICP. Return fit, a 0-100 score, and short reasons.\n\n${stateFor(prospect, icp)}`
	});
	return {
		fit: object.fit,
		score: Math.round(object.score),
		confidence: object.fit ? 0.7 : 0.6,
		reasons: object.reasons,
		source: 'fallback'
	};
}

async function decide(apiKey: string, model: string, prospect: Prospect, icp: Icp): Promise<JevAnswers> {
	const response = await fetch(DECISIONS_URL, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model,
			state: { text: stateFor(prospect, icp) },
			questions
		})
	});
	if (!response.ok) {
		const detail = await response.text();
		throw new Error(`Jev request failed (${response.status}): ${detail.slice(0, 240)}`);
	}
	const payload = (await response.json()) as { answers?: JevAnswers };
	if (!payload.answers) throw new Error('Jev returned no answers.');
	return payload.answers;
}

export async function judgeProspect(
	prospect: Prospect,
	icp: Icp,
	config: JudgeConfig
): Promise<JudgeResult> {
	if (config.demo || !config.apiKey) {
		return judgeHeuristic(prospect, icp);
	}
	try {
		const answers = await decide(config.apiKey, config.model, prospect, icp);
		return judgeFromJev(answers);
	} catch (error) {
		console.error('Jev request failed, trying the fallback chat model.', error);
		try {
			return await judgeWithObject(prospect, icp, config);
		} catch (fallbackError) {
			console.error('Fallback judge failed, using the local ICP heuristic.', fallbackError);
			const fallback = judgeHeuristic(prospect, icp);
			return { ...fallback, source: 'heuristic' };
		}
	}
}

export async function classifyReply(
	text: string,
	config: JudgeConfig
): Promise<{ intent: 'interested' | 'not_interested' | 'unclear'; confidence: number }> {
	if (config.demo || !config.apiKey) {
		const lower = text.toLowerCase();
		if (/(not interested|unsubscribe|stop)/.test(lower)) {
			return { intent: 'not_interested', confidence: 0.9 };
		}
		if (/(yes|let's talk|calendar|interested|book)/.test(lower)) {
			return { intent: 'interested', confidence: 0.8 };
		}
		return { intent: 'unclear', confidence: 0.4 };
	}
	const response = await fetch(DECISIONS_URL, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${config.apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: config.model,
			state: { text },
			questions: {
				reply_intent: {
					type: 'choice',
					instructions: 'What is the reply intent?',
					criteria: {
						interested: 'They want a meeting, more information, or a next step.',
						not_interested: 'They declined, asked to stop, or said it is not relevant.',
						unclear: 'The note does not commit either way.'
					}
				}
			}
		})
	});
	if (!response.ok) return { intent: 'unclear', confidence: 0 };
	const payload = (await response.json()) as { answers?: JevAnswers };
	const answer = payload.answers?.reply_intent;
	if (!answer || answer.type !== 'choice') return { intent: 'unclear', confidence: 0 };
	const intent =
		answer.choice === 'interested' || answer.choice === 'not_interested' ? answer.choice : 'unclear';
	return { intent, confidence: answer.confidence ?? FIT_THRESHOLD };
}

export { scoreFromProbability };
