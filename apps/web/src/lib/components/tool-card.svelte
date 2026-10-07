<script lang="ts">
	import Badge from '#lib/components/ui/badge.svelte';

	type Person = {
		name: string;
		title: string;
		company: string;
		email: string;
		score: number;
		fit: boolean;
		location: string;
	};

	let { part }: { part: { type: string; state?: string; output?: unknown } } = $props();

	const name = $derived(part.type.replace(/^tool-/, ''));
	const output = $derived((part.output ?? {}) as Record<string, unknown>);
	const ready = $derived(part.state === 'output-available' || part.output !== undefined);
</script>

<article class="mt-2 overflow-hidden rounded-lg border border-border bg-background">
	<header class="flex items-center justify-between border-b border-border px-3 py-2">
		<p class="text-xs tracking-wide text-muted-foreground uppercase">
			{name.replace(/([A-Z])/g, ' $1')}
		</p>
		{#if !ready}
			<span class="skeleton h-3 w-16 rounded"></span>
		{/if}
	</header>
	{#if name === 'findLeads'}
		{@const people = (output.people as Person[] | undefined) ?? []}
		{#if people.length === 0 && ready}
			<p class="px-3 py-3 text-muted-foreground">
				No new people. {output.duplicates ?? 0} already on the desk.
			</p>
		{:else}
			<table class="w-full text-left">
				<thead class="text-[11px] text-muted-foreground">
					<tr>
						<th class="px-3 py-1.5 font-medium">Person</th>
						<th class="px-3 py-1.5 font-medium">Company</th>
						<th class="px-3 py-1.5 font-medium">Score</th>
					</tr>
				</thead>
				<tbody>
					{#each people as person (person.email)}
						<tr class="border-t border-border">
							<td class="px-3 py-1.5">
								<p>{person.name}</p>
								<p class="text-xs text-muted-foreground">{person.title}</p>
							</td>
							<td class="px-3 py-1.5">
								<p>{person.company}</p>
								<p class="text-xs text-muted-foreground">{person.location}</p>
							</td>
							<td class="num px-3 py-1.5">
								{person.score}
								{#if person.fit}<Badge tone="good">Fit</Badge>{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	{:else if name === 'draftEmail'}
		{#if output.empty}
			<p class="px-3 py-3 text-muted-foreground">No lead to write to yet. Find people first.</p>
		{:else if ready}
			<div class="space-y-1 px-3 py-3">
				<p class="text-xs text-muted-foreground">To {output.to}</p>
				<p class="font-medium">{output.subject}</p>
				<p class="text-muted-foreground">{output.body}</p>
				<a href="/app/approvals" class="inline-block text-xs text-accent">Open in the queue</a>
			</div>
		{/if}
	{:else if name === 'createTask'}
		<div class="px-3 py-3">
			<p class="font-medium">{output.title}</p>
			<p class="text-xs text-muted-foreground">{output.assignee} · due tomorrow</p>
			<a href="/app/tasks" class="text-xs text-accent">View tasks</a>
		</div>
	{:else if name === 'campaignSummary'}
		{@const campaigns =
			(output.campaigns as { id: string; name: string; status: string }[] | undefined) ?? []}
		<ul>
			{#each campaigns as campaign (campaign.id)}
				<li
					class="flex items-center justify-between border-t border-border px-3 py-2 first:border-0"
				>
					<a href="/app/campaigns/{campaign.id}">{campaign.name}</a>
					<Badge>{campaign.status}</Badge>
				</li>
			{:else}
				<li class="px-3 py-3 text-muted-foreground">No campaigns yet.</li>
			{/each}
		</ul>
	{:else if ready}
		<pre class="overflow-auto px-3 py-3 text-xs">{JSON.stringify(output, null, 2)}</pre>
	{/if}
</article>
