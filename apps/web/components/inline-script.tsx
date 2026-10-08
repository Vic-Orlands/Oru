"use client";

/**
 * Runs inline boot code during server HTML parsing, but stays inert when the
 * same Client Component renders during navigation. This preserves pre-paint
 * localStorage hydration without React warning about executable scripts in a
 * client render.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
