import { describe, expect, it } from 'vitest';
import { weeklyBuckets } from './weeks';

describe('weeklyBuckets', () => {
	it('counts sends and replies into the week they happened', () => {
		const now = new Date('2026-04-14T12:00:00.000Z');
		const buckets = weeklyBuckets(
			[
				{ kind: 'email_sent', createdAt: '2026-04-14T09:00:00.000Z' },
				{ kind: 'email_sent', createdAt: '2026-04-15T09:00:00.000Z' },
				{ kind: 'reply', createdAt: '2026-04-14T11:00:00.000Z' },
				{ kind: 'note', createdAt: '2026-04-14T11:00:00.000Z' }
			],
			8,
			now
		);
		const last = buckets[buckets.length - 1];
		expect(buckets).toHaveLength(8);
		expect(last?.sent).toBe(2);
		expect(last?.replies).toBe(1);
	});
});
