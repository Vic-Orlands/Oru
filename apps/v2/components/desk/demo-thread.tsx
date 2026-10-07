"use client";

import { useEffect } from "react";

import { demoMessages } from "@/lib/demo/data";
import { openLeadPanel } from "@/lib/artifact-panel";
import { ThreadView } from "@/components/thread/thread-view";

/** A canned mid-stream turn so the desk can be read without model keys. */
export function DemoThread({ threadId }: { threadId: string }) {
  useEffect(() => {
    const id = requestAnimationFrame(() => openLeadPanel("prospects"));
    return () => cancelAnimationFrame(id);
  }, [threadId]);

  return (
    <ThreadView
      messages={demoMessages(threadId)}
      contentClassName="pt-[calc(3.5rem+env(safe-area-inset-top))]"
    />
  );
}
