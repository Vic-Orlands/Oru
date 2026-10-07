<script lang="ts">
	import AppShell from '$lib/components/app-shell.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

{#if data.desk}
	<AppShell
		workspace={data.desk.workspace}
		userName={data.desk.userName}
		pending={data.desk.pending}
		notice={data.desk.notice ?? ''}
	>
		{@render children()}
	</AppShell>
{/if}
