import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    include: [
      "convex/slots/**/*.test.ts",
      "convex/inference/leadScoring.test.ts",
    ],
  },
});
