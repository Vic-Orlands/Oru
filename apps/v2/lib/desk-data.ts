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
  const demo = isDemoMode();
  const live = useQuery(api.leads.snapshot, demo ? "skip" : {});
  if (demo) return FIXTURES;
  if (live === undefined) return EMPTY_DESK;
  return live;
}
