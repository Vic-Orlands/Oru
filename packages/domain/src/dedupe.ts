export type Identity = {
	email?: string | null;
	linkedinUrl?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	company?: string | null;
};

export function dedupeKey(person: Identity): string {
	const email = person.email?.trim().toLowerCase();
	if (email) return `email:${email}`;
	const linkedin = person.linkedinUrl?.trim().toLowerCase().replace(/\/$/, '');
	if (linkedin) return `li:${linkedin}`;
	const name = [person.firstName, person.lastName, person.company]
		.map((part) => (part ?? '').trim().toLowerCase())
		.join('|');
	return `name:${name}`;
}

export function partitionNew<T>(
	incoming: T[],
	existingKeys: Iterable<string>,
	keyOf: (item: T) => string
): { fresh: T[]; duplicates: T[] } {
	const seen = new Set(existingKeys);
	const fresh: T[] = [];
	const duplicates: T[] = [];
	for (const item of incoming) {
		const key = keyOf(item);
		if (seen.has(key)) {
			duplicates.push(item);
			continue;
		}
		seen.add(key);
		fresh.push(item);
	}
	return { fresh, duplicates };
}
