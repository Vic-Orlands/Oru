<script lang="ts">
	import { enhance } from '$app/forms';
	import { shortDate } from '#lib/utils.js';
	import Thread from '#lib/components/thread.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.conversation.title} — Oso-Ahia</title>
</svelte:head>

<div class="grid gap-4 lg:grid-cols-[240px_1fr]">
	<aside class="rounded-lg border border-border bg-card">
		<form method="post" action="/app/agent?/create" use:enhance>
			<button type="submit" class="w-full border-b border-border px-3 py-2 text-left font-medium">
				New thread
			</button>
		</form>
		<ul>
			{#each data.conversations as conversation (conversation.id)}
				<li>
					<a
						href="/app/agent/{conversation.id}"
						aria-current={conversation.id === data.conversation.id ? 'page' : undefined}
						class="block px-3 py-2 {conversation.id === data.conversation.id
							? 'bg-muted'
							: 'hover:bg-muted'}"
					>
						<p class="truncate">{conversation.title}</p>
						<p class="text-xs text-muted-foreground">{shortDate(conversation.updatedAt)}</p>
					</a>
				</li>
			{/each}
		</ul>
	</aside>
	{#key data.conversation.id}
		<Thread conversationId={data.conversation.id} messages={data.messages} />
	{/key}
</div>
