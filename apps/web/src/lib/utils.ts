import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function money(value: number) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	}).format(value);
}

export function shortDate(value: Date | string | null | undefined) {
	if (!value) return '—';
	return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(
		new Date(value)
	);
}

export function fullName(first: string, last: string) {
	return `${first} ${last}`.trim();
}
