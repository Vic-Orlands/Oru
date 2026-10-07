import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const shotDir = path.resolve('../../docs/screenshots');

async function shot(page: Page, name: string) {
	await mkdir(shotDir, { recursive: true });
	await page.screenshot({ path: path.join(shotDir, `${name}.png`), fullPage: true });
}

async function theme(page: Page, mode: 'light' | 'dark') {
	await page.evaluate((value) => {
		localStorage.setItem('oso-theme', value);
		document.documentElement.classList.toggle('dark', value === 'dark');
	}, mode);
}

test('main pages render in light and dark', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: /The agent drafts/ })).toBeVisible();
	await shot(page, 'landing-light');
	await theme(page, 'dark');
	await shot(page, 'landing-dark');

	await page.getByRole('button', { name: 'Enter the demo desk' }).click();
	await page.waitForURL('**/app');
	await expect(page.getByRole('heading', { name: 'This week on the desk' })).toBeVisible();

	const pages: { path: string; heading: string; file: string }[] = [
		{ path: '/app', heading: 'This week on the desk', file: 'overview' },
		{ path: '/app/agent', heading: 'Desk agent', file: 'agent' },
		{ path: '/app/leads', heading: 'People on the desk', file: 'leads' },
		{ path: '/app/lists', heading: 'Prospect lists', file: 'lists' },
		{ path: '/app/approvals', heading: 'Nothing leaves without a person', file: 'approvals' },
		{ path: '/app/campaigns', heading: 'Sequences', file: 'campaigns' },
		{ path: '/app/pipeline', heading: 'Deals', file: 'pipeline' },
		{ path: '/app/tasks', heading: 'What is due', file: 'tasks' },
		{ path: '/app/settings', heading: 'Ahịa Studio', file: 'settings' }
	];

	for (const item of pages) {
		await page.goto(item.path);
		await expect(page.getByRole('heading', { name: item.heading, exact: true })).toBeVisible();
		await theme(page, 'light');
		await shot(page, `${item.file}-light`);
		await theme(page, 'dark');
		await shot(page, `${item.file}-dark`);
	}

	await page.goto('/app/lists');
	await page.getByRole('link', { name: /West Africa outbound/ }).click();
	await expect(page.getByRole('heading', { name: 'West Africa outbound' })).toBeVisible();
	await theme(page, 'light');
	await shot(page, 'list-detail-light');
	await theme(page, 'dark');
	await shot(page, 'list-detail-dark');

	await page.goto('/app/campaigns');
	await page.getByRole('link', { name: /Lagos fintech intro/ }).click();
	await expect(page.getByRole('heading', { name: 'Lagos fintech intro' })).toBeVisible();
	await theme(page, 'light');
	await shot(page, 'campaign-detail-light');
	await theme(page, 'dark');
	await shot(page, 'campaign-detail-dark');

	await page.goto('/app/leads?status=qualified');
	await expect(page.getByRole('link', { name: 'Amara Diallo' })).toBeVisible();
	await page.getByRole('link', { name: 'Amara Diallo' }).click();
	await expect(page.getByRole('heading', { name: 'Amara Diallo' })).toBeVisible();

	await page.goto('/app/agent');
	await page.getByRole('link', { name: /Find fintech/ }).click();
	await page.getByLabel('Message').fill('Find fintech VPs in Lagos');
	await page.getByRole('button', { name: 'Send' }).click();
	await expect(page.getByText('Find leads').or(page.getByText(/find leads/i))).toBeVisible({
		timeout: 20_000
	});
});
