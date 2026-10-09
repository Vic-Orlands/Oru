import Kernel from "@onkernel/sdk";
import { chromium, type Browser, type Page } from "playwright";

export const kernel = new Kernel();

export function safePublicUrl(raw: unknown) {
  if (typeof raw !== "string") throw new Error("A valid application URL is required.");
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new Error("Application URLs must use HTTPS.");
  if (url.username || url.password) throw new Error("Application URLs cannot contain credentials.");
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".local")
  ) {
    throw new Error("Private application URLs are not supported.");
  }
  return url.toString();
}

export async function openApplicationBrowser(rawUrl: unknown, name: string) {
  const url = safePublicUrl(rawUrl);
  const session = await kernel.browsers.create({
    name,
    headless: false,
    stealth: false,
    kiosk_mode: true,
    start_url: url,
    timeout_seconds: 7_200,
    tags: { product: "oru", workflow: "job-application" },
  });
  const browser = await chromium.connectOverCDP(session.cdp_ws_url);
  const context = browser.contexts()[0] || (await browser.newContext());
  const page = context.pages()[0] || (await context.newPage());
  await page.waitForLoadState("domcontentloaded", { timeout: 30_000 }).catch(() => undefined);
  return { browser, page, session };
}

export async function openInspectionBrowser(rawUrl: unknown) {
  const url = safePublicUrl(rawUrl);
  const session = await kernel.browsers.create({
    headless: false,
    stealth: false,
    kiosk_mode: true,
    start_url: url,
    timeout_seconds: 300,
    tags: { product: "oru", workflow: "page-inspection" },
  });
  const browser = await chromium.connectOverCDP(session.cdp_ws_url);
  const context = browser.contexts()[0] || (await browser.newContext());
  const page = context.pages()[0] || (await context.newPage());
  await page
    .waitForLoadState("networkidle", { timeout: 20_000 })
    .catch(() => page.waitForLoadState("domcontentloaded", { timeout: 10_000 }))
    .catch(() => undefined);
  return { browser, page, session };
}

export async function reconnectInspectionBrowser(sessionId: string) {
  return reconnectApplicationBrowser(sessionId);
}

export async function reconnectApplicationBrowser(sessionId: string) {
  const apiKey = process.env.KERNEL_API_KEY?.trim();
  if (!apiKey) throw new Error("KERNEL_API_KEY is missing from the Kernel app.");
  const response = await fetch(
    `https://api.onkernel.com/browsers/${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );
  if (!response.ok) {
    throw new Error(`The application browser is unavailable (${response.status}).`);
  }
  const session = (await response.json()) as {
    session_id: string;
    cdp_ws_url: string;
    browser_live_view_url?: string;
  };
  const browser = await chromium.connectOverCDP(session.cdp_ws_url);
  const context = browser.contexts()[0] || (await browser.newContext());
  const page = context.pages()[0] || (await context.newPage());
  return { browser, page, session };
}

export async function disconnect(browser: Browser, page?: Page) {
  await page?.waitForTimeout(100).catch(() => undefined);
  await browser.close().catch(() => undefined);
}
