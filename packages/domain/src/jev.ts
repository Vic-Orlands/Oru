import { scoreFromProbability, FIT_THRESHOLD } from './judge.js';
import type { JudgeResult } from './types.js';

export type NoulAnswer = { type: 'noul'; noul: number };
export type ChoiceAnswer = { type: 'choice'; choice: string; confidence?: number };

export type JevAnswers = Record<string, NoulAnswer | ChoiceAnswer>;

export function judgeFromJev(answers: JevAnswers, reasonsFromModel?: string[]): JudgeResult {
	const fitAnswer = answers.icp_fit;
	const probability = fitAnswer && fitAnswer.type === 'noul' ? fitAnswer.noul : 0;
	const score = scoreFromProbability(probability);
	const fit = probability >= FIT_THRESHOLD;
	const reasons = reasonsFromModel?.length
		? reasonsFromModel
		: [
				fit
					? `Jev marked ICP fit at ${Math.round(probability * 100)}% probability.`
					: `Jev marked this outside the ICP (${Math.round(probability * 100)}%).`
			];
	return { fit, score, confidence: probability, reasons, source: 'jev' };
}

export function replyIntent(answers: JevAnswers): 'interested' | 'not_interested' | 'unclear' {
	const answer = answers.reply_intent;
	if (!answer || answer.type !== 'choice') return 'unclear';
	if (answer.choice === 'interested' || answer.choice === 'not_interested') return answer.choice;
	return 'unclear';
}

export function isDuplicate(answers: JevAnswers): boolean {
	const answer = answers.duplicate;
	return Boolean(answer && answer.type === 'noul' && answer.noul >= 0.8);
}
