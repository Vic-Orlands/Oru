"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { api } from "@whirl/backend/convex/_generated/api";
import { AutumnProvider } from "autumn-js/react";
import {
  ConvexProviderWithAuth,
  ConvexReactClient,
  useConvex,
  useConvexAuth,
} from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Toaster } from "sonner";
import { mutate } from "swr";

import { authClient } from "@/lib/auth/client";
import { isDemoMode } from "@/lib/auth/mode";
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

function useDemoAuth() {
  return {
    isLoading: false,
    isAuthenticated: false,
    fetchAccessToken: async () => null,
  };
}

/** Demo mode has no deployment. A socket that never opens keeps the
 *  provider's hooks quiet instead of hitting a fake *.convex.cloud host,
 *  which answers with a fatal "couldn't parse deployment name". */
class DemoSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  readyState = DemoSocket.CONNECTING;
  binaryType: BinaryType = "blob";
  url: string;
  protocol = "";
  extensions = "";
  bufferedAmount = 0;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  constructor(url: string) {
    this.url = url;
  }
  send() {}
  close() {
    this.readyState = DemoSocket.CLOSED;
  }
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return false;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const demo = isDemoMode();
  const [convex] = useState(() => {
    const convexUrl =
      process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud";
    if (demo) {
      return new ConvexReactClient(convexUrl, {
        logger: false,
        unsavedChangesWarning: false,
        webSocketConstructor: DemoSocket as unknown as typeof WebSocket,
      });
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

  if (demo) {
    return (
      <ConvexProviderWithAuth client={convex} useAuth={useDemoAuth}>
        {tree}
      </ConvexProviderWithAuth>
    );
  }

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
