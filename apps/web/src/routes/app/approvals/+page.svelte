<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import Badge from '#lib/components/ui/badge.svelte';
	import EmptyState from '#lib/components/ui/empty-state.svelte';
	import { shortDate } from '#lib/utils.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	$effect(() => {
		if (form?.message) toast.success(form.message);
	});

	const filters = ['pending', 'approved', 'sent', 'rejected', 'all'];
</script>

<svelte:head>
	<title>Approvals — Oso-Ahia</title>
</svelte:head>

<header>
	<p class="text-xs tracking-[0.14em] text-muted-foreground uppercase">Approvals</p>
	<h1 class="mt-1 text-[22px] font-medium tracking-tight">Nothing leaves without a person</h1>
</header>

<nav class="mt-4 flex gap-2 text-xs">
	{#each filters as filter (filter)}
		<a
			href="/app/approvals?status={filter}"
			aria-current={data.status === filter ? 'page' : undefined}
			class="rounded-md px-2 py-1 {data.status === filter
				? 'bg-muted text-foreground'
				: 'text-muted-foreground'}"
		>
			{filter}
		</a>
	{/each}
</nav>

{#if data.rows.length === 0}
	<div class="mt-4">
		<EmptyState
			title="Queue is clear"
			body="Drafts from the agent and from sequences land here before they can send."
		/>
	</div>
{:else}
	<ul class="mt-4 space-y-3">
		{#each data.rows as row (row.id)}
			<li class="rounded-lg border border-border bg-card p-4">
				<div class="flex flex-wrap items-center gap-2">
					<Badge
						tone={row.status === 'pending' ? 'warn' : row.status === 'rejected' ? 'bad' : 'good'}
						>{row.status}</Badge
					>
					<Badge>{row.type.replace('_', ' ')}</Badge>
					<p class="text-xs text-muted-foreground">
						{row.person}{row.company ? ` · ${row.company}` : ''} · {shortDate(row.createdAt)}
					</p>
				</div>
				{#if row.type === 'email' && (row.status === 'pending' || row.status === 'approved')}
					<form method="post" class="mt-3 grid gap-2" use:enhance>
						<input type="hidden" name="id" value={row.id} />
						<input
							name="subject"
							value={row.subject}
							class="rounded-md border border-border bg-background px-2 py-1.5 font-medium"
						/>
						<textarea
							name="body"
							rows="4"
							class="rounded-md border border-border bg-background px-2 py-1.5">{row.body}</textarea
						>
						<p class="text-xs text-muted-foreground">To {row.toEmail}</p>
						<div class="flex flex-wrap gap-2">
							<button formaction="?/edit" class="rounded-md bg-muted px-2 py-1 text-xs"
								>Save edit</button
							>
							{#if row.status === 'pending'}
								<button
									formaction="?/decide"
									name="next"
									value="approved"
									class="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground"
									>Approve</button
								>
								<button
									formaction="?/decide"
									name="next"
									value="rejected"
									class="rounded-md px-2 py-1 text-xs text-danger">Reject</button
								>
							{:else}
								<button
									formaction="?/send"
									class="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">Send</button
								>
							{/if}
						</div>
					</form>
				{:else}
					<p class="mt-2 font-medium">{row.subject || row.note}</p>
					{#if row.body}<p class="mt-1 text-muted-foreground">{row.body}</p>{/if}
					{#if row.note}<p class="mt-2 text-xs text-muted-foreground">{row.note}</p>{/if}
				{/if}
			</li>
		{/each}
	</ul>
{/if}
