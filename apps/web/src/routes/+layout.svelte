<script lang="ts">
	import './layout.css';
	import { Toaster } from 'svelte-sonner';
	import favicon from '$lib/assets/favicon.svg';
	import { syncTheme, theme } from '$lib/theme.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	$effect(() => {
		syncTheme();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Oso-Ahia</title>
</svelte:head>

{@render children()}
<Toaster theme={theme.dark ? 'dark' : 'light'} />
