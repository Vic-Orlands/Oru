<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { money } from '$lib/utils';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let moveId = $state('');
	let moveStage = $state('');
	let moveForm = $state<HTMLFormElement | null>(null);

	$effect(() => {
		if (form?.message) toast.message(form.message);
	});

	function cards(stage: string) {
		return data.deals.filter((deal) => deal.stage === stage);
	}
</script>

<svelte:head>
	<title>Pipeline — Oso-Ahia</title>
</svelte:head>

<header class="flex flex-wrap items-end justify-between gap-3">
	<div>
		<p class="text-xs tracking-[0.14em] text-muted-foreground uppercase">Pipeline</p>
		<h1 class="mt-1 text-[22px] font-medium tracking-tight">Deals</h1>
	</div>
	<form method="post" action="?/create" class="flex flex-wrap gap-2" use:enhance>
		<input
			name="title"
			required
			placeholder="Deal name"
			class="h-8 rounded-md border border-border bg-card px-2"
		/>
		<input
			name="value"
			type="number"
			min="0"
			step="1000"
			placeholder="Value"
			class="h-8 w-28 rounded-md border border-border bg-card px-2"
		/>
		<button type="submit" class="h-8 rounded-md bg-accent px-2.5 text-accent-foreground">Add</button
		>
	</form>
</header>

<form bind:this={moveForm} method="post" action="?/move" class="hidden" use:enhance>
	<input name="id" value={moveId} />
	<input name="stage" value={moveStage} />
</form>

<div class="mt-4 flex gap-3 overflow-x-auto pb-2">
	{#each data.stages as stage (stage)}
		<div
			role="group"
			aria-label={stage}
			class="w-56 shrink-0 rounded-lg border border-border bg-muted/40 p-2"
			ondragover={(event) => event.preventDefault()}
			ondrop={(event) => {
				event.preventDefault();
				const id = event.dataTransfer?.getData('text/plain');
				if (!id) return;
				moveId = id;
				moveStage = stage;
				queueMicrotask(() => moveForm?.requestSubmit());
			}}
		>
			<header class="flex items-center justify-between px-1 py-1 text-xs">
				<span class="capitalize">{stage}</span>
				<span class="num text-muted-foreground">{cards(stage).length}</span>
			</header>
			<ul class="mt-1 space-y-2">
				{#each cards(stage) as deal (deal.id)}
					<li
						class="cursor-grab rounded-md border border-border bg-card p-2"
						draggable="true"
						ondragstart={(event) => event.dataTransfer?.setData('text/plain', deal.id)}
					>
						<p class="font-medium">{deal.title}</p>
						<p class="text-xs text-muted-foreground">{deal.company || deal.ownerName}</p>
						<p class="num mt-1 text-xs">{money(deal.value)}</p>
						<form method="post" action="?/move" class="mt-2" use:enhance>
							<input type="hidden" name="id" value={deal.id} />
							<select
								name="stage"
								class="h-7 w-full rounded-md border border-border bg-background px-1 text-xs"
								onchange={(event) => event.currentTarget.form?.requestSubmit()}
							>
								{#each data.stages as option (option)}
									<option value={option} selected={option === deal.stage}>{option}</option>
								{/each}
							</select>
						</form>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</div>

<section class="mt-4 rounded-lg border border-border bg-card p-4">
	<h2 class="font-medium tracking-tight">Conversion</h2>
	<ul class="mt-3 grid gap-3 md:grid-cols-3">
		{#each data.funnel as step (`${step.from}-${step.to}`)}
			<li>
				<p class="text-xs text-muted-foreground capitalize">{step.from} → {step.to}</p>
				<p class="num text-[18px]">{Math.round(step.rate * 100)}%</p>
				<p class="text-xs text-muted-foreground">{step.toCount} reached {step.to}</p>
			</li>
		{/each}
	</ul>
</section>
