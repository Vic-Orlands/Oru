<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Chat } from '@ai-sdk/svelte';
	import { DefaultChatTransport, type UIMessage } from 'ai';
	import { toast } from 'svelte-sonner';
	import ToolCard from '#lib/components/tool-card.svelte';

	let { conversationId, messages }: { conversationId: string; messages: UIMessage[] } = $props();

	// The thread is remounted per conversation, so the initial props are the whole lifetime.
	// svelte-ignore state_referenced_locally
	const chat = new Chat({
		id: conversationId,
		messages,
		transport: new DefaultChatTransport({
			api: '/api/chat',
			body: { conversationId }
		}),
		onError: (error) => {
			toast.error(error.message || 'The agent stopped.');
		},
		onFinish: () => {
			void invalidateAll();
		}
	});

	let draft = $state('');

	function textOf(message: UIMessage) {
		return message.parts
			.filter((part) => part.type === 'text')
			.map((part) => part.text)
			.join('');
	}

	function send(event: SubmitEvent) {
		event.preventDefault();
		const text = draft.trim();
		if (!text || chat.status === 'streaming' || chat.status === 'submitted') return;
		draft = '';
		void chat.sendMessage({ text });
	}
</script>

<section class="flex min-h-[64vh] flex-col rounded-lg border border-border bg-card">
	<div class="flex-1 space-y-4 overflow-auto px-4 py-4">
		{#each chat.messages as message (message.id)}
			<div class={message.role === 'user' ? 'ml-auto max-w-[40rem]' : 'max-w-[46rem]'}>
				<p class="text-[11px] tracking-wide text-muted-foreground uppercase">{message.role}</p>
				{#if textOf(message)}
					<p class="mt-1 whitespace-pre-wrap">{textOf(message)}</p>
				{/if}
				{#each message.parts as part, index (`${message.id}-${index}`)}
					{#if part.type.startsWith('tool-')}
						<ToolCard {part} />
					{/if}
				{/each}
			</div>
		{/each}
		{#if chat.status === 'submitted'}
			<div class="skeleton h-8 w-40 rounded-md"></div>
		{/if}
	</div>
	<form class="border-t border-border p-3" onsubmit={send}>
		<label class="sr-only" for="prompt">Message</label>
		<textarea
			id="prompt"
			bind:value={draft}
			rows="3"
			placeholder="Find fintech VPs in Lagos"
			class="w-full resize-none rounded-md border border-border bg-background px-2 py-1.5 outline-none"
		></textarea>
		<div class="mt-2 flex items-center gap-2">
			<button type="submit" class="rounded-md bg-accent px-2.5 py-1.5 text-accent-foreground">
				Send
			</button>
			{#if chat.status === 'streaming' || chat.status === 'submitted'}
				<button
					type="button"
					class="rounded-md px-2 py-1.5 hover:bg-muted"
					onclick={() => chat.stop()}
				>
					Stop
				</button>
			{:else if chat.messages.length > 0}
				<button
					type="button"
					class="rounded-md px-2 py-1.5 hover:bg-muted"
					onclick={() => chat.regenerate()}
				>
					Regenerate
				</button>
			{/if}
			<p class="ml-auto text-xs text-muted-foreground">Nothing sends from this thread.</p>
		</div>
	</form>
</section>
