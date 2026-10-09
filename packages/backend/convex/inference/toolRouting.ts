export type InitialToolRoute =
  | {
      kind: "integration";
      integration: string;
      query: string;
      connectedName?: string;
    }
  | { kind: "browser" }
  | { kind: "fetch" }
  | { kind: "research" }
  | { kind: "answer" }
  | { kind: "none" };

type IntegrationRule = {
  name: string;
  aliases: readonly string[];
  pattern: RegExp;
};

const PRIVATE_DATA_OR_ACTION =
  /\b(my|our|account|check|show|list|read|send|create|update|delete|schedule|upload|post|publish|comment|reply|approve|merge|pending|connected)\b/i;

const INTEGRATIONS: readonly IntegrationRule[] = [
  {
    name: "GitHub",
    aliases: ["github"],
    pattern: /\bgithub\b/i,
  },
  {
    name: "Gmail",
    aliases: ["gmail", "google mail", "email", "inbox"],
    pattern: /\b(gmail|google mail|email|inbox)\b/i,
  },
  {
    name: "Google Calendar",
    aliases: ["google calendar", "gcal"],
    pattern: /\b(google calendar|gcal|calendar)\b/i,
  },
  {
    name: "Slack",
    aliases: ["slack"],
    pattern: /\bslack\b/i,
  },
  {
    name: "Notion",
    aliases: ["notion"],
    pattern: /\bnotion\b/i,
  },
  {
    name: "Linear",
    aliases: ["linear"],
    pattern: /\blinear\b/i,
  },
  {
    name: "Google Drive",
    aliases: ["google drive", "drive"],
    pattern: /\b(google drive|drive)\b/i,
  },
  {
    name: "Dropbox",
    aliases: ["dropbox"],
    pattern: /\bdropbox\b/i,
  },
  {
    name: "HubSpot",
    aliases: ["hubspot"],
    pattern: /\bhubspot\b/i,
  },
  {
    name: "Salesforce",
    aliases: ["salesforce"],
    pattern: /\bsalesforce\b/i,
  },
  {
    name: "Zoho CRM",
    aliases: ["zoho", "zoho crm"],
    pattern: /\bzoho(?: crm)?\b/i,
  },
  {
    name: "Typeform",
    aliases: ["typeform"],
    pattern: /\btypeform\b/i,
  },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function connectedMatch(
  rule: IntegrationRule,
  connectedIntegrations: readonly string[],
): string | undefined {
  const aliases = [rule.name, ...rule.aliases].map(normalize);
  return connectedIntegrations.find((candidate) => {
    const normalized = normalize(candidate);
    return aliases.some(
      (alias) => normalized === alias || normalized.includes(alias),
    );
  });
}

function requestedIntegration(text: string): IntegrationRule | undefined {
  const explicitConnection =
    /\b(connect|connection|integrate|integration|sign in|log in|authenticate)\b/i.test(
      text,
    );
  return INTEGRATIONS.find(
    (rule) =>
      rule.pattern.test(text) &&
      (explicitConnection || PRIVATE_DATA_OR_ACTION.test(text)),
  );
}

const HAS_URL = /https?:\/\/[^\s<>)\]}]+/i;
const PAGE_INSPECTION =
  /\b(fonts?|computed styles?|dom|accessibility|aria|metadata|meta tags?|links?|render(?:ed|ing)?|layout|design system|css|screenshot|inspect)\b/i;
const BROAD_RESEARCH =
  /\b(research|compare|comparison|landscape|market map|deep dive|find (?:me )?(?:\d+|some|all|the best)|list (?:\d+|some|all)|leads?|prospects?|open roles?|jobs?|candidates?|vendors?|alternatives?)\b/i;
const CURRENT_INFORMATION =
  /\b(latest|current|today|recent|news|what(?:'s| is) happening|who is|when is|price|score|weather|look up|search(?: the web)?|find out|verify|fact[- ]?check)\b/i;

/**
 * Pick the first capability a turn must use. The model still decides every
 * later step, but it cannot answer an account-data request from public web
 * results or narrate that an integration is missing without surfacing it.
 */
export function chooseInitialToolRoute({
  text,
  connectedIntegrations,
  exaEnabled,
  parallelEnabled,
  browserEnabled,
}: {
  text: string;
  connectedIntegrations: readonly string[];
  exaEnabled: boolean;
  parallelEnabled: boolean;
  browserEnabled: boolean;
}): InitialToolRoute {
  const integration = requestedIntegration(text);
  if (integration) {
    return {
      kind: "integration",
      integration: integration.name,
      query: integration.name,
      connectedName: connectedMatch(integration, connectedIntegrations),
    };
  }

  if (browserEnabled && PAGE_INSPECTION.test(text) && HAS_URL.test(text)) {
    return { kind: "browser" };
  }
  if (exaEnabled && HAS_URL.test(text)) return { kind: "fetch" };
  if (parallelEnabled && BROAD_RESEARCH.test(text)) return { kind: "research" };
  if (exaEnabled && CURRENT_INFORMATION.test(text)) return { kind: "answer" };
  return { kind: "none" };
}

export function toolRoutingInstruction(route: InitialToolRoute): string {
  switch (route.kind) {
    case "integration":
      return route.connectedName
        ? `This request needs the user's private ${route.integration} data or an action in ${route.integration}. Use the connected integration named "${route.connectedName}". Do not substitute public web search for account data.`
        : `This request needs the user's private ${route.integration} data or an action in ${route.integration}, but it is not connected. Search the integration store for "${route.query}", immediately choose the best exact listing, show its connection card with waitForConnection enabled, and stop. Do not substitute public web search or ask the user to choose a route.`;
    case "browser":
      return "This request depends on what a specific page renders. Inspect that exact page with the browser before answering; search snippets are not sufficient.";
    case "fetch":
      return "The user supplied a public URL. Read that exact page before answering.";
    case "research":
      return "This is broad, multi-source discovery. Research the web before answering and preserve source links.";
    case "answer":
      return "This request needs current public information. Search the web before answering and preserve source links.";
    case "none":
      return "Use tools only when they materially improve the answer.";
  }
}
