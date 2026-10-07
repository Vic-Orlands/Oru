export type ActivityPoint = { kind: string; createdAt: Date | string };

export type WeekBucket = { label: string; sent: number; replies: number };

export function weeklyBuckets(rows: ActivityPoint[], weeks = 8, now = new Date()): WeekBucket[] {
	const start = new Date(now);
	start.setUTCHours(0, 0, 0, 0);
	start.setUTCDate(start.getUTCDate() - (weeks - 1) * 7);
	const buckets: WeekBucket[] = Array.from({ length: weeks }, (_, index) => {
		const date = new Date(start);
		date.setUTCDate(start.getUTCDate() + index * 7);
		const label = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date);
		return { label, sent: 0, replies: 0 };
	});
	const origin = start.getTime();
	const span = 7 * 86_400_000;
	for (const row of rows) {
		const index = Math.floor((new Date(row.createdAt).getTime() - origin) / span);
		const bucket = buckets[index];
		if (!bucket) continue;
		if (row.kind === 'email_sent') bucket.sent += 1;
		if (row.kind === 'reply') bucket.replies += 1;
	}
	return buckets;
}
