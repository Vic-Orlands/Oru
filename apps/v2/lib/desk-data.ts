"use client";

import { useQuery } from "convex/react";
import { api } from "@whirl/backend/convex/_generated/api";

import { isDemoMode } from "@/lib/auth/mode";
import {
  DEMO_APPROVALS,
  DEMO_BARS,
  DEMO_CAMPAIGNS,
  DEMO_LISTS,
  DEMO_PIPELINE,
  DEMO_PROSPECTS,
  DEMO_TASKS,
} from "@/lib/demo/data";

const FIXTURES = {
  prospects: DEMO_PROSPECTS,
  lists: DEMO_LISTS,
  approvals: DEMO_APPROVALS,
  tasks: DEMO_TASKS,
  campaigns: DEMO_CAMPAIGNS,
  pipeline: DEMO_PIPELINE,
  bars: DEMO_BARS,
};

export function useDeskData() {
  const demo = isDemoMode();
  const live = useQuery(api.leads.snapshot, demo ? "skip" : {});
  if (demo || live === undefined) return FIXTURES;
  if (live.prospects.length === 0 && live.campaigns.length === 0) return FIXTURES;
  return live;
}
