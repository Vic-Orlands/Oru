<script lang="ts">
	let { size = 18 }: { size?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true" class="shrink-0">
	<rect width="18" height="18" rx="4" class="fill-foreground" />
	<path d="M4 12.5 8.2 5h1.7L14 12.5h-1.8l-.8-1.8H6.6l-.8 1.8H4Z" class="fill-background" />
	<path d="M7.2 9.4h3.6" class="stroke-accent" stroke-width="1.2" />
</svg>
