import betterAuth from "@convex-dev/better-auth/convex.config";
import { defineApp } from "convex/server";
import { v } from "convex/values";
import persistentTextStreaming from "@convex-dev/persistent-text-streaming/convex.config.js";
import autumn from "@useautumn/convex/convex.config.js";

const app = defineApp({
  env: {
    KERNEL_API_KEY: v.optional(v.string()),
    KERNEL_JOB_APP_NAME: v.optional(v.string()),
    KERNEL_JOB_APP_VERSION: v.optional(v.string()),
  },
});
app.use(persistentTextStreaming);
app.use(autumn);
app.use(betterAuth);

export default app;
