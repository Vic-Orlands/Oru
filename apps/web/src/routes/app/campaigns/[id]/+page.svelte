<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import Badge from '#lib/components/ui/badge.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	$effect(() => {
		if (form?.message) toast.success(form.message);
	});

	function label(step: (typeof data.steps)[number]) {
		if (step.kind === 'email') return String(step.config.subject ?? 'Email');
		if (step.kind === 'wait') return `Wait ${step.config.days ?? 1} days`;
		if (step.kind === 'condition')
			return `If ${step.config.if ?? 'replied'}, ${step.config.then ?? 'stop'}`;
		return String(step.config.title ?? 'Task');
	}
</script>

<svelte:head>
	<title>{data.campaign.name} — Oso-Ahia</title>
</svelte:head>

<a href="/app/campaigns" class="text-xs text-muted-foreground">All sequences</a>
<header class="mt-2 flex flex-wrap items-end justify-between gap-3">
	<div>
		<p class="text-xs tracking-[0.14em] text-muted-foreground uppercase">Campaign</p>
		<h1 class="mt-1 text-[22px] font-medium tracking-tight">{data.campaign.name}</h1>
		{#if data.campaign.description}
			<p class="mt-1 max-w-xl text-muted-foreground">{data.campaign.description}</p>
		{/if}
	</div>
	<form method="post" action="?/status" class="flex gap-2" use:enhance>
		<select name="status" class="h-8 rounded-md border border-border bg-card px-2">
			{#each ['draft', 'active', 'paused'] as status (status)}
				<option value={status} selected={data.campaign.status === status}>{status}</option>
			{/each}
		</select>
		<button type="submit" class="h-8 rounded-md bg-muted px-2">Update</button>
	</form>
</header>

<div class="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
	<ol class="space-y-2">
		{#each data.steps as step, index (step.id)}
			<li class="rounded-lg border border-border bg-card px-3 py-2">
				<p class="text-[11px] text-muted-foreground">Step {index + 1} · {step.kind}</p>
				<p class="mt-0.5">{label(step)}</p>
			</li>
		{/each}
		<li>
			<form method="post" action="?/step" class="flex gap-2" use:enhance>
				<select name="kind" class="h-8 flex-1 rounded-md border border-border bg-card px-2">
					<option value="email">Email</option>
					<option value="wait">Wait</option>
					<option value="condition">Condition</option>
					<option value="task">Manual task</option>
				</select>
				<button type="submit" class="h-8 rounded-md bg-accent px-2 text-accent-foreground"
					>Add step</button
				>
			</form>
		</li>
	</ol>
	<div>
		<form
			method="post"
			action="?/enroll"
			class="rounded-lg border border-border bg-card"
			use:enhance
		>
			<div class="flex items-center justify-between border-b border-border px-3 py-2">
				<p class="font-medium">Enroll</p>
				<button type="submit" class="text-xs text-accent">Add selected</button>
			</div>
			<ul class="max-h-48 overflow-auto">
				{#each data.people as person (person.id)}
					<li class="flex items-center gap-2 border-b border-border px-3 py-1.5 last:border-0">
						<input type="checkbox" name="leadId" value={person.id} />
						<span>{person.name}</span>
						<span class="text-xs text-muted-foreground">{person.company}</span>
					</li>
				{/each}
			</ul>
		</form>
		<ul class="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
			{#each data.enrolled as person (person.id)}
				<li class="flex items-center justify-between gap-2 px-3 py-2">
					<span>
						<span>{person.name}</span>
						<span class="block text-xs text-muted-foreground"
							>{person.company} · step {person.stepIndex + 1}</span
						>
					</span>
					<Badge
						tone={person.status === 'waiting_approval'
							? 'warn'
							: person.status === 'stopped'
								? 'bad'
								: 'neutral'}
					>
						{person.status.replace('_', ' ')}
					</Badge>
				</li>
			{:else}
				<li class="px-3 py-4 text-muted-foreground">Nobody enrolled yet.</li>
			{/each}
		</ul>
	</div>
</div>
