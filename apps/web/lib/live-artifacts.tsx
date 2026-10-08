"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@whirl/backend/convex/_generated/api";
import type { Id } from "@whirl/backend/convex/_generated/dataModel";

/* Live bodies for the artifacts a message phase points at. The cards and
   the side panel read the same reactive rows, so a streaming document
   fills in everywhere at once. Public share pages provide their authorized
   artifact snapshot directly, so those read-only views do not query private
   Convex rows by id. */

export type LiveDocument = {
  title: string;
  content: string;
  format?: "markdown" | "code";
  fileName?: string;
  language?: string;
  status?: "streaming" | "complete";
  /** Public share token; powers {site}/doc/{shortId}. Absent only on
   * legacy rows until the panel mints one (ensureDocumentShareId). */
  shortId?: string;
};

/** A binding the artifact declared, as the card's "reads from" chrome needs it. */
export type LiveArtifactBinding = {
  id: string;
  integration: string;
  tool: string;
  label?: string;
};

export type LiveHtmlArtifact = {
  kind: "inline" | "full";
  /** Absent on every artifact written before react artifacts existed. */
  runtime?: "html" | "react";
  title: string;
  content: string;
  status: "streaming" | "pending" | "generating" | "complete" | "failed";
  error?: string;
  /** Read-only integration data this artifact pulls in. React artifacts only;
   *  any artifact carrying one is not publicly shareable. */
  bindings?: LiveArtifactBinding[];
  /** Served without its body because it reads live data and this viewer isn't
   *  its owner (a shared transcript). The card renders an explanation. */
  dataLocked?: boolean;
  /** Public share token (5 chars); powers {site}/visual/{shortId}. */
  shortId?: string;
};

/** Whether an artifact reads live integration data — which is also what makes
 *  it private, so the share and export affordances have to agree with it. */
export function readsLiveData(
  artifact: LiveHtmlArtifact | null | undefined,
): boolean {
  return (artifact?.bindings?.length ?? 0) > 0;
}

export type ArtifactSnapshot = {
  documents: Record<string, LiveDocument>;
  html: Record<string, LiveHtmlArtifact>;
};

const ArtifactSnapshotContext = createContext<ArtifactSnapshot | null>(null);

/** Authorized artifact bodies embedded in a public shared-thread payload. */
export function ArtifactSnapshotProvider({
  value,
  children,
}: {
  value: ArtifactSnapshot;
  children: ReactNode;
}) {
  return (
    <ArtifactSnapshotContext.Provider value={value}>
      {children}
    </ArtifactSnapshotContext.Provider>
  );
}

/** Shared artifact snapshots are read-only: no save-back or add-to-chat. */
export function useHasArtifactSnapshot(): boolean {
  return useContext(ArtifactSnapshotContext) !== null;
}

/** The live `documents` row: `undefined` while loading, `null` if missing. */
export function useLiveDocument(
  documentId: string | undefined,
): LiveDocument | null | undefined {
  const snapshot = useContext(ArtifactSnapshotContext);
  const queried = useQuery(
    api.documents.getDocument,
    !snapshot && documentId
      ? { documentId: documentId as Id<"documents"> }
      : "skip",
  );
  if (snapshot) {
    if (!documentId) return undefined;
    return snapshot.documents[documentId] ?? null;
  }
  return queried;
}

/** The live `htmlArtifacts` row: `undefined` while loading, `null` if missing. */
export function useLiveHtmlArtifact(
  htmlId: string | undefined,
): LiveHtmlArtifact | null | undefined {
  const snapshot = useContext(ArtifactSnapshotContext);
  const queried = useQuery(
    api.html.getHtmlArtifact,
    !snapshot && htmlId ? { htmlId: htmlId as Id<"htmlArtifacts"> } : "skip",
  );
  if (snapshot) {
    if (!htmlId) return undefined;
    return snapshot.html[htmlId] ?? null;
  }
  return queried;
}
