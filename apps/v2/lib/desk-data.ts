"use client";

import { useQuery } from "convex/react";
import { api } from "@whirl/backend/convex/_generated/api";
import { useLeadAgent } from "@/lib/lead-agents";

const EMPTY_DESK = {
  prospects: [],
  lists: [],
  approvals: [],
  tasks: [],
  campaigns: [],
  pipeline: [],
  bars: [],
};

export function useDeskData() {
  const leadAgent = useLeadAgent();
  const live = useQuery(api.leads.snapshot, { leadAgent });
  if (live === undefined) return EMPTY_DESK;
  return live;
}
