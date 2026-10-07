<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import Badge from '$lib/components/ui/badge.svelte';
	import EmptyState from '$lib/components/ui/empty-state.svelte';
	import { fullName } from '$lib/utils';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const columns = [
		{ id: 'person', label: 'Person' },
		{ id: 'company', label: 'Company' },
		{ id: 'title', label: 'Title' },
		{ id: 'location', label: 'Location' },
		{ id: 'score', label: 'Score' },
		{ id: 'status', label: 'Status' },
		{ id: 'source', label: 'Source' }
	] as const;

	let visible = $state<Record<string, boolean>>({
		person: true,
		company: true,
		title: true,
		location: true,
		score: true,
		status: true,
		source: false
	});
	let columnsOpen = $state(false);

	$effect(() => {
		if (form?.message) toast.success(form.message);
	});

	function href(patch: Record<string, string | null>) {
		const next = new URL(page.url.href);
		for (const [key, value] of Object.entries(patch)) {
			if (!value) next.searchParams.delete(key);
			else next.searchParams.set(key, value);
		}
		return `${next.pathname}${next.search}`;
	}

	const pages = $derived(Math.max(1, Math.ceil(data.total / data.pageSize)));
	const tone = (status: string) =>
		status === 'qualified' || status === 'meeting' || status === 'replied'
			? 'good'
			: status === 'unqualified'
				? 'bad'
				: 'neutral';
</script>

<svelte:head>
	<title>Leads — Oso-Ahia</title>
</svelte:head>

<header class="flex flex-wrap items-end justify-between gap-3">
	<div>
		<p class="text-xs tracking-[0.14em] text-muted-foreground uppercase">Leads</p>
		<h1 class="mt-1 text-[22px] font-medium tracking-tight">People on the desk</h1>
	</div>
	<p class="num text-xs text-muted-foreground">{data.total}</p>
</header>

<div class="mt-4 grid gap-3 lg:grid-cols-2">
	<form
		method="post"
		action="?/find"
		class="rounded-lg border border-border bg-card p-3"
		use:enhance
	>
		<p class="font-medium">Find</p>
		<div class="mt-2 grid gap-2 sm:grid-cols-3">
			<input
				name="text"
				placeholder="VP sales fintech"
				class="rounded-md border border-border bg-background px-2 py-1.5"
			/>
			<input
				name="industry"
				placeholder="Industry"
				class="rounded-md border border-border bg-background px-2 py-1.5"
			/>
			<input
				name="location"
				placeholder="City"
				class="rounded-md border border-border bg-background px-2 py-1.5"
			/>
		</div>
		<button type="submit" class="mt-2 rounded-md bg-accent px-2.5 py-1.5 text-accent-foreground"
			>Search the index</button
		>
	</form>
	<form
		method="post"
		action="?/importCsv"
		enctype="multipart/form-data"
		class="rounded-lg border border-border bg-card p-3"
		use:enhance
	>
		<p class="font-medium">Import CSV</p>
		<textarea
			name="csv"
			rows="2"
			placeholder="email,first_name,last_name,title,company,location,industry,employees"
			class="mt-2 w-full rounded-md border border-border bg-background px-2 py-1.5"></textarea>
		<div class="mt-2 flex items-center gap-2">
			<input name="file" type="file" accept=".csv,text/csv" class="text-xs" />
			<button type="submit" class="rounded-md bg-muted px-2.5 py-1.5">Import</button>
		</div>
	</form>
</div>

