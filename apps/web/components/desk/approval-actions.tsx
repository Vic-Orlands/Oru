"use client";

import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { IconCircleCheckFilled, IconPlayerPauseFilled } from "@tabler/icons-react";
import { api } from "@oru/backend/convex/_generated/api";
import type { Id } from "@oru/backend/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toasts";

export function ApprovalActions({
  approvalId,
  recipient,
}: {
  approvalId: Id<"approvals">;
  recipient: string;
}) {
  const approveAndSend = useAction(api.leadDispatch.approveAndSend);
  const hold = useMutation(api.leads.holdApproval);
  const [pending, setPending] = useState<"approved" | "held" | null>(null);

  const submit = async (decision: "approved" | "held") => {
    if (pending) return;
    setPending(decision);
    try {
      if (decision === "approved") {
        const result = await approveAndSend({ approvalId });
        showToast(`Sent to ${recipient} through ${result.provider}.`);
      } else {
        await hold({ approvalId });
        showToast(`Held the draft for ${recipient}.`);
      }
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
        {pending === "approved" ? "Sending…" : "Approve and send"}
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
