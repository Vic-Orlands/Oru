import { useCallback, useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import {
  IconActivity,
  IconBrain,
  IconCoins,
  IconRefresh,
  IconRobot,
  IconUsers,
} from "@tabler/icons-react";

import { Skeleton } from "~/components/skeleton";
import { api } from "~/lib/backend";
import { formatDate } from "~/lib/format";
import { userErrorMessage } from "~/lib/errors";
import { DashboardSection, MetricCard, StatusPill } from "./dashboard-ui";

function compact(value: number): string {
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(value);
}

function money(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}

function when(value: number): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type MemoryHealth =
  | { status: "loading"; message: string }
  | { status: "missing" | "connected" | "error"; message: string };

export function DashboardPage() {
  const overview = useQuery(api.adminAnalytics.overview);
  const checkSupermemory = useAction(api.adminAnalytics.supermemoryHealth);
  const [memory, setMemory] = useState<MemoryHealth>({
    status: "loading",
    message: "Checking Supermemory…",
  });

  const refreshMemory = useCallback(async () => {
    setMemory({ status: "loading", message: "Checking Supermemory…" });
    try {
      setMemory(await checkSupermemory({}));
    } catch (cause) {
      setMemory({
        status: "error",
        message: userErrorMessage(cause, "Couldn't check Supermemory."),
      });
    }
  }, [checkSupermemory]);

  useEffect(() => {
    let active = true;
    void checkSupermemory({})
      .then((result) => {
        if (active) setMemory(result);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setMemory({
          status: "error",
          message: userErrorMessage(cause, "Couldn't check Supermemory."),
        });
      });
    return () => {
      active = false;
    };
  }, [checkSupermemory]);

  if (!overview) return <DashboardLoading />;

  const sampleDetail = overview.sampleStartedAt
    ? `Since ${formatDate(overview.sampleStartedAt)}${overview.sampleCapped ? " · latest sample" : ""}`
    : "No assistant replies yet";
  const memoryTone = {
    loading: "text-neutral-500 dark:text-neutral-400",
    connected: "text-emerald-700 dark:text-emerald-300",
    missing: "text-amber-700 dark:text-amber-300",
    error: "text-red-700 dark:text-red-300",
  }[memory.status];

  return (
    <>
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Operations
        </h1>
        <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">
          Live model usage, cost, agent tools, billing health, and user activity.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={IconCoins}
          label="Provider cost"
          value={money(overview.totals.costUsd)}
          detail={sampleDetail}
        />
        <MetricCard
          icon={IconBrain}
          label="Tokens"
          value={compact(overview.totals.totalTokens)}
          detail={`${compact(overview.totals.inputTokens)} in · ${compact(overview.totals.outputTokens)} out`}
        />
        <MetricCard
          icon={IconRobot}
          label="Agent tool calls"
          value={compact(overview.totals.toolCalls)}
          detail={`${compact(overview.totals.replies)} assistant replies`}
        />
        <MetricCard
          icon={IconUsers}
          label="Active users"
          value={compact(overview.users.length)}
          detail={`${overview.sampledMessages.toLocaleString()} messages sampled`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <DashboardSection
          title="Usage by user"
          description="Raw provider spend and tokens in the current bounded sample."
        >
          <div className="max-h-80 overflow-auto">
            <table className="w-full min-w-[620px] text-left text-[12.5px]">
              <thead className="sticky top-0 bg-[#f7f7f6] text-[11px] text-neutral-500 dark:bg-[#191918] dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-2 font-medium">User</th>
                  <th className="px-3 py-2 font-medium">Replies</th>
                  <th className="px-3 py-2 font-medium">Tokens</th>
                  <th className="px-3 py-2 font-medium">Tools</th>
                  <th className="px-4 py-2 text-right font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {overview.users.map((user) => (
                  <tr key={user.key} className="border-t border-black/[0.05] dark:border-white/[0.05]">
                    <td className="max-w-52 truncate px-4 py-2.5 font-mono text-[11px] text-neutral-600 dark:text-neutral-300" title={user.key}>
                      {user.key}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">{user.replies}</td>
                    <td className="px-3 py-2.5 tabular-nums">{compact(user.totalTokens)}</td>
                    <td className="px-3 py-2.5 tabular-nums">{user.toolCalls}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{money(user.costUsd)}</td>
                  </tr>
                ))}
                {overview.users.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">No usage yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </DashboardSection>

        <div className="space-y-6">
          <DashboardSection
            title="Supermemory"
            description="Checks the deployment key against the current API."
          >
            <div className="flex items-center gap-3 px-5 py-4">
              <span className={`size-2 rounded-full ${memory.status === "connected" ? "bg-emerald-500" : memory.status === "loading" ? "animate-pulse bg-neutral-400" : memory.status === "missing" ? "bg-amber-500" : "bg-red-500"}`} />
              <p className={`min-w-0 flex-1 text-[12.5px] ${memoryTone}`}>{memory.message}</p>
              <button
                type="button"
                onClick={() => void refreshMemory()}
                disabled={memory.status === "loading"}
                aria-label="Check Supermemory again"
                className="flex size-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-black/[0.05] hover:text-neutral-800 disabled:opacity-50 dark:hover:bg-white/[0.06] dark:hover:text-neutral-200"
              >
                <IconRefresh size={14} className={memory.status === "loading" ? "animate-spin" : ""} />
              </button>
            </div>
          </DashboardSection>

          <DashboardSection
            title="Billing ledger"
            description="Charges still waiting for Autumn or needing attention."
          >
            <div className="grid grid-cols-2 divide-x divide-black/[0.06] dark:divide-white/[0.06]">
              <LedgerStat label="Pending" count={overview.billing.pending.count} amount={overview.billing.pending.amount} tone="amber" />
              <LedgerStat label="Failed" count={overview.billing.failed.count} amount={overview.billing.failed.amount} tone="red" />
            </div>
          </DashboardSection>

          <DashboardSection title="Models" description="Spend across the models that served this sample.">
            <div className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
              {overview.models.slice(0, 8).map((model) => (
                <div key={model.key} className="flex items-center gap-3 px-5 py-3 text-[12.5px]">
                  <span className="min-w-0 flex-1 truncate font-medium">{model.key}</span>
                  <span className="text-neutral-400 tabular-nums">{compact(model.totalTokens)} tokens</span>
                  <span className="w-20 text-right tabular-nums">{money(model.costUsd)}</span>
                </div>
              ))}
            </div>
          </DashboardSection>
        </div>
      </div>

      <div className="mt-6">
        <DashboardSection
          title="Recent agent tool calls"
          description="What the agent invoked, whether it worked, and who ran it."
        >
          <div className="max-h-[30rem] overflow-auto">
            <table className="w-full min-w-[760px] text-left text-[12.5px]">
              <thead className="sticky top-0 bg-[#f7f7f6] text-[11px] text-neutral-500 dark:bg-[#191918] dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Tool</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Model</th>
                  <th className="px-3 py-2 font-medium">User</th>
                  <th className="px-4 py-2 text-right font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentToolCalls.map((call, index) => (
                  <tr key={`${call.messageId}:${call.kind}:${index}`} className="border-t border-black/[0.05] dark:border-white/[0.05]">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-neutral-800 dark:text-neutral-100">{call.label}</div>
                      <div className="mt-0.5 text-[10.5px] uppercase tracking-wide text-neutral-400">{call.kind}</div>
                    </td>
                    <td className="px-3 py-2.5"><StatusPill status={call.status} /></td>
                    <td className="px-3 py-2.5 text-neutral-500 dark:text-neutral-400">{call.model}</td>
                    <td className="max-w-44 truncate px-3 py-2.5 font-mono text-[10.5px] text-neutral-500" title={call.userId}>{call.userId}</td>
                    <td className="px-4 py-2.5 text-right text-neutral-500 tabular-nums">{when(call.createdAt)}</td>
                  </tr>
                ))}
                {overview.recentToolCalls.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-9 text-center text-neutral-400">No tool calls in this sample.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </DashboardSection>
      </div>
    </>
  );
}

function LedgerStat({ label, count, amount, tone }: { label: string; count: number; amount: number; tone: "amber" | "red" }) {
  const color = tone === "amber" ? "text-amber-700 dark:text-amber-300" : "text-red-700 dark:text-red-300";
  return (
    <div className="px-5 py-4">
      <div className="text-[11px] text-neutral-400">{label}</div>
      <div className={`mt-1 text-[19px] font-semibold tabular-nums ${color}`}>{count}</div>
      <div className="text-[11px] text-neutral-400">{money(amount)}</div>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div>
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-32 w-full rounded-2xl" />)}
      </div>
      <Skeleton className="mt-6 h-96 w-full rounded-2xl" />
    </div>
  );
}
