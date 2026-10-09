import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DataTableFrame({
  children,
  className,
  minWidth,
}: {
  children: ReactNode;
  className?: string;
  minWidth?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-card shadow-[0_0_0_1px_var(--border),0_1px_2px_rgb(0_0_0/0.03)] dark:shadow-[0_0_0_1px_var(--border)]",
        className,
      )}
    >
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <table
          className="w-full border-separate border-spacing-0 text-left text-[12.5px]/5"
          style={minWidth ? { minWidth } : undefined}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

export function DataTableHead({
  className,
  ...props
}: ComponentPropsWithoutRef<"thead">) {
  return (
    <thead
      className={cn(
        "bg-muted/35 text-[11px]/4 font-medium tracking-[0.025em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function DataTableHeaderCell({
  className,
  ...props
}: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      className={cn(
        "border-b border-r border-border px-3.5 py-2.5 font-medium whitespace-nowrap last:border-r-0",
        className,
      )}
      {...props}
    />
  );
}

export function DataTableRow({
  className,
  ...props
}: ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      className={cn(
        "group/data-row transition-colors duration-150 hover:bg-muted/20",
        className,
      )}
      {...props}
    />
  );
}

export function DataTableCell({
  className,
  ...props
}: ComponentPropsWithoutRef<"td">) {
  return (
    <td
      className={cn(
        "border-r border-b border-border px-3.5 py-3 align-middle last:border-r-0 group-last/data-row:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

const TONES = {
  neutral: "bg-muted/70 text-muted-foreground",
  success:
    "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  warning:
    "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
  danger: "bg-red-500/10 text-red-700 dark:bg-red-400/10 dark:text-red-300",
  info: "bg-blue-500/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300",
} as const;

export function StatusPill({
  children,
  tone = "neutral",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px]/5 font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {dot ? (
        <span className="size-1.5 rounded-full bg-current opacity-80" />
      ) : null}
      {children}
    </span>
  );
}

export function PrimaryCell({
  title,
  subtitle,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="font-medium text-foreground">{title}</div>
      {subtitle ? (
        <div className="mt-0.5 text-[11.5px]/4 text-muted-foreground">
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}
