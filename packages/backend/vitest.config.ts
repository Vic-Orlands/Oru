import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    include: [
      "convex/slots/**/*.test.ts",
      "convex/inference/leadScoring.test.ts",
      "convex/inference/providerProtocol.test.ts",
      "convex/inference/sourceEvidence.test.ts",
      "convex/inference/toolRouting.test.ts",
      "convex/leadAgents.test.ts",
      "convex/integrationProviderPolicy.test.ts",
      "convex/opportunityProfiles.test.ts",
      "convex/scheduledTasks.test.ts",
    ],
  },
});
