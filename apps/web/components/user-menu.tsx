"use client";

import { switchGoogleAccount, useClerk, useUser } from "@/lib/auth/session";
import Link from "next/link";
import {
  IconCreditCardFilled,
  IconLogout,
  IconUserPlus,
} from "@tabler/icons-react";
import { useCustomer } from "autumn-js/react";

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFreeMessagesLeft, formatResetsIn } from "@/lib/plan";
import { useCachedUsage } from "@/lib/usage-cache";
import { resetSupport } from "@/lib/support";
import { showToast } from "@/lib/toasts";
import { PlanBadge } from "./plan-badge";
import { UsageMeter } from "./usage-meter";

/* Compact, Cursor-ish rows: tight vertical rhythm, muted icons that
   brighten on focus (the base item styles handle the brighten). */
const ITEM = "gap-2 px-2 py-1.5";

/* On the icon itself (not a descendant selector) so the item's
   focus:**:text-accent-foreground rule still wins on hover. */
const ICON = "text-muted-foreground";

function UsageBlock() {
  const { user } = useUser();
  const { customer, isLoading, error } = useCustomer();
  /* Cached summary paints instantly on repeat opens; the skeleton only
     shows on a first-ever open. Errored fetches (the pre-auth window)
     read as unsettled, so the cache holds instead of a false "Free". */
  const usage = useCachedUsage(user?.id, customer, isLoading || error != null);

  if (!usage) {
    return (
      <div className="px-2 pt-1.5 pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
        <div className="mt-1.5 flex items-center justify-between">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-2.5 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 pt-1.5 pb-2">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium">Usage</span>
        {usage.planId ? (
          <PlanBadge plan={usage.planId} className="h-3 w-auto" />
        ) : (
          <span className="text-xs text-muted-foreground">
            {usage.planName}
          </span>
        )}
      </div>
      {usage.freeMessages ? (
        <>
          <UsageMeter remainingPct={usage.remainingPct} className="mt-2" />
          <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="truncate">
              {usage.nextResetAt
                ? `Resets in ${formatResetsIn(usage.nextResetAt)}`
                : "This period"}
            </span>
            <span className="shrink-0 font-medium whitespace-nowrap text-foreground">
              {formatFreeMessagesLeft(usage.freeMessages, { compact: true })}
            </span>
          </div>
        </>
      ) : usage.unlimited ? (
        <div className="mt-1 text-xs text-muted-foreground">
          Unlimited messages
        </div>
      ) : (
        <>
          <UsageMeter remainingPct={usage.remainingPct} className="mt-2" />
          <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="truncate">
              {usage.nextResetAt
                ? `Resets in ${formatResetsIn(usage.nextResetAt)}`
                : "This period"}
            </span>
            <span className="shrink-0 font-medium tabular-nums whitespace-nowrap text-foreground">
              {Math.round(usage.remainingPct)}% left
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export function UserMenuContent({
  billing = true,
  side = "bottom",
}: {
  /** False on a deployment without billing: no usage, no plans. */
  billing?: boolean;
  side?: "top" | "bottom";
}) {
  const { signOut } = useClerk();

  return (
    /* Solid on purpose — the user menu is the one popover that stays
       opaque. Width tracks the pill it anchors to (stableContentWidth's
       fixed w-56 left a growing right-side gap on wider sidebars, since
       the popup aligns to the pill's left edge); min-w-56 is the floor
       for the collapsed rail's tiny anchor. */
    <DropdownMenuContent
      side={side}
      sideOffset={8}
      className="w-(--anchor-width) min-w-56 bg-popover p-1 backdrop-blur-none"
    >
      {billing && (
        <>
          <UsageBlock />
          <DropdownMenuSeparator />
        </>
      )}

      {billing && (
        <DropdownMenuItem render={<Link href="/pricing" />} className={ITEM}>
          <IconCreditCardFilled size={15} className={ICON} />
          Plans & pricing
        </DropdownMenuItem>
      )}
      <DropdownMenuItem
        className={ITEM}
        onClick={() => {
          void switchGoogleAccount().catch(() => {
            showToast("Couldn’t open the account chooser. Try again.");
          });
        }}
      >
        <IconUserPlus size={15} className={ICON} />
        Use another account
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        className={ITEM}
        onClick={() => {
          void resetSupport();
          void signOut();
        }}
      >
        <IconLogout size={15} className={ICON} />
        Log out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
