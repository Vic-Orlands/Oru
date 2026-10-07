<script lang="ts">
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import Mark from './mark.svelte';
	import CommandPalette from './command-palette.svelte';
	import { syncTheme, toggleTheme, theme } from '#lib/theme.svelte.js';
	import { togglePalette } from '#lib/palette.svelte.js';
	import type { Snippet } from 'svelte';

	let {
		workspace,
		userName,
		pending,
		notice = '',
		children
	}: {
		workspace: string;
		userName: string;
		pending: number;
		notice?: string;
		children: Snippet;
	} = $props();

	let menu = $state(false);

	const links = [
		{ href: '/app', label: 'Overview' },
		{ href: '/app/agent', label: 'Agent' },
		{ href: '/app/leads', label: 'Leads' },
		{ href: '/app/lists', label: 'Lists' },
		{ href: '/app/approvals', label: 'Approvals' },
		{ href: '/app/campaigns', label: 'Campaigns' },
		{ href: '/app/pipeline', label: 'Pipeline' },
		{ href: '/app/tasks', label: 'Tasks' },
		{ href: '/app/settings', label: 'Settings' }
	];

	function active(href: string) {
		if (href === '/app') return page.url.pathname === '/app';
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}

	$effect(() => {
		syncTheme();
	});
</script>

<div class="min-h-screen md:grid md:grid-cols-[220px_1fr]">
	<aside class="hidden border-r border-border md:flex md:flex-col">
		<a href="/app" class="flex items-center gap-2 px-3 py-3">
			<Mark />
			<span class="font-medium tracking-tight">Oso-Ahia</span>
		</a>
		<nav class="flex flex-1 flex-col gap-0.5 px-2">
			{#each links as link (link.href)}
				<a
					href={link.href}
					aria-current={active(link.href) ? 'page' : undefined}
					class="flex items-center justify-between rounded-md px-2 py-1.5 text-[13px] {active(
						link.href
					)
						? 'bg-muted text-foreground'
						: 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'}"
				>
					{link.label}
					{#if link.href === '/app/approvals' && pending > 0}
						<span class="num rounded bg-warning/15 px-1 text-[11px] text-warning">{pending}</span>
					{/if}
				</a>
			{/each}
		</nav>
		<div class="border-t border-border px-3 py-3 text-xs text-muted-foreground">
			<p class="truncate text-foreground">{workspace}</p>
			<p class="truncate">{userName}</p>
		</div>
	</aside>

	<div class="min-w-0">
		<header class="flex h-12 items-center gap-2 border-b border-border px-3 md:px-5">
			<button
				type="button"
				class="rounded-md px-2 py-1 md:hidden"
				onclick={() => (menu = !menu)}
				aria-label="Open navigation"
			>
				Menu
			</button>
			<a href="/app" class="flex items-center gap-2 md:hidden">
				<Mark size={16} />
				<span class="font-medium">Oso-Ahia</span>
			</a>
			<button
				type="button"
				class="ml-auto hidden items-center gap-2 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground md:inline-flex"
				onclick={togglePalette}
			>
				Search
				<span class="num">⌘K</span>
			</button>
			<button type="button" class="rounded-md px-2 py-1 text-xs" onclick={toggleTheme}>
				{theme.dark ? 'Light' : 'Dark'}
			</button>
			<form method="post" action="/?/signOut">
				<button
					type="submit"
					class="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
				>
					Sign out
				</button>
			</form>
		</header>
		{#if menu}
			<nav class="grid gap-1 border-b border-border p-2 md:hidden">
				{#each links as link (link.href)}
					<a href={link.href} class="rounded-md px-2 py-1.5" onclick={() => (menu = false)}
						>{link.label}</a
					>
				{/each}
			</nav>
		{/if}
		{#if notice}
			<p class="border-b border-border bg-warning/10 px-3 py-1.5 text-xs text-warning md:px-5">
				{notice}
			</p>
		{/if}
		<main class="px-3 py-5 md:px-6">
			{#key page.url.pathname}
				<div in:fade={{ duration: 160 }}>
					{@render children()}
				</div>
			{/key}
		</main>
	</div>
</div>
<CommandPalette />
