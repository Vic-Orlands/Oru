import type { Prospect } from './types.js';

export function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let cell = '';
	let quoted = false;
	const input = text.replace(/^\uFEFF/, '');
	for (let index = 0; index < input.length; index += 1) {
		const char = input[index];
		const next = input[index + 1];
		if (quoted) {
			if (char === '"' && next === '"') {
				cell += '"';
				index += 1;
			} else if (char === '"') {
				quoted = false;
			} else {
				cell += char;
			}
			continue;
		}
		if (char === '"') {
			quoted = true;
			continue;
		}
		if (char === ',') {
			row.push(cell.trim());
			cell = '';
			continue;
		}
		if (char === '\n') {
			row.push(cell.trim());
			cell = '';
			if (row.some((value) => value.length > 0)) rows.push(row);
			row = [];
			continue;
		}
		if (char !== '\r') cell += char;
	}
	row.push(cell.trim());
	if (row.some((value) => value.length > 0)) rows.push(row);
	return rows;
}

const HEADER_MAP: Record<string, keyof Prospect | 'ignore'> = {
	first_name: 'firstName',
	firstname: 'firstName',
	first: 'firstName',
	last_name: 'lastName',
	lastname: 'lastName',
	last: 'lastName',
	email: 'email',
	title: 'title',
	job_title: 'title',
	company: 'company',
	organization: 'company',
	domain: 'domain',
	website: 'domain',
	linkedin: 'linkedinUrl',
	linkedin_url: 'linkedinUrl',
	location: 'location',
	city: 'location',
	industry: 'industry',
	employees: 'employeeCount',
	employee_count: 'employeeCount',
	headcount: 'employeeCount',
	phone: 'phone'
};

export function prospectsFromCsv(text: string): { prospects: Prospect[]; skipped: number } {
	const rows = parseCsv(text);
	const header = rows[0];
	if (!header) return { prospects: [], skipped: 0 };
	const columns = header.map((name) => HEADER_MAP[name.trim().toLowerCase().replace(/\s+/g, '_')] ?? 'ignore');
	const prospects: Prospect[] = [];
	let skipped = 0;
	for (const cells of rows.slice(1)) {
		const draft: Partial<Prospect> = {};
		columns.forEach((key, index) => {
			if (key === 'ignore') return;
			const value = cells[index] ?? '';
			if (key === 'employeeCount') {
				const parsed = Number.parseInt(value, 10);
				draft.employeeCount = Number.isFinite(parsed) ? parsed : 0;
				return;
			}
			draft[key] = value;
		});
		if (!draft.email || !draft.email.includes('@')) {
			skipped += 1;
			continue;
		}
		const email = draft.email.toLowerCase();
		prospects.push({
			firstName: draft.firstName || email.split('@')[0] || 'Unknown',
			lastName: draft.lastName || '',
			email,
			title: draft.title || 'Unknown',
			company: draft.company || draft.domain || 'Unknown',
			domain: (draft.domain || email.split('@')[1] || '').replace(/^https?:\/\//, ''),
			linkedinUrl: draft.linkedinUrl || '',
			location: draft.location || 'Unknown',
			industry: draft.industry || 'unknown',
			employeeCount: draft.employeeCount ?? 0,
			phone: draft.phone || ''
		});
	}
	return { prospects, skipped };
}
