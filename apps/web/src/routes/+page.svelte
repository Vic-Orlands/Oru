<script lang="ts">
	import { enhance } from '$app/forms';
	import { fade, fly } from 'svelte/transition';
	import { animate } from 'motion';
	import Mark from '#lib/components/mark.svelte';
	import CommandPalette from '#lib/components/command-palette.svelte';
	import { syncTheme, toggleTheme, theme } from '#lib/theme.svelte.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let hero = $state<HTMLElement | null>(null);

	$effect(() => {
		syncTheme();
		if (!hero) return;
		animate(hero, { opacity: [0, 1], y: [8, 0] }, { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] });
	});
</script>

<svelte:head>
	<title>Oso-Ahia — approve the send</title>
	<meta
		name="description"
		content="A human-in-the-loop sales desk. The agent finds leads and drafts outreach. Nothing leaves until you approve it."
	/>
</svelte:head>

<div class="min-h-screen">
	<header class="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4">
		<a href="/" class="flex items-center gap-2">
			<Mark />
			<span class="font-medium tracking-tight">Oso-Ahia</span>
		</a>
		<nav class="ml-6 hidden gap-4 text-muted-foreground md:flex">
			<a href="#desk" class="hover:text-foreground">Desk</a>
			<a href="#queue" class="hover:text-foreground">Queue</a>
			<a href="#pipeline" class="hover:text-foreground">Pipeline</a>
		</nav>
		<button type="button" class="ml-auto text-xs text-muted-foreground" onclick={toggleTheme}>
			{theme.dark ? 'Light' : 'Dark'}
		</button>
		{#if data.signedIn}
			<a href="/app" class="rounded-md bg-accent px-2.5 py-1.5 text-[13px] text-accent-foreground"
				>Open desk</a
			>
		{/if}
	</header>

	<main class="mx-auto grid max-w-6xl gap-10 px-5 pt-10 pb-20 md:grid-cols-[1.3fr_0.8fr] md:pt-16">
		<div bind:this={hero}>
			<p class="text-xs tracking-[0.14em] text-muted-foreground uppercase">Human in the loop</p>
			<h1 class="mt-3 max-w-xl text-[32px] leading-[1.15] font-medium tracking-tight md:text-5xl">
				The agent drafts. You decide what gets sent.
			</h1>
			<p class="mt-4 max-w-md text-[15px] text-muted-foreground">
				Oso-Ahia is a sales desk for people who still own the relationship. Find leads, score them
				against an ICP, run sequences, and keep every email in an approval queue.
			</p>
			<div
				class="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3"
			>
				{#each [{ k: '01', t: 'Source', d: 'Lists, CSV, and connected CRMs land in one table.' }, { k: '02', t: 'Judge', d: 'A fast model scores fit before anyone writes a note.' }, { k: '03', t: 'Approve', d: 'Nothing leaves the building without a person.' }] as item (item.k)}
					<div class="bg-card p-4" in:fade={{ duration: 200 }}>
						<p class="num text-[11px] text-muted-foreground">{item.k}</p>
						<p class="mt-2 font-medium">{item.t}</p>
						<p class="mt-1 text-muted-foreground">{item.d}</p>
					</div>
				{/each}
			</div>
		</div>

		<section class="rounded-lg border border-border bg-card p-5" in:fly={{ y: 10, duration: 220 }}>
			<h2 class="text-[15px] font-medium tracking-tight">Sign in</h2>
			<p class="mt-1 text-muted-foreground">
				Workspace data stays scoped to the people on the desk.
			</p>
			{#if form?.message}
				<p class="mt-3 rounded-md bg-danger/10 px-2 py-1.5 text-danger">{form.message}</p>
			{/if}
			{#if data.google}
				<form method="post" action="?/google" class="mt-4" use:enhance>
					<button type="submit" class="h-9 w-full rounded-md border border-border hover:bg-muted">
						Continue with Google
					</button>
				</form>
			{:else}
				<p class="mt-4 rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground">
					Google sign-in appears when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
				</p>
			{/if}
			{#if data.demo}
				<form method="post" action="?/demo" class="mt-3" use:enhance>
					<button type="submit" class="h-9 w-full rounded-md bg-accent text-accent-foreground">
						Enter the demo desk
					</button>
				</form>
				<p class="mt-3 text-xs text-muted-foreground">
					Demo owner <span class="num text-foreground">{data.demoEmail}</span>
					<span class="num"> · {data.demoPassword}</span>
				</p>
			{/if}
			{#if data.signedIn}
				<a href="/app" class="mt-4 inline-block text-[13px] text-accent"
					>You already have a session. Open the desk.</a
				>
			{/if}
		</section>
	</main>

	<section id="desk" class="border-t border-border">
		<div class="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-3">
			<div id="queue">
				<h2 class="font-medium tracking-tight">Approval queue</h2>
				<p class="mt-2 text-muted-foreground">
					Drafts wait. Edit the line that sounds wrong. Approve, and only then does Gmail or Outlook
					get the message.
				</p>
			</div>
			<div id="pipeline">
				<h2 class="font-medium tracking-tight">Pipeline with a rate</h2>
				<p class="mt-2 text-muted-foreground">
					A board for the deals, and a funnel that counts how far each deal has actually travelled,
					not just the column it sits in today.
				</p>
			</div>
			<div>
				<h2 class="font-medium tracking-tight">An agent that shows its work</h2>
				<p class="mt-2 text-muted-foreground">
					Tool calls render as the thing they made: a lead table, a draft, a task, a campaign. Stop
					or regenerate if the first pass is off.
				</p>
			</div>
		</div>
	</section>
</div>
<CommandPalette />
