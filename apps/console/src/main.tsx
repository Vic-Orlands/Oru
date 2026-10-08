import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";

import "~/app.css";
import { App } from "~/app";
import { authClient } from "~/lib/auth/client";
import { AnalyticsProvider } from "~/lib/analytics";

function Root() {
  const [convex] = useState(() => {
    const convexUrl = import.meta.env.VITE_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("Missing VITE_CONVEX_URL in your .env file");
    }
    return new ConvexReactClient(convexUrl);
  });

  return (
    <AnalyticsProvider>
      <ConvexBetterAuthProvider client={convex} authClient={authClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConvexBetterAuthProvider>
    </AnalyticsProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
