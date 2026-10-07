<script lang="ts">
	import { enhance } from '$app/forms';
	import Badge from '$lib/components/ui/badge.svelte';
	import EmptyState from '$lib/components/ui/empty-state.svelte';
	import { fullName } from '$lib/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.list.name} — Oso-Ahia</title>
</svelte:head>

<a href="/app/lists" class="text-xs text-muted-foreground">All lists</a>
<header class="mt-2">
	<p class="text-xs tracking-[0.14em] text-muted-foreground uppercase">List</p>
	<h1 class="mt-1 text-[22px] font-medium tracking-tight">{data.list.name}</h1>
	{#if data.list.description}
		<p class="mt-1 text-muted-foreground">{data.list.description}</p>
	{/if}
</header>

{#if data.rows.length === 0}
	<div class="mt-4">
		<EmptyState title="This list is empty" body="Add people from the leads table." />
	</div>
{:else}
	<form
		method="post"
		action="?/remove"
		class="mt-4 overflow-hidden rounded-lg border border-border bg-card"
		use:enhance
	>
		<div class="flex items-center justify-between border-b border-border px-3 py-2">
			<p class="num text-xs text-muted-foreground">{data.total}</p>
			<button type="submit" class="text-xs text-danger">Remove selected</button>
		</div>
		<table class="w-full text-left">
			<tbody>
				{#each data.rows as lead (lead.id)}
					<tr class="border-b border-border last:border-0">
						<td class="px-3 py-2"><input type="checkbox" name="ids" value={lead.id} /></td>
						<td class="px-3 py-2">
							<a href="/app/leads?lead={lead.id}" class="font-medium"
								>{fullName(lead.firstName, lead.lastName)}</a
							>
							<p class="text-xs text-muted-foreground">{lead.title} · {lead.company}</p>
						</td>
						<td class="num px-3 py-2">{lead.score}</td>
						<td class="px-3 py-2"><Badge>{lead.status}</Badge></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</form>
{/if}