<form method="get" class="mt-4 flex flex-wrap items-center gap-2">
	<input
		name="q"
		value={data.filters.q}
		placeholder="Filter name, company, email"
		class="h-8 rounded-md border border-border bg-card px-2"
	/>
	<select name="status" class="h-8 rounded-md border border-border bg-card px-2">
		<option value="">Any status</option>
		{#each ['new', 'qualified', 'contacted', 'replied', 'meeting', 'unqualified'] as status (status)}
			<option value={status} selected={data.filters.status === status}>{status}</option>
		{/each}
	</select>
	<input type="hidden" name="sort" value={data.filters.sort} />
	<input type="hidden" name="dir" value={data.filters.dir} />
	<button type="submit" class="h-8 rounded-md bg-muted px-2">Apply</button>
	<button
		type="button"
		class="h-8 rounded-md px-2 text-xs"
		onclick={() => (columnsOpen = !columnsOpen)}>Columns</button
	>
</form>
{#if columnsOpen}
	<div class="mt-2 flex flex-wrap gap-3 text-xs">
		{#each columns as column (column.id)}
			<label class="flex items-center gap-1">
				<input type="checkbox" bind:checked={visible[column.id]} />
				{column.label}
			</label>
		{/each}
	</div>
{/if}

{#if data.rows.length === 0}
	<div class="mt-4">
		<EmptyState
			title="No leads in this view"
			body="Widen the filter, or search the index. Imports are scored and deduped before they land."
		/>
	</div>
{:else}
	<form
		method="post"
		class="mt-3 overflow-hidden rounded-lg border border-border bg-card"
		use:enhance
	>
		<div class="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
			<select name="status" class="h-7 rounded-md border border-border bg-background px-2 text-xs">
				{#each ['qualified', 'contacted', 'replied', 'meeting', 'unqualified', 'new'] as status (status)}
					<option value={status}>{status}</option>
				{/each}
			</select>
			<button formaction="?/setStatus" class="h-7 rounded-md bg-muted px-2 text-xs"
				>Set status</button
			>
			<button formaction="?/archive" class="h-7 rounded-md px-2 text-xs text-danger">Archive</button
			>
			<select name="listId" class="h-7 rounded-md border border-border bg-background px-2 text-xs">
				<option value="">List</option>
				{#each data.lists as list (list.id)}
					<option value={list.id}>{list.name}</option>
				{/each}
			</select>
			<button formaction="?/addToList" class="h-7 rounded-md bg-muted px-2 text-xs">Add</button>
			<select
				name="campaignId"
				class="h-7 rounded-md border border-border bg-background px-2 text-xs"
			>
				<option value="">Campaign</option>
				{#each data.campaigns as campaign (campaign.id)}
					<option value={campaign.id}>{campaign.name}</option>
				{/each}
			</select>
			<button formaction="?/enroll" class="h-7 rounded-md bg-muted px-2 text-xs">Enroll</button>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full min-w-[720px] text-left">
				<thead class="text-[11px] text-muted-foreground">
					<tr class="border-b border-border">
						<th class="w-8 px-3 py-2"></th>
						{#if visible.person}<th class="px-3 py-2 font-medium"
								><a
									href={href({
										sort: 'name',
										dir:
											data.filters.sort === 'name' && data.filters.dir === 'asc' ? 'desc' : 'asc',
										page: null
									})}>Person</a
								></th
							>{/if}
						{#if visible.company}<th class="px-3 py-2 font-medium"
								><a
									href={href({
										sort: 'company',
										dir: data.filters.dir === 'asc' ? 'desc' : 'asc',
										page: null
									})}>Company</a
								></th
							>{/if}
						{#if visible.title}<th class="px-3 py-2 font-medium">Title</th>{/if}
						{#if visible.location}<th class="px-3 py-2 font-medium">Location</th>{/if}
						{#if visible.score}<th class="px-3 py-2 font-medium"
								><a
									href={href({
										sort: 'score',
										dir:
											data.filters.sort === 'score' && data.filters.dir === 'desc' ? 'asc' : 'desc',
										page: null
									})}>Score</a
								></th
							>{/if}
						{#if visible.status}<th class="px-3 py-2 font-medium"
								><a href={href({ sort: 'status', dir: 'asc', page: null })}>Status</a></th
							>{/if}
						{#if visible.source}<th class="px-3 py-2 font-medium">Source</th>{/if}
					</tr>
				</thead>
				<tbody>
					{#each data.rows as lead (lead.id)}
						<tr class="border-b border-border last:border-0 hover:bg-muted/50">
							<td class="px-3 py-2"><input type="checkbox" name="ids" value={lead.id} /></td>
							{#if visible.person}
								<td class="px-3 py-2">
									<a href={href({ lead: lead.id })} class="font-medium"
										>{fullName(lead.firstName, lead.lastName)}</a
									>
									<p class="text-xs text-muted-foreground">{lead.email}</p>
								</td>
							{/if}
							{#if visible.company}<td class="px-3 py-2">{lead.company}</td>{/if}
							{#if visible.title}<td class="px-3 py-2 text-muted-foreground">{lead.title}</td>{/if}
							{#if visible.location}<td class="px-3 py-2">{lead.location}</td>{/if}
							{#if visible.score}
								<td class="num px-3 py-2">
									{lead.score}
									{#if lead.icpFit}<Badge tone="good">Fit</Badge>{/if}
								</td>
							{/if}
							{#if visible.status}<td class="px-3 py-2"
									><Badge tone={tone(lead.status)}>{lead.status}</Badge></td
								>{/if}
							{#if visible.source}<td class="px-3 py-2 text-xs text-muted-foreground"
									>{lead.source}</td
								>{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</form>
	<div class="mt-3 flex items-center justify-between text-xs text-muted-foreground">
		<a
			href={href({ page: String(Math.max(1, data.page - 1)) })}
			class={data.page <= 1 ? 'pointer-events-none opacity-40' : ''}>Previous</a
		>
		<span class="num">Page {data.page} of {pages}</span>
		<a
			href={href({ page: String(Math.min(pages, data.page + 1)) })}
			class={data.page >= pages ? 'pointer-events-none opacity-40' : ''}>Next</a
		>
	</div>
{/if}

{#if data.lead}
	<aside
		class="fixed inset-y-0 right-0 z-30 w-[min(380px,100vw)] overflow-auto border-l border-border bg-card p-4 shadow-[0_16px_50px_rgba(0,0,0,0.12)]"
	>
		<div class="flex items-start justify-between gap-3">
			<div>
				<p class="text-xs text-muted-foreground">{data.lead.company}</p>
				<h2 class="text-[18px] font-medium tracking-tight">
					{fullName(data.lead.firstName, data.lead.lastName)}
				</h2>
			</div>
			<a href={href({ lead: null })} class="text-xs text-muted-foreground">Close</a>
		</div>
		<dl class="mt-4 space-y-2 text-[13px]">
			<div class="flex justify-between gap-3">
				<dt class="text-muted-foreground">Title</dt>
				<dd>{data.lead.title}</dd>
			</div>
			<div class="flex justify-between gap-3">
				<dt class="text-muted-foreground">Email</dt>
				<dd class="truncate">{data.lead.email}</dd>
			</div>
			<div class="flex justify-between gap-3">
				<dt class="text-muted-foreground">Location</dt>
				<dd>{data.lead.location}</dd>
			</div>
			<div class="flex justify-between gap-3">
				<dt class="text-muted-foreground">Industry</dt>
				<dd>{data.lead.industry}</dd>
			</div>
			<div class="flex justify-between gap-3">
				<dt class="text-muted-foreground">Size</dt>
				<dd class="num">{data.lead.employeeCount}</dd>
			</div>
			<div class="flex justify-between gap-3">
				<dt class="text-muted-foreground">Score</dt>
				<dd class="num">{data.lead.score}</dd>
			</div>
		</dl>
		<ul class="mt-4 space-y-1 text-xs text-muted-foreground">
			{#each data.lead.fitReasons as reason (reason)}
				<li>{reason}</li>
			{/each}
		</ul>
		{#if data.lead.linkedinUrl}
			<a
				href={data.lead.linkedinUrl}
				class="mt-4 inline-block text-xs text-accent"
				target="_blank"
				rel="noreferrer">LinkedIn</a
			>
		{/if}
	</aside>
{/if}
