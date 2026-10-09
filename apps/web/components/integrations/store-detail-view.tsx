"use client";

import {
  IconArrowLeft,
  IconBulbFilled,
  IconCircleCheckFilled,
  IconCopy,
  IconKeyFilled,
  IconPlugConnected,
  IconTool,
} from "@tabler/icons-react";

import { IntegrationLogo } from "@/components/integration-logo";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toasts";
import { VerifiedBadge } from "./verified-badge";

type DetailKind = "integration" | "skill";

export type StoreDetail = {
  id: string;
  kind: DetailKind;
  name: string;
  description?: string;
  author?: string;
  category: string | null;
  verified: boolean;
  logoUrl: string | null;
  bannerUrl: string | null;
  iconSvg?: string;
  installed: boolean;
  pending?: boolean;
  toolCount?: number;
  connectionLabel?: string;
};

function InformationRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 py-2 text-[13px]/5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-foreground">{children}</dd>
    </div>
  );
}

function Capability({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 py-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm bg-accent text-foreground-soft">
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-[13px] font-medium">{title}</h3>
        <p className="mt-0.5 text-[12.5px]/5 text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

export function StoreDetailView({
  listing,
  shareUrl,
  onBack,
  onPrimaryAction,
}: {
  listing: StoreDetail;
  shareUrl: string;
  onBack: () => void;
  onPrimaryAction: () => void;
}) {
  const isSkill = listing.kind === "skill";
  const status = listing.installed
    ? "Installed"
    : listing.pending
      ? "Setup unfinished"
      : "Not installed";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Link copied.");
    } catch {
      showToast("Couldn’t copy the link. Try again.");
    }
  };

  return (
    <article className="mx-auto w-full max-w-4xl pb-16">
      <button
        type="button"
        onClick={onBack}
        className="group inline-flex h-8 items-center gap-1.5 rounded-sm px-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors duration-100 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <IconArrowLeft
          size={15}
          stroke={2}
          aria-hidden="true"
          className="transition-transform duration-100 group-hover:-translate-x-0.5"
        />
        {isSkill ? "Skills" : "Integrations"}
      </button>

      <header className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <IntegrationLogo
            name={listing.name}
            logoUrl={listing.logoUrl}
            iconSvg={listing.iconSvg}
            size={64}
          />
          <div className="min-w-0 pt-1">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-[24px]/7 font-semibold tracking-[-0.025em]">
                {listing.name}
              </h1>
              {listing.verified && <VerifiedBadge size={17} />}
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {isSkill
                ? "A focused playbook Ọru can use when the work calls for it."
                : "A connected tool Ọru can use on your behalf."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void copyLink()}
            aria-label={`Copy link to ${listing.name}`}
            className="flex size-9 items-center justify-center rounded-sm bg-accent text-muted-foreground transition-colors duration-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <IconCopy size={16} aria-hidden="true" />
          </button>
          <Button
            className="h-9 min-w-28"
            disabled={listing.installed}
            onClick={onPrimaryAction}
          >
            {listing.installed
              ? "Installed"
              : listing.pending
                ? "Finish setup"
                : isSkill
                  ? "Install skill"
                  : "Connect"}
          </Button>
        </div>
      </header>

      <div className="relative mt-8 h-32 overflow-hidden rounded-md bg-[radial-gradient(circle_at_18%_25%,color-mix(in_oklab,var(--primary)_36%,transparent),transparent_34%),linear-gradient(120deg,var(--accent),var(--surface))] sm:h-40">
        {listing.bannerUrl && (
          // Store images are developer-hosted and cannot be domain-allowlisted.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.bannerUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-background/10 via-transparent to-background/35" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-md bg-background/78 px-3 py-2 text-[12.5px] font-medium shadow-[0_12px_35px_-18px_rgb(0_0_0/0.65)] backdrop-blur-xl">
            <IntegrationLogo
              name={listing.name}
              logoUrl={listing.logoUrl}
              iconSvg={listing.iconSvg}
              size={22}
            />
            <span>
              {isSkill ? `Use ${listing.name}` : `Ask ${listing.name}`}
            </span>
            <span className="text-muted-foreground">in any chat</span>
          </div>
        </div>
      </div>

      <section className="mt-8 border-b border-border pb-8">
        <h2 className="text-[14px] font-semibold">Overview</h2>
        <p className="mt-3 max-w-3xl text-[13.5px]/6 text-foreground-soft">
          {listing.description ??
            (isSkill
              ? "This skill gives Ọru a reusable set of instructions for a specific kind of work."
              : "This integration lets Ọru work with the service directly from your chats.")}
        </p>
      </section>

      <section className="border-b border-border py-8">
        <h2 className="text-[14px] font-semibold">
          {isSkill ? "How it helps" : "Capabilities"}
        </h2>
        <div className="mt-2 grid gap-x-10 sm:grid-cols-2">
          {isSkill ? (
            <>
              <Capability
                icon={<IconBulbFilled size={16} aria-hidden="true" />}
                title="Task-specific guidance"
                body="Ọru loads this playbook when you mention it or when the task clearly needs it."
              />
              <Capability
                icon={<IconCircleCheckFilled size={16} aria-hidden="true" />}
                title="Ready in every chat"
                body="Once installed, the skill stays available without another setup step."
              />
            </>
          ) : (
            <>
              <Capability
                icon={<IconTool size={16} stroke={2} aria-hidden="true" />}
                title={
                  listing.toolCount
                    ? `${listing.toolCount} ${listing.toolCount === 1 ? "tool" : "tools"}`
                    : "Connected actions"
                }
                body="Ọru chooses the relevant action when your request needs this integration."
              />
              <Capability
                icon={<IconKeyFilled size={16} aria-hidden="true" />}
                title={listing.connectionLabel ?? "Managed connection"}
                body="You stay in control of access and can disable the connection from Settings."
              />
            </>
          )}
        </div>
      </section>

      <section className="py-8">
        <h2 className="border-b border-border pb-3 text-[14px] font-semibold">
          Information
        </h2>
        <dl className="max-w-xl">
          <InformationRow label="Developer">
            {listing.author ?? "Ọru directory"}
          </InformationRow>
          <InformationRow label="Category">
            {listing.category ?? (isSkill ? "Skill" : "Integration")}
          </InformationRow>
          <InformationRow label="Type">
            <span className="inline-flex items-center gap-1.5">
              {isSkill ? (
                <IconBulbFilled size={14} aria-hidden="true" />
              ) : (
                <IconPlugConnected size={14} stroke={2} aria-hidden="true" />
              )}
              {isSkill ? "Instruction skill" : "Connected integration"}
            </span>
          </InformationRow>
          <InformationRow label="Status">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`size-1.5 rounded-full ${
                  listing.installed
                    ? "bg-emerald-500"
                    : listing.pending
                      ? "bg-amber-500"
                      : "bg-muted-foreground/45"
                }`}
              />
              {status}
            </span>
          </InformationRow>
        </dl>
      </section>
    </article>
  );
}
