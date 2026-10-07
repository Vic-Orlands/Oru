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

	const open = $derived(data.tasks.filter((task) => task.status === 'open'));
	const month = new Date();
	const first = new Date(month.getFullYear(), month.getMonth(), 1);
	const startPad = (first.getDay() + 6) % 7;
	const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
	const cells = Array.from({ length: startPad + days }, (_, index) => {
		const day = index - startPad + 1;
		return day > 0 ? day : null;
	});

	function tasksOn(day: number) {
		return open.filter((task) => {
			if (!task.dueAt) return false;
			const date = new Date(task.dueAt);
			return date.getMonth() === month.getMonth() && date.getDate() === day;
		});
	}
</script>

<svelte:head>
	<title>Tasks — Oso-Ahia</title>
</svelte:head>

<header class="flex flex-wrap items-end justify-between gap-3">
	<div>
		<p class="text-xs tracking-[0.14em] text-muted-foreground uppercase">Tasks</p>
		<h1 class="mt-1 text-[22px] font-medium tracking-tight">What is due</h1>
	</div>
	<nav class="flex gap-2 text-xs">
		<a
			href="/app/tasks?view=list"
			aria-current={data.view === 'list' ? 'page' : undefined}
			class="rounded-md px-2 py-1 {data.view === 'list' ? 'bg-muted' : 'text-muted-foreground'}"
			>List</a
		>
		<a
			href="/app/tasks?view=calendar"
			aria-current={data.view === 'calendar' ? 'page' : undefined}
			class="rounded-md px-2 py-1 {data.view === 'calendar' ? 'bg-muted' : 'text-muted-foreground'}"
			>Calendar</a
		>
	</nav>
</header>

<form
	method="post"
	action="?/create"
	class="mt-4 grid gap-2 rounded-lg border border-border bg-card p-3 md:grid-cols-[1.4fr_0.8fr_0.7fr_auto]"
	use:enhance
>
	<input
		name="title"
		required
		placeholder="Follow up with Amara"
		class="h-8 rounded-md border border-border bg-background px-2"
	/>
	<input name="due" type="date" class="h-8 rounded-md border border-border bg-background px-2" />
	<select name="recurrence" class="h-8 rounded-md border border-border bg-background px-2">
		<option value="none">Once</option>
		<option value="daily">Daily</option>
		<option value="weekly">Weekly</option>
	</select>
	<button type="submit" class="h-8 rounded-md bg-accent px-2.5 text-accent-foreground">Add</button>
	<input
		name="notes"
		placeholder="Notes"
		class="h-8 rounded-md border border-border bg-background px-2 md:col-span-3"
	/>
</form>

{#if data.view === 'calendar'}
	<div
		class="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border"
	>
		{#each ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as name (name)}
			<div class="bg-muted px-2 py-1 text-[11px] text-muted-foreground">{name}</div>
		{/each}
		{#each cells as day, index (index)}
			<div class="min-h-20 bg-card p-1.5">
				{#if day}
					<p class="num text-[11px] text-muted-foreground">{day}</p>
					{#each tasksOn(day) as task (task.id)}
						<p class="mt-1 truncate text-[11px]">{task.title}</p>
					{/each}
				{/if}
			</div>
		{/each}
	</div>
{:else if open.length === 0}
	<div class="mt-4">
		<EmptyState
			title="Nothing open"
			body="Manual tasks, agent tasks, and recurring sweeps show up here."
		/>
	</div>
{:else}
	<ul class="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
		{#each data.tasks as task (task.id)}
			<li class="flex items-center justify-between gap-3 px-3 py-2">
				<div>
					<p class={task.status === 'done' ? 'text-muted-foreground line-through' : ''}>
						{task.title}
					</p>
					<p class="text-xs text-muted-foreground">
						{task.assigneeName || 'Unassigned'} · {shortDate(task.dueAt)} · {task.source}
						{#if task.recurrence !== 'none'}
							· {task.recurrence}{/if}
					</p>
				</div>
				<div class="flex items-center gap-2">
					<Badge tone={task.status === 'open' ? 'warn' : 'neutral'}>{task.status}</Badge>
					{#if task.status === 'open'}
						<form method="post" action="?/complete" use:enhance>
							<input type="hidden" name="id" value={task.id} />
							<button type="submit" class="text-xs text-accent">Done</button>
						</form>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
{/if}
