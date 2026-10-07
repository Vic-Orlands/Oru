<script lang="ts">
	import { BarChart } from 'layerchart';
	import Badge from '#lib/components/ui/badge.svelte';
	import { money, shortDate } from '#lib/utils.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const kpis = $derived([
		{ label: 'Open pipeline', value: money(data.pipelineValue), hint: `${data.openDeals} deals` },
		{ label: 'Won', value: money(data.wonValue), hint: 'Closed this desk' },
		{ label: 'Leads', value: String(data.leads), hint: `${data.fitLeads} fit the ICP` },
		{ label: 'Waiting', value: String(data.pendingApprovals), hint: 'Approvals in queue' }
	]);
</script>

<svelte:head>
	<title>Overview — Oso-Ahia</title>
</svelte:head>

<header class="flex flex-wrap items-end justify-between gap-3">
	<div>
		<p class="text-xs tracking-[0.14em] text-muted-foreground uppercase">Overview</p>
		<h1 class="mt-1 text-[22px] font-medium tracking-tight">This week on the desk</h1>
	</div>
	<a href="/app/approvals" class="text-[13px] text-accent">Review the queue</a>
</header>

<section
	class="mt-5 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 xl:grid-cols-4"
>
	{#each kpis as item (item.label)}
		<div class="bg-card px-4 py-3">
			<p class="text-xs text-muted-foreground">{item.label}</p>
			<p class="num mt-1 text-[22px] tracking-tight">{item.value}</p>
			<p class="mt-1 text-xs text-muted-foreground">{item.hint}</p>
		</div>
	{/each}
</section>

<section class="mt-5 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
	<div class="rounded-lg border border-border bg-card p-4">
		<div class="flex items-center justify-between">
			<h2 class="font-medium tracking-tight">Sends and replies</h2>
			<p class="text-xs text-muted-foreground">{data.meetings} meetings on the board</p>
		</div>
		<div class="mt-3 h-56">
			<BarChart
				data={data.chart}
				x="label"
				y="sent"
				bandPadding={0.28}
				series={[
					{
						key: 'sent',
						label: 'Sent',
						value: (row: { sent: number }) => row.sent,
						color: 'var(--accent)'
					},
					{
						key: 'replies',
						label: 'Replies',
						value: (row: { replies: number }) => row.replies,
						color: 'var(--warning)'
					}
				]}
			/>
		</div>
	</div>
	<div class="rounded-lg border border-border bg-card p-4">
		<h2 class="font-medium tracking-tight">Stage to stage</h2>
		<p class="mt-1 text-xs text-muted-foreground">
			Counted from the furthest stage each deal reached.
		</p>
		<ul class="mt-3 space-y-2">
			{#each data.funnel as step (`${step.from}-${step.to}`)}
				<li>
					<div class="flex items-center justify-between text-xs">
						<span class="capitalize">{step.from} → {step.to}</span>
						<span class="num">{Math.round(step.rate * 100)}%</span>
					</div>
					<div class="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
						<div class="h-full bg-accent" style:width={`${Math.round(step.rate * 100)}%`}></div>
					</div>
					<p class="mt-1 text-[11px] text-muted-foreground">
						{step.toCount} of {step.fromCount}
					</p>
				</li>
			{/each}
		</ul>
	</div>
</section>

<section class="mt-4 grid gap-4 lg:grid-cols-2">
	<div class="rounded-lg border border-border bg-card">
		<div class="flex items-center justify-between border-b border-border px-4 py-3">
			<h2 class="font-medium tracking-tight">Campaigns</h2>
			<a href="/app/campaigns" class="text-xs text-muted-foreground">All sequences</a>
		</div>
		<ul>
			{#each data.campaigns as campaign (campaign.id)}
				<li
					class="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 last:border-0"
				>
					<a href="/app/campaigns/{campaign.id}" class="truncate font-medium">{campaign.name}</a>
					<div class="flex items-center gap-2">
						<Badge tone={campaign.status === 'active' ? 'good' : 'neutral'}>{campaign.status}</Badge
						>
						<span class="num text-xs text-muted-foreground">{campaign.enrolled}</span>
					</div>
				</li>
			{:else}
				<li class="px-4 py-6 text-muted-foreground">No campaigns yet.</li>
			{/each}
		</ul>
	</div>
	<div class="rounded-lg border border-border bg-card">
		<div class="border-b border-border px-4 py-3">
			<h2 class="font-medium tracking-tight">Activity</h2>
		</div>
		<ul>
			{#each data.activity as item (item.id)}
				<li class="border-b border-border px-4 py-2.5 last:border-0">
					<p>{item.summary}</p>
					<p class="mt-0.5 text-xs text-muted-foreground">
						{item.actor} · {shortDate(item.createdAt)}
					</p>
				</li>
			{:else}
				<li class="px-4 py-6 text-muted-foreground">The desk is quiet.</li>
			{/each}
		</ul>
	</div>
</section>
