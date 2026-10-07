<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		tone = 'neutral',
		class: className,
		children
	}: {
		tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'accent';
		class?: string;
		children?: Snippet;
	} = $props();

	const tones = {
		neutral: 'bg-muted text-muted-foreground',
		good: 'bg-accent/12 text-accent',
		warn: 'bg-warning/15 text-warning',
		bad: 'bg-danger/12 text-danger',
		accent: 'bg-accent text-accent-foreground'
	};
</script>

<span
	class={cn(
		'inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium tracking-wide',
		tones[tone],
		className
	)}
>
	{@render children?.()}
</span>
