import type { ReactNode } from "react";
import type { Icon } from "@tabler/icons-react";

export function MetricCard({
  icon: IconComponent,
  label,
  value,
  detail,
}: {
  icon: Icon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white/55 p-4 dark:border-white/[0.07] dark:bg-white/[0.025]">
      <div className="flex items-center gap-2 text-[12px] font-medium text-neutral-500 dark:text-neutral-400">
        <IconComponent size={15} stroke={2} />
        {label}
      </div>
      <div className="mt-3 text-[24px] font-semibold tracking-tight text-neutral-900 tabular-nums dark:text-neutral-100">
        {value}
      </div>
      <p className="mt-0.5 text-[11.5px] text-neutral-400 dark:text-neutral-500">
        {detail}
      </p>
    </div>
  );
}

export function DashboardSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white/55 dark:border-white/[0.07] dark:bg-white/[0.025]">
      <div className="border-b border-black/[0.06] px-5 py-4 dark:border-white/[0.06]">
        <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          {title}
        </h2>
        <p className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

export function StatusPill({
  status,
}: {
  status: "pending" | "succeeded" | "failed";
}) {
  const classes = {
    pending:
      "bg-amber-500/[0.1] text-amber-700 dark:bg-amber-400/[0.12] dark:text-amber-300",
    succeeded:
      "bg-emerald-500/[0.1] text-emerald-700 dark:bg-emerald-400/[0.12] dark:text-emerald-300",
    failed:
      "bg-red-500/[0.1] text-red-700 dark:bg-red-400/[0.12] dark:text-red-300",
  }[status];
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${classes}`}>
      {status}
    </span>
  );
}
