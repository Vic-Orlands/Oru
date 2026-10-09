import type { Page } from "playwright";

export type ApplicationField = {
  key: string;
  selector: string;
  label: string;
  type:
    | "text"
    | "email"
    | "tel"
    | "url"
    | "number"
    | "date"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "file"
    | "unknown";
  required: boolean;
  options: string[];
  sensitive: boolean;
};

export function detectAts(url: string) {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes("greenhouse")) return "Greenhouse";
  if (host.includes("lever.co")) return "Lever";
  if (host.includes("ashbyhq")) return "Ashby";
  if (host.includes("myworkdayjobs") || host.includes("workday")) return "Workday";
  if (host.includes("smartrecruiters")) return "SmartRecruiters";
  if (host.includes("workable")) return "Workable";
  if (host.includes("icims")) return "iCIMS";
  return "Employer application";
}

export async function scanApplicationFields(page: Page) {
  return await page.locator("input, textarea, select").evaluateAll((elements) => {
    const sensitivePattern =
      /gender|sex|race|ethnic|disab|veteran|criminal|conviction|arbitration|consent|signature|salary|compensation|sponsor|authorization/i;
    const visible = (element: Element) => {
      const html = element as HTMLElement;
      const style = window.getComputedStyle(html);
      const box = html.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
    };
    const text = (value: string | null | undefined) =>
      (value ?? "").replace(/\s+/g, " ").trim();
    const labelFor = (element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
      if (element.id) {
        const explicit = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
        if (explicit?.textContent) return text(explicit.textContent);
      }
      const parent = element.closest("label");
      if (parent?.textContent) return text(parent.textContent);
      return text(
        element.getAttribute("aria-label") ||
          element.getAttribute("placeholder") ||
          element.getAttribute("name") ||
          element.id ||
          "Application field",
      );
    };
    return elements
      .filter((element) => visible(element))
      .filter((element) => !(element instanceof HTMLInputElement && element.type === "hidden"))
      .slice(0, 150)
      .map((raw, index) => {
        const element = raw as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        const label = labelFor(element);
        const fingerprint = `${element.name}-${element.id}-${label}-${element.type}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 64);
        const key = `oso-field-${index}-${fingerprint || "control"}`;
        element.setAttribute("data-oso-application-field", key);
        let type: ApplicationField["type"] = "unknown";
        if (element instanceof HTMLTextAreaElement) type = "textarea";
        else if (element instanceof HTMLSelectElement) type = "select";
        else if (["text", "email", "tel", "url", "number", "date", "checkbox", "radio", "file"].includes(element.type)) {
          type = element.type as ApplicationField["type"];
        }
        const options = element instanceof HTMLSelectElement
          ? Array.from(element.options)
              .filter((option) => !option.disabled && option.value !== "")
              .map((option) => text(option.textContent || option.value))
              .filter(Boolean)
          : [];
        return {
          key,
          selector: `[data-oso-application-field="${key}"]`,
          label: label || `Application field ${index + 1}`,
          type,
          required:
            element.required || element.getAttribute("aria-required") === "true",
          options,
          sensitive: sensitivePattern.test(
            `${label} ${element.name} ${element.id}`,
          ),
        } satisfies ApplicationField;
      });
  });
}

export async function openLikelyApplicationForm(page: Page) {
  const existingFields = await scanApplicationFields(page);
  if (existingFields.length > 0) return { page, fields: existingFields };

  const applyName = /^(apply|apply now|apply for this job|start application)$/i;
  const candidates = page
    .getByRole("link", { name: applyName })
    .or(page.getByRole("button", { name: applyName }));
  const visible = [];
  for (let index = 0; index < (await candidates.count()); index += 1) {
    const candidate = candidates.nth(index);
    if (await candidate.isVisible()) visible.push(candidate);
  }
  if (visible.length !== 1) return { page, fields: existingFields };

  const pagesBefore = new Set(page.context().pages());
  await visible[0].click();
  await page.waitForTimeout(1_000);
  const openedPage = page.context().pages().find((candidate) => !pagesBefore.has(candidate));
  const applicationPage = openedPage ?? page;
  await applicationPage
    .waitForLoadState("domcontentloaded", { timeout: 20_000 })
    .catch(() => undefined);
  return { page: applicationPage, fields: await scanApplicationFields(applicationPage) };
}

export async function fillApprovedFields(
  page: Page,
  fields: Array<{
    selector: string;
    label: string;
    type: ApplicationField["type"];
    value?: string;
  }>,
) {
  let filled = 0;
  const skipped: Array<{ label: string; reason: string }> = [];
  for (const field of fields) {
    const value = field.value?.trim();
    if (!value) continue;
    const control = page.locator(field.selector).first();
    try {
      if ((await control.count()) === 0) {
        skipped.push({ label: field.label, reason: "The field moved or is no longer visible." });
        continue;
      }
      if (field.type === "file") {
        skipped.push({ label: field.label, reason: "Upload this document in the live browser." });
        continue;
      }
      if (field.type === "checkbox") {
        if (/^(true|yes|1|on)$/i.test(value)) await control.check();
        else await control.uncheck();
      } else if (field.type === "radio") {
        if (/^(true|yes|1|on)$/i.test(value) || (await control.getAttribute("value")) === value) {
          await control.check();
        } else {
          skipped.push({ label: field.label, reason: "Choose this option in the live browser." });
          continue;
        }
      } else if (field.type === "select") {
        try {
          await control.selectOption({ label: value });
        } catch {
          await control.selectOption(value);
        }
      } else {
        await control.fill(value);
      }
      filled += 1;
    } catch (error) {
      skipped.push({
        label: field.label,
        reason: error instanceof Error ? error.message.slice(0, 180) : "Could not fill this field.",
      });
    }
  }
  return { filled, skipped };
}

export async function submitApplication(page: Page) {
  const candidates = page
    .getByRole("button", {
      name: /^(submit application|submit|send application|apply)$/i,
    });
  const count = await candidates.count();
  const visibleCandidates = [];
  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    if (await candidate.isVisible()) visibleCandidates.push(candidate);
  }
  if (visibleCandidates.length !== 1) {
    throw new Error("No unambiguous final submission button was found. Submit from the live browser instead.");
  }
  const button = visibleCandidates[0];
  if (await button.isDisabled()) {
    throw new Error("The employer's submit button is disabled. Review the highlighted fields in the live browser.");
  }
  const beforeUrl = page.url();
  await button.click();
  await page.waitForTimeout(2_000);
  await page.waitForLoadState("domcontentloaded", { timeout: 15_000 }).catch(() => undefined);
  const body = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ");
  const confirmation = body.match(
    /(?:thank you|application (?:has been )?(?:received|submitted)|we(?:'|’)ve received your application|successfully submitted)[^.!?]{0,220}[.!?]?/i,
  )?.[0];
  if (!confirmation && page.url() === beforeUrl) {
    throw new Error("The employer did not show a clear submission confirmation. Check the live browser before trying again.");
  }
  return {
    currentUrl: page.url(),
    confirmationText:
      confirmation?.trim() || "The employer redirected to a confirmation page after submission.",
  };
}
