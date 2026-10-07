<script lang="ts">
	import { tv, type VariantProps } from 'tailwind-variants';
	import { cn } from '$lib/utils';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	const styles = tv({
		base: 'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-[background-color,opacity,transform] duration-150 ease-[var(--ease-out-soft)] disabled:pointer-events-none disabled:opacity-40',
		variants: {
			variant: {
				primary: 'bg-accent text-accent-foreground hover:opacity-90',
				secondary: 'bg-muted text-foreground hover:bg-border',
				ghost: 'text-foreground hover:bg-muted',
				danger: 'bg-danger text-white hover:opacity-90'
			},
			size: {
				sm: 'h-7 px-2 text-xs',
				md: 'h-8 px-2.5 text-[13px]',
				lg: 'h-9 px-3 text-[13px]'
			}
		},
		defaultVariants: { variant: 'primary', size: 'md' }
	});

	type Props = HTMLButtonAttributes & VariantProps<typeof styles> & { class?: string };
	let { variant, size, class: className, children, type = 'button', ...rest }: Props = $props();
</script>

<button class={cn(styles({ variant, size }), className)} {type} {...rest}>
	{@render children?.()}
</button>
