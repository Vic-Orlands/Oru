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

	await page.goto('/app/leads');
	await page.getByPlaceholder('Filter name, company, email').fill('Amara');
	await page.getByRole('button', { name: 'Apply' }).click();
	await expect(page.getByRole('link', { name: 'Amara Diallo' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Grace Mwangi' })).toHaveCount(0);
	await page.getByRole('link', { name: 'Amara Diallo' }).click();
	await expect(page.getByRole('heading', { name: 'Amara Diallo' })).toBeVisible();
	await expect(page.locator('aside').getByText('Kolaform', { exact: true })).toBeVisible();

	await page.goto('/app/approvals');
	const pendingBefore = await page.getByRole('button', { name: 'Approve' }).count();
	expect(pendingBefore).toBeGreaterThan(0);
	await page.getByRole('button', { name: 'Approve' }).first().click();
	await expect(page.getByRole('button', { name: 'Approve' })).toHaveCount(pendingBefore - 1);

	await page.goto('/app/pipeline');
	const kola = page.getByRole('listitem').filter({ hasText: 'Kolaform intro' });
	await kola.getByRole('combobox').selectOption('qualified');
	await expect(
		page.getByRole('group', { name: 'qualified' }).getByText('Kolaform intro')
	).toBeVisible();

	await page.goto('/app/tasks?view=calendar');
	await expect(page.getByText('Mon')).toBeVisible();
	await expect(page.getByText('Morning queue sweep')).toBeVisible();

	await page.keyboard.press('Control+K');
	const palette = page.getByRole('dialog');
	await expect(palette.getByText('Command palette')).toBeAttached();
	await palette.getByText('Leads', { exact: true }).click();
	await expect(page).toHaveURL(/\/app\/leads/);

	await page.goto('/app/agent');
	await page.getByRole('link', { name: /Find fintech/ }).click();
	await page.getByLabel('Message').fill('Remind me to call Harbor tomorrow');
	await page.getByRole('button', { name: 'Send' }).click();
	await expect(page.getByText('Adding that to the desk')).toBeVisible({ timeout: 20_000 });
	await expect(page.getByText('Remind me to call Harbor tomorrow')).toBeVisible();
});
