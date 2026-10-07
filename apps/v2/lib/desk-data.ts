"use client";

import { useQuery } from "convex/react";
import { api } from "@whirl/backend/convex/_generated/api";

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
  const live = useQuery(api.leads.snapshot, {});
  if (live === undefined) return EMPTY_DESK;
  return live;
}
