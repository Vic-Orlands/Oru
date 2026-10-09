import { v } from "convex/values";

export const jobApplicationStatusValidator = v.union(
  v.literal("preparing"),
  v.literal("ready_for_review"),
  v.literal("approved"),
  v.literal("submitted"),
  v.literal("confirmed"),
  v.literal("recruiter_screen"),
  v.literal("interview"),
  v.literal("offer"),
  v.literal("rejected"),
  v.literal("withdrawn"),
  v.literal("closed"),
);

export const applicationPackStatusValidator = v.union(
  v.literal("draft"),
  v.literal("ready_for_review"),
  v.literal("approved"),
  v.literal("used"),
  v.literal("superseded"),
);

export const applicationRunStatusValidator = v.union(
  v.literal("launching"),
  v.literal("scanning_form"),
  v.literal("awaiting_review"),
  v.literal("filling"),
  v.literal("waiting_for_user"),
  v.literal("ready_to_submit"),
  v.literal("submitting"),
  v.literal("succeeded"),
  v.literal("failed"),
  v.literal("cancelled"),
);

export const applicationFieldTypeValidator = v.union(
  v.literal("text"),
  v.literal("email"),
  v.literal("tel"),
  v.literal("url"),
  v.literal("number"),
  v.literal("date"),
  v.literal("textarea"),
  v.literal("select"),
  v.literal("checkbox"),
  v.literal("radio"),
  v.literal("file"),
  v.literal("unknown"),
);

export const applicationFieldValidator = v.object({
  key: v.string(),
  selector: v.string(),
  label: v.string(),
  type: applicationFieldTypeValidator,
  required: v.boolean(),
  options: v.array(v.string()),
  sensitive: v.boolean(),
  value: v.optional(v.string()),
  source: v.optional(
    v.union(
      v.literal("profile"),
      v.literal("user"),
      v.literal("generated"),
    ),
  ),
});
