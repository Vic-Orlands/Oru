import { IconBrandGithubFilled } from "@tabler/icons-react";

import { SITE_LINKS } from "@/lib/site";
import { ROUND_ICON_BUTTON } from "./theme-switcher";

/** The source on GitHub, as a round icon beside the theme switcher. */
export function MarketingGithubButton({
  className = "",
}: {
  className?: string;
}) {
  if (!SITE_LINKS.repo) return null;

  return (
    <a
      href={SITE_LINKS.repo}
      target="_blank"
      rel="noreferrer"
      aria-label="Ọru on GitHub"
      title="Ọru on GitHub"
      className={`${ROUND_ICON_BUTTON} ${className}`}
    >
      <IconBrandGithubFilled size={15} />
    </a>
  );
}
