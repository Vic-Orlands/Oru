const URL_CANDIDATE = /https?:\/\/[^\s"'<>\\]+/giu;

function trimUrlPunctuation(value: string) {
  return value.replace(/[),.;!?\]}]+$/u, "");
}

/**
 * A comparison key for a public source URL. Search providers disagree about
 * harmless presentation details (www, trailing slashes, tracking parameters),
 * but the filing boundary must still reject a URL the source never returned.
 */
export function canonicalSourceUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    url.hash = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./u, "");
    url.protocol = "https:";
    url.pathname = url.pathname.replace(/\/+$/u, "") || "/";

    const kept = [...url.searchParams.entries()]
      .filter(
        ([key]) =>
          !/^utm_/iu.test(key) &&
          !["fbclid", "gclid", "mc_cid", "mc_eid"].includes(
            key.toLowerCase(),
          ),
      )
      .sort(([a], [b]) => a.localeCompare(b));
    url.search = "";
    for (const [key, valuePart] of kept) url.searchParams.append(key, valuePart);
    return url.toString();
  } catch {
    return null;
  }
}

/** Extract the exact public links carried by a provider receipt. */
export function sourceUrlsFromReceipt(responseText: string): string[] {
  const urls = responseText.match(URL_CANDIDATE) ?? [];
  return [...new Set(urls.map(trimUrlPunctuation))];
}

export function verifyReceiptSourceUrl(
  value: string,
  responseText: string,
): { normalized: string; candidates: string[] } {
  const comparisonKey = canonicalSourceUrl(value);
  if (!comparisonKey) {
    throw new Error("Every opportunity needs a valid public source URL.");
  }

  const candidates = sourceUrlsFromReceipt(responseText);
  const candidateKeys = new Set(
    candidates.flatMap((candidate) => {
      const key = canonicalSourceUrl(candidate);
      return key ? [key] : [];
    }),
  );
  if (!candidateKeys.has(comparisonKey)) {
    const available = candidates.slice(0, 8);
    throw new Error(
      available.length > 0
        ? `That source URL was not returned by the live search. Use one of these exact source URLs instead: ${available.join(", ")}`
        : "That source URL was not returned by the live search. Search again and use an exact URL from the result.",
    );
  }

  return { normalized: new URL(value).toString(), candidates };
}
