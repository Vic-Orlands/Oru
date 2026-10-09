import type { KernelContext } from "@onkernel/sdk";

import {
  detectAts,
  fillApprovedFields,
  openLikelyApplicationForm,
  submitApplication,
} from "./application-page";
import {
  disconnect,
  kernel,
  openApplicationBrowser,
  reconnectApplicationBrowser,
} from "./kernel-browser";

const app = kernel.app("oso-ahia-job-agent");

function objectPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("The application runner received an invalid payload.");
  }
  return payload as Record<string, unknown>;
}

function textValue(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${key} is required.`);
  }
  return value.trim();
}

function applicationFields(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (field): field is Parameters<typeof fillApprovedFields>[1][number] => {
      if (!field || typeof field !== "object" || Array.isArray(field)) return false;
      const candidate = field as Record<string, unknown>;
      return (
        typeof candidate.selector === "string" &&
        typeof candidate.label === "string" &&
        typeof candidate.type === "string"
      );
    },
  );
}

app.action("open-application", async (_ctx: KernelContext, rawPayload) => {
  const payload = objectPayload(rawPayload);
  const applicationId = textValue(payload, "applicationId");
  const sessionName = `oso-job-${applicationId.slice(-24)}`.replace(/[^a-zA-Z0-9._-]/g, "-");
  const { browser, page, session } = await openApplicationBrowser(
    payload.url,
    sessionName,
  );
  let applicationPage = page;
  try {
    const opened = await openLikelyApplicationForm(page);
    applicationPage = opened.page;
    const fields = opened.fields;
    if (!session.browser_live_view_url) {
      throw new Error("Kernel did not provide a live browser view.");
    }
    return {
      sessionId: session.session_id,
      liveViewUrl: session.browser_live_view_url,
      ats: detectAts(applicationPage.url()),
      currentUrl: applicationPage.url(),
      fields,
    };
  } finally {
    await disconnect(browser, applicationPage);
  }
});

app.action("fill-application", async (_ctx: KernelContext, rawPayload) => {
  const payload = objectPayload(rawPayload);
  const sessionId = textValue(payload, "sessionId");
  const fields = applicationFields(payload.fields);
  const { browser, page } = await reconnectApplicationBrowser(sessionId);
  try {
    const result = await fillApprovedFields(
      page,
      fields,
    );
    return { currentUrl: page.url(), ...result };
  } finally {
    await disconnect(browser, page);
  }
});

app.action("submit-application", async (_ctx: KernelContext, rawPayload) => {
  const payload = objectPayload(rawPayload);
  const sessionId = textValue(payload, "sessionId");
  const { browser, page } = await reconnectApplicationBrowser(sessionId);
  try {
    const result = await submitApplication(page);
    await kernel.browsers.deleteByID(sessionId).catch(() => undefined);
    return result;
  } finally {
    await disconnect(browser, page);
  }
});

app.action("close-application", async (_ctx: KernelContext, rawPayload) => {
  const payload = objectPayload(rawPayload);
  const sessionId = textValue(payload, "sessionId");
  await kernel.browsers.deleteByID(sessionId);
  return { closed: true };
});
