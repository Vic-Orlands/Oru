import { HAPPY_PATH_STAGES, type DealStage } from './types.js';

export type StageCount = { stage: DealStage; count: number; value: number };

export type FunnelStep = {
	from: (typeof HAPPY_PATH_STAGES)[number];
	to: (typeof HAPPY_PATH_STAGES)[number];
	fromCount: number;
	toCount: number;
	rate: number;
};

export function stageRank(stage: DealStage): number {
	const index = HAPPY_PATH_STAGES.indexOf(stage as (typeof HAPPY_PATH_STAGES)[number]);
	return index;
}

export function furthestStage(current: DealStage, previous: DealStage): DealStage {
	if (current === 'lost') return previous;
	const nextRank = stageRank(current);
	const prevRank = stageRank(previous);
	if (nextRank < 0) return previous;
	if (prevRank < 0) return current;
	return nextRank >= prevRank ? current : previous;
}

/**
 * Conversion uses how far each deal has ever travelled, not the column it sits in today.
 * A deal moved back to "qualified" still counts as having reached "proposal".
 */
export function funnelFromFurthest(furthest: DealStage[]): FunnelStep[] {
	const reached = HAPPY_PATH_STAGES.map(
		(stage) => furthest.filter((item) => stageRank(item) >= stageRank(stage)).length
	);
	const steps: FunnelStep[] = [];
	for (let index = 0; index < HAPPY_PATH_STAGES.length - 1; index += 1) {
		const fromCount = reached[index] ?? 0;
		const toCount = reached[index + 1] ?? 0;
		const from = HAPPY_PATH_STAGES[index];
		const to = HAPPY_PATH_STAGES[index + 1];
		if (!from || !to) continue;
		steps.push({
			from,
			to,
			fromCount,
			toCount,
			rate: fromCount === 0 ? 0 : toCount / fromCount
		});
	}
	return steps;
}
