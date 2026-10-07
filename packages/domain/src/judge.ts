import type { Icp, JudgeResult, Prospect } from './types.js';

function includesAny(haystack: string, needles: string[]): string | undefined {
	const value = haystack.toLowerCase();
	return needles.find((needle) => needle.length > 0 && value.includes(needle.toLowerCase()));
}

export function judgeHeuristic(prospect: Prospect, icp: Icp): JudgeResult {
	const reasons: string[] = [];
	let score = 20;
	const titleHit = includesAny(prospect.title, icp.titles);
	if (titleHit) {
		score += 35;
		reasons.push(`Title matches ICP (${prospect.title}).`);
	} else {
		reasons.push(`Title “${prospect.title}” is outside the ICP titles.`);
	}
	const industryHit = includesAny(prospect.industry, icp.industries);
	if (industryHit) {
		score += 20;
		reasons.push(`Industry ${prospect.industry} is in range.`);
	} else {
		reasons.push(`Industry ${prospect.industry} is not a target industry.`);
	}
	const geoHit = includesAny(prospect.location, icp.geos);
	if (geoHit) {
		score += 10;
		reasons.push(`Based in ${prospect.location}.`);
	} else {
		reasons.push(`${prospect.location} is outside the target geos.`);
	}
	const sized =
		prospect.employeeCount >= icp.minEmployees && prospect.employeeCount <= icp.maxEmployees;
	if (sized) {
		score += 15;
		reasons.push(`${prospect.employeeCount} employees sits inside ${icp.minEmployees}–${icp.maxEmployees}.`);
	} else {
		reasons.push(
			`${prospect.employeeCount} employees is outside ${icp.minEmployees}–${icp.maxEmployees}.`
		);
	}
	score = Math.max(0, Math.min(100, score));
	const fit = score >= 70;
	return {
		fit,
		score,
		confidence: fit ? 0.78 : 0.66,
		reasons,
		source: 'heuristic'
	};
}

export const FIT_THRESHOLD = 0.62;

export function scoreFromProbability(probability: number): number {
	const clamped = Math.max(0, Math.min(1, probability));
	return Math.round(clamped * 100);
}
