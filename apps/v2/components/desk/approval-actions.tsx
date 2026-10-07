"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { IconCircleCheckFilled, IconPlayerPauseFilled } from "@tabler/icons-react";
import { api } from "@whirl/backend/convex/_generated/api";
import type { Id } from "@whirl/backend/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toasts";

export function ApprovalActions({
  approvalId,
  recipient,
}: {
  approvalId: Id<"approvals">;
  recipient: string;
}) {
  const decide = useMutation(api.leads.decideApproval);
  const [pending, setPending] = useState<"approved" | "held" | null>(null);

  const submit = async (decision: "approved" | "held") => {
    if (pending) return;
    setPending(decision);
    try {
      await decide({ approvalId, decision });
      showToast(
        decision === "approved"
          ? `Approved the draft for ${recipient}.`
          : `Held the draft for ${recipient}.`,
      );
    } catch (cause) {
      showToast(
        cause instanceof Error
          ? cause.message
          : "That decision could not be saved. Try again.",
      );
      setPending(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        disabled={pending !== null}
        onClick={() => void submit("approved")}
        className="rounded-lg"
      >
        <IconCircleCheckFilled size={13} />
        {pending === "approved" ? "Approving…" : "Approve"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending !== null}
        onClick={() => void submit("held")}
        className="rounded-lg"
      >
        <IconPlayerPauseFilled size={13} />
        {pending === "held" ? "Holding…" : "Hold"}
      </Button>
    </div>
  );
}
