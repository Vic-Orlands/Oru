"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { api } from "@whirl/backend/convex/_generated/api";
import { AutumnProvider } from "autumn-js/react";
import {
  ConvexReactClient,
  useConvex,
  useConvexAuth,
} from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Toaster } from "sonner";
import { mutate } from "swr";

import { authClient } from "@/lib/auth/client";
import { FunnelTracker } from "@/components/analytics/funnel-tracker";

function AutumnBridge({ children }: { children: React.ReactNode }) {
  const convex = useConvex();
  const { isAuthenticated } = useConvexAuth();
  const authRef = useRef(isAuthenticated);

  const gatedConvex = useMemo(
    () => ({
      action: (ref: unknown, args: unknown) => {
        // Billing is optional in this deployment. Autumn's provider eagerly
        // creates a customer and lists products even when every billing
        // surface is hidden, so short-circuit those calls locally unless the
        // deployment explicitly enables Autumn.
        if (process.env.NEXT_PUBLIC_AUTUMN_ENABLED !== "true") {
          return Promise.resolve({ data: null, error: null });
        }
        if (!authRef.current) {
          return Promise.reject(new Error("Signed-out — skipping billing call"));
        }
        return convex.action(
          ref as Parameters<ConvexReactClient["action"]>[0],
          args as never,
        );
      },
    }),
    [convex],
  );

  useEffect(() => {
    authRef.current = isAuthenticated;
    if (!isAuthenticated) return;
    void mutate(() => true);
  }, [isAuthenticated]);

  return (
    <AutumnProvider
      convex={gatedConvex}
      convexApi={api.autumn}
      suppressLogs
    >
      <FunnelTracker />
      {children}
    </AutumnProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [convex] = useState(() => {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error(
        "NEXT_PUBLIC_CONVEX_URL is required. Add the real Convex deployment URL to apps/web/.env.local.",
      );
    }
    return new ConvexReactClient(convexUrl, { unsavedChangesWarning: false });
  });
  const tree = (
    <>
      <Toaster
        theme="system"
        position="bottom-right"
        toastOptions={{
          className:
            "!bg-popover !text-popover-foreground !border-border !text-[13px]",
        }}
      />
      <AutumnBridge>{children}</AutumnBridge>
    </>
  );

  return (
    <ConvexBetterAuthProvider
      client={convex}
      authClient={
        authClient as unknown as React.ComponentProps<
          typeof ConvexBetterAuthProvider
        >["authClient"]
      }
    >
      {tree}
    </ConvexBetterAuthProvider>
  );
}
