<script lang="ts">
	import { enhance } from '$app/forms';
	import Badge from '$lib/components/ui/badge.svelte';
	import EmptyState from '$lib/components/ui/empty-state.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Campaigns — Oso-Ahia</title>
</svelte:head>

<header>
	<p class="text-xs tracking-[0.14em] text-muted-foreground uppercase">Campaigns</p>
	<h1 class="mt-1 text-[22px] font-medium tracking-tight">Sequences</h1>
</header>

<form method="post" action="?/create" class="mt-4 flex flex-wrap items-end gap-2" use:enhance>
	<label class="grid gap-1 text-xs text-muted-foreground">
		Name
		<input
			name="name"
			required
			class="h-8 rounded-md border border-border bg-card px-2 text-[13px] text-foreground"
		/>
	</label>
	<label class="grid min-w-48 flex-1 gap-1 text-xs text-muted-foreground">
		Description
		<input
			name="description"
			class="h-8 rounded-md border border-border bg-card px-2 text-[13px] text-foreground"
		/>
	</label>
	<button type="submit" class="h-8 rounded-md bg-accent px-2.5 text-accent-foreground"
		>New sequence</button
	>
</form>

{#if data.campaigns.length === 0}
	<div class="mt-4">
		<EmptyState
			title="No sequences"
			body="A sequence is email, wait, a condition, and a task. Email steps always stop in the approval queue."
		/>
	</div>
{:else}
	<ul class="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
		{#each data.campaigns as campaign (campaign.id)}
			<li>
				<a
					href="/app/campaigns/{campaign.id}"
					class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/60"
				>
					<span>
						<span class="font-medium">{campaign.name}</span>
						{#if campaign.description}
							<span class="mt-0.5 block text-xs text-muted-foreground">{campaign.description}</span>
						{/if}
					</span>
					<Badge tone={campaign.status === 'active' ? 'good' : 'neutral'}>{campaign.status}</Badge>
				</a>
			</li>
		{/each}
	</ul>
{/if}
