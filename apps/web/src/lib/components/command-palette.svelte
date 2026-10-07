<script lang="ts">
	import { goto } from '$app/navigation';
	import { Command, Dialog } from 'bits-ui';
	import { toggleTheme } from '$lib/theme.svelte';
	import { palette, togglePalette } from '$lib/palette.svelte';

	const items = [
		{ href: '/app', label: 'Overview' },
		{ href: '/app/agent', label: 'Agent' },
		{ href: '/app/leads', label: 'Leads' },
		{ href: '/app/lists', label: 'Lists' },
		{ href: '/app/approvals', label: 'Approvals' },
		{ href: '/app/campaigns', label: 'Campaigns' },
		{ href: '/app/pipeline', label: 'Pipeline' },
		{ href: '/app/tasks', label: 'Tasks' },
		{ href: '/app/settings', label: 'Settings' }
	];

	function onKey(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			togglePalette();
		}
	}

	function go(href: string) {
		palette.open = false;
		void goto(href);
	}
</script>

<svelte:window onkeydown={onKey} />

<Dialog.Root bind:open={palette.open}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-40 bg-black/40" />
		<Dialog.Content
			class="fixed top-[16%] left-1/2 z-50 w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-card shadow-[0_16px_50px_rgba(0,0,0,0.16)]"
		>
			<Dialog.Title class="sr-only">Command palette</Dialog.Title>
			<Dialog.Description class="sr-only">Jump to a page or toggle the theme.</Dialog.Description>
			<Command.Root class="flex flex-col">
				<Command.Input
					placeholder="Jump to…"
					class="h-11 border-b border-border bg-transparent px-3 text-[13px] outline-none placeholder:text-muted-foreground"
				/>
				<Command.List class="max-h-72 overflow-auto p-1">
					<Command.Empty class="px-3 py-6 text-center text-muted-foreground"
						>No matches.</Command.Empty
					>
					<Command.Group>
						{#each items as item (item.href)}
							<Command.Item
								value={item.label}
								onSelect={() => go(item.href)}
								class="flex cursor-pointer items-center rounded-md px-2 py-1.5 text-[13px] data-[selected]:bg-muted"
							>
								{item.label}
							</Command.Item>
						{/each}
						<Command.Item
							value="Toggle theme"
							onSelect={() => {
								toggleTheme();
								palette.open = false;
							}}
							class="flex cursor-pointer items-center rounded-md px-2 py-1.5 text-[13px] data-[selected]:bg-muted"
						>
							Toggle theme
						</Command.Item>
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
