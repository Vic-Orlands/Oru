import type { Page } from "playwright";

export type InspectionFocus =
  | "overview"
  | "fonts"
  | "links"
  | "metadata"
  | "accessibility";

export async function inspectRenderedPage(page: Page, focus: InspectionFocus) {
  return await page.evaluate((requestedFocus) => {
    const clean = (value: string | null | undefined) =>
      (value ?? "").replace(/\s+/g, " ").trim();
    const visible = (element: Element) => {
      const node = element as HTMLElement;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
    };
    const metadata = Object.fromEntries(
      Array.from(document.querySelectorAll("meta[name], meta[property]"))
        .slice(0, 60)
        .map((meta) => [
          meta.getAttribute("name") || meta.getAttribute("property") || "unknown",
          meta.getAttribute("content") || "",
        ]),
    );
    const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
      .filter(visible)
      .slice(0, 40)
      .map((element) => ({ level: element.tagName.toLowerCase(), text: clean(element.textContent) }))
      .filter((heading) => heading.text);
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
      .filter(visible)
      .slice(0, 80)
      .map((link) => ({ text: clean(link.textContent).slice(0, 180), url: link.href }))
      .filter((link) => link.text && link.url.startsWith("http"));

    const fontUse = new Map<string, { count: number; examples: string[] }>();
    const fontCandidates = Array.from(
      document.querySelectorAll("body, h1, h2, h3, h4, p, span, a, button, input, label, li, blockquote, code"),
    ).slice(0, 350);
    for (const element of fontCandidates) {
      if (!visible(element)) continue;
      const family = clean(getComputedStyle(element).fontFamily);
      if (!family) continue;
      const entry = fontUse.get(family) ?? { count: 0, examples: [] };
      entry.count += 1;
      const example = clean(element.textContent).slice(0, 80);
      if (example && entry.examples.length < 3 && !entry.examples.includes(example)) entry.examples.push(example);
      fontUse.set(family, entry);
    }
    const computedFonts = [...fontUse.entries()]
      .map(([family, details]) => ({ family, ...details }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    const loadedFonts = Array.from(document.fonts)
      .map((face) => ({ family: clean(face.family).replace(/^['"]|['"]$/g, ""), style: face.style, weight: face.weight, status: face.status }))
      .filter((face, index, all) => all.findIndex((candidate) => JSON.stringify(candidate) === JSON.stringify(face)) === index)
      .slice(0, 40);

    const accessibility = Array.from(
      document.querySelectorAll("button, a[href], input, textarea, select, [role]"),
    )
      .filter(visible)
      .slice(0, 100)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        role: element.getAttribute("role"),
        name: clean(
          element.getAttribute("aria-label") ||
            element.getAttribute("title") ||
            element.textContent,
        ).slice(0, 160),
      }));

    return {
      url: location.href,
      title: document.title,
      language: document.documentElement.lang || null,
      description: metadata.description || metadata["og:description"] || null,
      focus: requestedFocus,
      ...(requestedFocus === "overview" || requestedFocus === "metadata"
        ? { metadata, headings }
        : {}),
      ...(requestedFocus === "overview" || requestedFocus === "fonts"
        ? { computedFonts, loadedFonts }
        : {}),
      ...(requestedFocus === "overview" || requestedFocus === "links"
        ? { links }
        : {}),
      ...(requestedFocus === "accessibility" ? { accessibility } : {}),
      text: clean(document.body?.innerText).slice(
        0,
        requestedFocus === "overview" ? 10_000 : 1_500,
      ),
    };
  }, focus);
}
