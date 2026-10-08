import { v } from "convex/values";

export const opportunitySourceStatusValidator = v.union(
  v.literal("live"),
  v.literal("stale"),
  v.literal("unknown"),
);

export const opportunityFeedbackValidator = v.union(
  v.literal("relevant"),
  v.literal("not_relevant"),
  v.literal("already_known"),
  v.literal("wrong"),
  v.literal("stale"),
  v.literal("contacted"),
  v.literal("applied"),
  v.literal("passed"),
  v.literal("successful"),
);

export const opportunityDetailsValidator = v.object({
  salary: v.optional(v.string()),
  locationMode: v.optional(v.string()),
  employmentType: v.optional(v.string()),
  deadline: v.optional(v.string()),
  skills: v.optional(v.array(v.string())),
  personName: v.optional(v.string()),
  email: v.optional(v.string()),
  checkSize: v.optional(v.string()),
  thesis: v.optional(v.string()),
  stageFocus: v.optional(v.string()),
  portfolioConflict: v.optional(v.string()),
  partnershipType: v.optional(v.string()),
  mutualValue: v.optional(v.string()),
  buyerRole: v.optional(v.string()),
  buyingSignal: v.optional(v.string()),
});

export const opportunityScoreItemValidator = v.object({
  criterion: v.string(),
  points: v.number(),
  maxPoints: v.number(),
  reason: v.string(),
});
