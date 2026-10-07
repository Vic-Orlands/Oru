<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import Badge from '$lib/components/ui/badge.svelte';
	import { shortDate } from '$lib/utils';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const createdKey = $derived(form && 'createdKey' in form ? form.createdKey : '');
	const redirectTo = $derived(form && 'redirectTo' in form ? form.redirectTo : '');

	$effect(() => {
		if (redirectTo) window.location.href = redirectTo;
		else if (form && 'message' in form && form.message) toast.success(form.message);
	});
</script>

<svelte:head>
	<title>Settings — Oso-Ahia</title>
</svelte:head>

<header>
	<p class="text-xs tracking-[0.14em] text-muted-foreground uppercase">Settings</p>
	<h1 class="mt-1 text-[22px] font-medium tracking-tight">{data.workspace.name}</h1>
	<p class="mt-1 text-xs text-muted-foreground">
		Google {data.services.google ? 'on' : 'off'} · OpenRouter {data.services.openRouter
			? 'on'
			: 'off'} · Composio {data.services.composio ? 'on' : 'off'} · signed in as {data.services
			.email}
	</p>
</header>

{#if createdKey}
	<p class="mt-4 rounded-md border border-border bg-card px-3 py-2">
		<span class="text-xs text-muted-foreground">New key</span>
		<span class="num mt-1 block break-all">{createdKey}</span>
	</p>
{/if}

<div class="mt-5 grid gap-4 lg:grid-cols-2">
	<section class="rounded-lg border border-border bg-card p-4">
		<h2 class="font-medium">Workspace</h2>
		<form method="post" action="?/workspace" class="mt-3 flex gap-2" use:enhance>
			<input
				name="name"
				value={data.workspace.name}
				class="h-8 flex-1 rounded-md border border-border bg-background px-2"
			/>
			<button type="submit" class="h-8 rounded-md bg-muted px-2">Save</button>
		</form>
		<p class="mt-2 text-xs text-muted-foreground">Slug {data.workspace.slug}</p>
	</section>

	<section class="rounded-lg border border-border bg-card p-4">
		<h2 class="font-medium">Members</h2>
		<ul class="mt-3 divide-y divide-border">
			{#each data.members as member (member.id)}
				<li class="flex items-center justify-between gap-2 py-2">
					<span>
						<span>{member.name}</span>
						<span class="block text-xs text-muted-foreground">{member.email}</span>
					</span>
					<span class="flex items-center gap-2">
						<Badge>{member.role}</Badge>
						{#if member.role !== 'owner'}
							<form method="post" action="?/remove" use:enhance>
								<input type="hidden" name="id" value={member.id} />
								<button type="submit" class="text-xs text-danger">Remove</button>
							</form>
						{/if}
					</span>
				</li>
			{/each}
		</ul>
		<form method="post" action="?/invite" class="mt-3 grid gap-2" use:enhance>
			<input
				name="name"
				placeholder="Name"
				class="h-8 rounded-md border border-border bg-background px-2"
			/>
			<input
				name="email"
				type="email"
				required
				placeholder="Email"
				class="h-8 rounded-md border border-border bg-background px-2"
			/>
			<div class="flex gap-2">
				<select name="role" class="h-8 rounded-md border border-border bg-background px-2">
					<option value="member">Member</option>
					<option value="admin">Admin</option>
				</select>
				<button type="submit" class="h-8 rounded-md bg-accent px-2 text-accent-foreground"
					>Invite</button
				>
			</div>
		</form>
	</section>

	<section class="rounded-lg border border-border bg-card p-4 lg:col-span-2">
		<h2 class="font-medium">ICP</h2>
		<form method="post" action="?/icp" class="mt-3 grid gap-2 md:grid-cols-2" use:enhance>
			<label class="grid gap-1 text-xs text-muted-foreground"
				>Titles
				<input
					name="titles"
					value={data.workspace.icp.titles.join(', ')}
					class="h-8 rounded-md border border-border bg-background px-2 text-[13px] text-foreground"
				/>
			</label>
			<label class="grid gap-1 text-xs text-muted-foreground"
				>Industries
				<input
					name="industries"
					value={data.workspace.icp.industries.join(', ')}
					class="h-8 rounded-md border border-border bg-background px-2 text-[13px] text-foreground"
				/>
			</label>
			<label class="grid gap-1 text-xs text-muted-foreground md:col-span-2"
				>Geos
				<input
					name="geos"
					value={data.workspace.icp.geos.join(', ')}
					class="h-8 rounded-md border border-border bg-background px-2 text-[13px] text-foreground"
				/>
			</label>
			<label class="grid gap-1 text-xs text-muted-foreground"
				>Min employees
				<input
					name="minEmployees"
					type="number"
					value={data.workspace.icp.minEmployees}
					class="h-8 rounded-md border border-border bg-background px-2 text-[13px] text-foreground"
				/>
			</label>
			<label class="grid gap-1 text-xs text-muted-foreground"
				>Max employees
				<input
					name="maxEmployees"
					type="number"
					value={data.workspace.icp.maxEmployees}
					class="h-8 rounded-md border border-border bg-background px-2 text-[13px] text-foreground"
				/>
			</label>
			<label class="grid gap-1 text-xs text-muted-foreground md:col-span-2"
				>Notes
				<textarea
					name="notes"
					rows="3"
					class="rounded-md border border-border bg-background px-2 py-1.5 text-[13px] text-foreground"
					>{data.workspace.icp.notes}</textarea
				>
			</label>
			<button type="submit" class="h-8 w-fit rounded-md bg-accent px-2.5 text-accent-foreground"
				>Save ICP</button
			>
		</form>
	</section>

	<section class="rounded-lg border border-border bg-card p-4">
		<h2 class="font-medium">Models</h2>
		<p class="mt-1 text-xs text-muted-foreground">
			Chat is running as {data.models.chatModel}. Judge is {data.models.judgeModel}.
			{data.models.demoAi ? 'Demo stand-in is active.' : 'Live OpenRouter calls are active.'}
		</p>
		<form method="post" action="?/models" class="mt-3 grid gap-2" use:enhance>
			<input
				name="chatModel"
				value={data.models.chatModel}
				class="h-8 rounded-md border border-border bg-background px-2"
			/>
			<input
				name="judgeModel"
				value={data.models.judgeModel}
				class="h-8 rounded-md border border-border bg-background px-2"
			/>
			<button type="submit" class="h-8 w-fit rounded-md bg-muted px-2">Save overrides</button>
		</form>
	</section>

	<section class="rounded-lg border border-border bg-card p-4">
		<h2 class="font-medium">API keys</h2>
		<p class="mt-1 text-xs text-muted-foreground">GET /api/v1/leads with Authorization: Bearer.</p>
		<ul class="mt-3 space-y-2">
			{#each data.keys as key (key.id)}
				<li class="flex items-center justify-between gap-2">
					<span>
						<span>{key.name}</span>
						<span class="num block text-xs text-muted-foreground"
							>{key.prefix}… · {shortDate(key.lastUsedAt)}</span
						>
					</span>
					<form method="post" action="?/revokeKey" use:enhance>
						<input type="hidden" name="id" value={key.id} />
						<button type="submit" class="text-xs text-danger">Revoke</button>
					</form>
				</li>
			{/each}
		</ul>
		<form method="post" action="?/createKey" class="mt-3 flex gap-2" use:enhance>
			<input
				name="name"
				placeholder="Key name"
				class="h-8 flex-1 rounded-md border border-border bg-background px-2"
			/>
			<button type="submit" class="h-8 rounded-md bg-accent px-2 text-accent-foreground"
				>Create</button
			>
		</form>
	</section>
</div>

<section class="mt-4 rounded-lg border border-border bg-card p-4">
	<h2 class="font-medium">Integrations</h2>
	<p class="mt-1 text-xs text-muted-foreground">
		{data.services.composio
			? 'Composio will open the provider sign-in.'
			: 'Without COMPOSIO_API_KEY, Connect simulates the account so the rest of the desk can be explored.'}
	</p>
	<ul class="mt-3 divide-y divide-border">
		{#each data.toolkits as toolkit (toolkit.slug)}
			<li class="flex flex-wrap items-center justify-between gap-2 py-2">
				<span>
					<span class="font-medium">{toolkit.name}</span>
					<span class="block text-xs text-muted-foreground">{toolkit.description}</span>
				</span>
				<span class="flex items-center gap-2">
					<Badge tone={toolkit.status === 'connected' ? 'good' : 'neutral'}>
						{toolkit.status}{toolkit.mode ? ` · ${toolkit.mode}` : ''}
					</Badge>
					<form
						method="post"
						action={toolkit.status === 'connected' ? '?/disconnect' : '?/connect'}
						use:enhance
					>
						<input type="hidden" name="slug" value={toolkit.slug} />
						<button type="submit" class="text-xs text-accent">
							{toolkit.status === 'connected' ? 'Disconnect' : 'Connect'}
						</button>
					</form>
				</span>
			</li>
		{/each}
	</ul>
</section>
