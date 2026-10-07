<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, body, children }: { title: string; body: string; children?: Snippet } = $props();
</script>

<div class="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
	<p class="text-[15px] font-medium tracking-tight">{title}</p>
	<p class="mx-auto mt-1 max-w-sm text-muted-foreground">{body}</p>
	{#if children}
		<div class="mt-4 flex justify-center gap-2">{@render children()}</div>
	{/if}
</div>
