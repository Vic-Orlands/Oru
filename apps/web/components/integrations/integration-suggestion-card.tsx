"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/lib/auth/session";
import {
  IconCircleCheckFilled,
  IconClockPause,
  IconDownload,
  IconX,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { useMutation } from "convex/react";

import { api } from "@oru/backend/convex/_generated/api";
import type { Id } from "@oru/backend/convex/_generated/dataModel";
import { AuthModal } from "@/components/auth/auth-modal";
import { IntegrationLogo } from "@/components/integration-logo";
import { Button } from "@/components/ui/button";
import { IntegrationInstallModal } from "@/components/integrations/install-modal";
import { VerifiedBadge } from "@/components/integrations/verified-badge";
import {
  useSuggestedIntegrations,
  type StoreIntegration,
} from "@/lib/integrations-data";
import type { MessagePhase } from "@/lib/messages";
import { captureEvent } from "@/lib/posthog";

/* Chat suggestions are a recommendation, not a transplanted store list: the
   phase provides durable ids + name snapshots, while this card hydrates
   current branding, setup requirements, and install state.

   One tile. The model searches the store, picks the listing that fits what
   was actually asked, and cards that — a shelf of four near-misses looked
   like nobody had chosen. Older messages may still carry several items, so
   the render walks the list rather than assuming a single entry. */

type IntegrationSuggestionItem = {
  integrationId: string;
  name: string;
};

export function IntegrationSuggestionCard({
  phase,
  animate,
  messageId,
  phaseIndex,
}: {
  phase: MessagePhase;
  animate: boolean;
  messageId?: string;
  phaseIndex?: number;
}) {
  const items = useMemo(
    () =>
      ((phase.items ?? []) as unknown[]).filter(
        (item): item is IntegrationSuggestionItem =>
          typeof item === "object" &&
          item !== null &&
          "integrationId" in item &&
          typeof item.integrationId === "string" &&
          "name" in item &&
          typeof item.name === "string",
      ),
    [phase.items],
  );
  const ids = useMemo(
    () => items.map((item) => item.integrationId as Id<"integrations">),
    [items],
  );
  const integrations = useSuggestedIntegrations(ids);
  const { user, isLoaded } = useUser();
  const [selectedId, setSelectedId] = useState<Id<"integrations"> | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [declineError, setDeclineError] = useState<string | null>(null);
  const declineGate = useMutation(api.messages.declineIntegrationGate);
  const shownEventSent = useRef(false);

  useEffect(() => {
    if (shownEventSent.current || items.length === 0) return;
    shownEventSent.current = true;
    captureEvent("integration_suggestion_shown", {
      count: items.length,
      integrations: items.map((item) => item.name),
      query: phase.query,
    });
  }, [items, phase.query]);

  if (items.length === 0) return null;
  if (integrations !== undefined && integrations.length === 0) return null;

  const entries = integrations ?? placeholderEntries(items);
  const selected =
    integrations?.find((entry) => entry.id === selectedId) ?? null;
  const ready = integrations !== undefined;

  const openEntry = (entry: StoreIntegration) => {
    if (!ready) return;
    captureEvent("integration_suggestion_clicked", {
      integration: entry.name,
      installed: entry.installedConnected,
    });
    setSelectedId(entry.id);
  };

  return (
    <>
      <motion.div
        initial={animate ? { opacity: 0, y: 5 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
        className="mb-2 flex w-full min-w-0 flex-col gap-2"
      >
        {phase.connectionStatus && (
          <ConnectionGateStatus
            status={phase.connectionStatus}
            name={entries[0]?.name ?? items[0]?.name ?? "this app"}
          />
        )}
        {entries.map((entry) => (
          <SuggestionTile
            key={entry.id}
            entry={entry}
            ready={ready}
            onOpen={() => openEntry(entry)}
            connectionStatus={phase.connectionStatus}
            declining={declining}
            declineError={declineError}
            onDecline={
              phase.connectionStatus === "waiting" &&
              messageId !== undefined &&
              phaseIndex !== undefined
                ? async () => {
                    setDeclining(true);
                    setDeclineError(null);
                    try {
                      await declineGate({
                        messageId: messageId as Id<"messages">,
                        phaseIndex,
                      });
                    } catch (cause) {
                      setDeclineError(
                        cause instanceof Error
                          ? cause.message
                          : "Couldn't record that choice. Try again.",
                      );
                    } finally {
                      setDeclining(false);
                    }
                  }
                : undefined
            }
          />
        ))}
      </motion.div>

      <IntegrationInstallModal
        integration={selected}
        onClose={() => setSelectedId(null)}
        onRequireAuth={isLoaded && !user ? () => setAuthOpen(true) : undefined}
      />
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}

function SuggestionTile({
  entry,
  ready,
  onOpen,
  connectionStatus,
  onDecline,
  declining,
  declineError,
}: {
  entry: StoreIntegration;
  ready: boolean;
  onOpen: () => void;
  connectionStatus?: "waiting" | "connected" | "declined";
  onDecline?: () => Promise<void>;
  declining: boolean;
  declineError: string | null;
}) {
  const installed = entry.installedConnected;
  const needsConnection = entry.installedServerId !== null && !installed;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 flex-col gap-3 rounded-2xl bg-well px-3.5 py-3 shadow-[inset_0_0_0_1px_var(--well-outline),inset_0_1px_0_0_var(--well-highlight)] transition-colors duration-150 hover:bg-accent sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={!ready}
          onClick={onOpen}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left disabled:cursor-default"
        >
          <IntegrationLogo
            name={entry.name}
            logoUrl={entry.logoUrl}
            iconSvg={entry.iconSvg}
            size={44}
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-[14px]/5 font-semibold tracking-tight">
                {entry.name}
              </span>
              {entry.verified && <VerifiedBadge size={13} />}
            </span>
            {ready ? (
              <span className="line-clamp-2 text-[13px]/5 text-muted-foreground">
                {entry.description ?? "A new set of tools for the desk."}
              </span>
            ) : (
              <span
                aria-label="Loading integration details"
                className="mt-1 h-2.5 w-28 animate-pulse rounded-full bg-foreground/10"
              />
            )}
          </span>
        </button>

        {connectionStatus === "waiting" ? (
          <span className="flex shrink-0 self-end items-center gap-1.5 sm:self-auto">
            {onDecline && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={declining}
                onClick={() => void onDecline()}
                className="rounded-full px-2.5"
              >
                Not now
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={!ready}
              onClick={onOpen}
              className="rounded-full px-3"
            >
              <IconClockPause size={13} stroke={2.25} />
              Connect
            </Button>
          </span>
        ) : connectionStatus ? null : installed ? (
          <span className="inline-flex shrink-0 self-end items-center gap-1 text-[13px]/5 font-medium text-emerald-600 sm:self-auto dark:text-emerald-400">
            <IconCircleCheckFilled size={14} />
            Installed
          </span>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={!ready}
            onClick={onOpen}
            className="self-end rounded-full px-3 sm:self-auto"
          >
            <IconDownload size={13} stroke={2.25} />
            {needsConnection ? "Connect" : "Install"}
          </Button>
        )}
      </div>
      {declineError && (
        <p role="alert" className="px-1 text-[12px]/4 text-destructive">
          {declineError}
        </p>
      )}
    </div>
  );
}

function ConnectionGateStatus({
  status,
  name,
}: {
  status: "waiting" | "connected" | "declined";
  name: string;
}) {
  const connected = status === "connected";
  const declined = status === "declined";
  return (
    <div
      role="status"
      className={`flex items-center gap-1.5 px-1 text-[13px]/5 font-medium ${
        connected
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-muted-foreground"
      }`}
    >
      {connected ? (
        <IconCircleCheckFilled size={14} />
      ) : declined ? (
        <IconX size={14} stroke={2.25} />
      ) : (
        <IconClockPause size={14} stroke={2.25} />
      )}
      {connected
        ? `You connected ${name}.`
        : declined
          ? `You declined the ${name} connection.`
          : `Waiting for you to connect ${name}`}
    </div>
  );
}

function placeholderEntries(
  items: IntegrationSuggestionItem[],
): StoreIntegration[] {
  return items.map((item) => ({
    id: item.integrationId as Id<"integrations">,
    name: item.name,
    category: null,
    verified: false,
    logoUrl: null,
    bannerUrl: null,
    authMode: "none",
    authFields: [],
    toolCount: 0,
    composioConnect: false,
    installedServerId: null,
    installedConnected: false,
  }));
}
