import { medianIdentity } from "@mediansh/agent-tools";

export const runtime = "nodejs";

export const { GET } = medianIdentity(async () => {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return {
      id: "demo-chimezie",
      name: "Chimezie Okafor",
      email: "chimezie@osoahia.com",
    };
  }
  return null;
});
