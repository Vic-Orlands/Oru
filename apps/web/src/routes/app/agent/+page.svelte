<script lang="ts">
	import { enhance } from '$app/forms';
	import EmptyState from '#lib/components/ui/empty-state.svelte';
	import { shortDate } from '#lib/utils.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Agent — Oso-Ahia</title>
</svelte:head>

<div class="grid gap-4 lg:grid-cols-[240px_1fr]">
	<div class="lg:col-span-2">
		<p class="text-xs tracking-[0.14em] text-muted-foreground uppercase">Agent</p>
		<h1 class="mt-1 text-[22px] font-medium tracking-tight">Desk agent</h1>
	</div>
	<aside class="rounded-lg border border-border bg-card">
		<form method="post" action="?/create" use:enhance>
			<button type="submit" class="w-full border-b border-border px-3 py-2 text-left font-medium">
				New thread
			</button>
		</form>
		<ul>
			{#each data.conversations as conversation (conversation.id)}
				<li>
					<a href="/app/agent/{conversation.id}" class="block px-3 py-2 hover:bg-muted">
						<p class="truncate">{conversation.title}</p>
						<p class="text-xs text-muted-foreground">{shortDate(conversation.updatedAt)}</p>
					</a>
				</li>
			{/each}
		</ul>
	</aside>
	<EmptyState
		title="Ask the desk"
		body="Find leads, draft a note for the queue, add a task, or ask where a sequence stands. Tokens start before the side work finishes."
	>
		<form method="post" action="?/create" use:enhance>
			<button type="submit" class="rounded-md bg-accent px-2.5 py-1.5 text-accent-foreground">
				Start a thread
			</button>
		</form>
	</EmptyState>
</div>
