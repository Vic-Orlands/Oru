"use client";

import { useState } from "react";
import {
  IconLayoutSidebarLeftCollapseFilled,
  IconLayoutSidebarLeftExpandFilled,
  IconChartBar,
  IconCheckbox,
  IconFilter,
  IconMail,
  IconPlus,
  IconSend,
  IconPuzzleFilled,
  IconSearch,
  IconUsers,
} from "@tabler/icons-react";

import { useIncognitoState } from "@/lib/incognito";
import { useExpiredIntegrations } from "@/lib/integrations-data";
import {
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  useSidebar,
} from "@/lib/sidebar";
import { useView } from "@/lib/view";
import { DialogTrigger } from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageSlide } from "./page-slide";
import { SearchModal } from "./search-modal";
import { SettingsSidebar } from "./settings/settings-sidebar";
import { SidebarRow } from "./sidebar-row";
import { SyncIndicator } from "./sync-indicator";
import { SquishButton } from "./squish-button";
import { ThreadList } from "./thread-list";
import { UserButton } from "./user-button";
import { OruLogo } from "./oru-logo";
import { AgentSwitcher } from "./agent-switcher";
import { SidebarFooter } from "./sidebar-footer";

/* Width rides `--sidebar-width` (painted pre-hydration by the layout script,
   driven live by useSidebar), so drags track 1:1 and the collapse toggle
   glides on this curve — the same one the main app's shell uses.
 *
 * `translate` and not `transform`: Tailwind v4 compiles the translate
 * utilities to the standalone translate property, so an arbitrary list
 * naming transform eases none of them. */
const GLIDE =
  "transition-[translate,width,padding,opacity,visibility] duration-[240ms] ease-[cubic-bezier(0.32,0.72,0,1)]";

/* Owns the palette's open state so toggling it re-renders this row alone —
   not the whole sidebar, whose thread list is a heavy commit to drop right
   as the entrance animation starts. The row is a real DialogTrigger, so
   Base UI excludes it from outside-press dismissal and pressing it while
   open toggles closed instead of racing a close-then-reopen. */
function SearchRow() {
  const [open, setOpen] = useState(false);
  /* ⌘K stays dead while incognito — history is exactly what this mode
     isn't, and a palette hop would torch the ephemeral chat. */
  const { enabled: incognito } = useIncognitoState();
  return (
    <SearchModal
      open={open && !incognito}
      onOpenChange={(next) => setOpen(next && !incognito)}
      trigger={
        <Tooltip>
          <TooltipTrigger
            render={
              <DialogTrigger
                render={
                  <SidebarRow
                    icon={IconSearch}
                    label="Search"
                    tooltip={false}
                    className="before:-top-px before:-bottom-px"
                  />
                }
              />
            }
          />
          <TooltipContent
            side="right"
            sideOffset={10}
            className="hidden sidebar-collapsed:block"
          >
            Search
          </TooltipContent>
        </Tooltip>
      }
    />
  );
}

/* The desktop rail, and only that. Phones get a tab bar and a History page
   instead (components/mobile/), because a 20rem drawer is this rail in a
   costume: it hides where you are and it costs a reach to a far corner to
   find out. Everything the drawer used to carry — the thread list, the
   palette, the account row — is the same component over there. */
export function Sidebar() {
  const {
    collapsed,
    width,
    resizing,
    toggleCollapsed,
    onResizePointerDown,
    onResizeDoubleClick,
  } = useSidebar();
  const {
    settingsOpen,
    integrationsOpen,
    deskPage,
    openHome,
    openIntegrations,
    openDesk,
  } = useView();
  /* Incognito tucks the whole rail away: width glides to a slim gutter
     (so the main pane keeps its 8px inset) while the contents fade, and
     `invisible` lands at the curve's end to drop it from the tab order.
     Nothing here unmounts — leaving glides it right back. */
  const { enabled: incognito } = useIncognitoState();
  const expiredIntegrations = useExpiredIntegrations();

  return (
    /* An even 8px beat between blocks; New and the nav rows tighten onto
       one shared row pitch (the -mt on the nav below). `relative` is the
       resize handle's containing block — the rail used to be `fixed` for
       the drawer, which positioned the handle for free; as a plain flex
       item it would otherwise resolve against the viewport. */
    <aside
      id="app-sidebar"
      className={`group/sidebar relative hidden shrink-0 flex-col gap-0 pt-3 pb-2 md:flex ${
        /* Incognito tucks the rail away: width glides to a slim gutter (so
           the pane keeps its 8px inset) while the contents fade, and
           `invisible` lands at the curve's end to drop it from the tab
           order. Nothing unmounts — leaving glides it right back. */
        incognito
          ? "invisible w-2 overflow-hidden px-0 opacity-0"
          : "visible w-[var(--sidebar-width,16rem)] px-3 opacity-100"
      } ${resizing ? "" : GLIDE}`}
    >
      {/* The brand is home while expanded. On the collapsed rail, its mark
          crossfades into the expand control so two overlapping buttons never
          compete for the same pointer or keyboard target. */}
      <div className="sidebar-glide relative flex h-8 items-center px-1 transition-[padding] sidebar-collapsed:pl-2">
        <button
          type="button"
          onClick={openHome}
          tabIndex={collapsed ? -1 : 0}
          aria-hidden={collapsed}
          aria-label="Go to Ọru home"
          className="flex h-8 min-w-0 cursor-pointer items-center gap-2 rounded-md px-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sidebar-collapsed:pointer-events-none sidebar-collapsed:px-0"
        >
          <OruLogo
            size={20}
            className="transition-opacity duration-150 sidebar-collapsed:group-hover/sidebar:opacity-0"
          />
          <span className="truncate text-[14px]/5 font-semibold tracking-[-0.015em] transition-[opacity,visibility] duration-150 sidebar-collapsed:invisible sidebar-collapsed:opacity-0">
            Ọru
          </span>
        </button>
        <SyncIndicator />
        {/* Only surfaces while the pointer is over the sidebar; when
            collapsed it overlays the header and crossfades with the logo. */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="ml-auto -mr-1.5 hidden size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-foreground-soft opacity-0 transition-[opacity,background-color] duration-150 group-hover/sidebar:opacity-100 hover:bg-accent focus-visible:opacity-100 sidebar-collapsed:absolute sidebar-collapsed:inset-0 sidebar-collapsed:m-auto md:flex"
        >
          {collapsed ? (
            <IconLayoutSidebarLeftExpandFilled size={18} />
          ) : (
            <IconLayoutSidebarLeftCollapseFilled size={18} />
          )}
        </button>
      </div>
      <div className="mt-1">
        <UserButton />
      </div>
      {/* The middle is a two-faced strip (chats vs settings) riding the
          page slide; the account above and utility footer below stay put as
          chrome, so opening settings only swipes the rows between them. */}
      <PageSlide
        page={settingsOpen ? 2 : 1}
        className="min-h-0 flex-1"
        pageClassName="flex flex-col gap-0"
        one={
          <>
            <AgentSwitcher />
            {/* Hit areas (the before: layers here and on the rows) reach the
                sidebar edges and split the gaps between neighbors, so clicks
                in the dead space still land. The label clips in an inner
                span — overflow-hidden on the button itself would clip the
                hit area. */}
            {/* Stays left-anchored: px-3 already dead-centers the icon on the
                40px rail, so the icon never moves — the label just fades as
                the sliding edge clips it. */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <SquishButton
                    aria-label="New chat"
                    onClick={openHome}
                    className="relative h-8 w-full py-0 before:absolute before:-inset-x-3 before:-top-1 before:-bottom-px"
                  />
                }
              >
                <span className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap">
                  <IconPlus size={16} stroke={2.5} className="shrink-0" />
                  <span className="transition-[opacity,visibility] duration-150 sidebar-collapsed:invisible sidebar-collapsed:opacity-0">
                    New
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={10}
                className="hidden sidebar-collapsed:block"
              >
                New chat
              </TooltipContent>
            </Tooltip>
            {/* -mt pulls the nav onto the same pitch as the New pill: 2px
                seams all the way down, so a hovered row's pill stacks under
                New exactly like the rows stack under each other. */}
            <nav className="flex flex-col gap-0">
              <SearchRow />
              <SidebarRow
                icon={IconPuzzleFilled}
                label="Integrations"
                active={integrationsOpen}
                alert={expiredIntegrations.length > 0}
                onClick={openIntegrations}
                className="before:-top-px before:-bottom-px"
              />
            </nav>
            <nav className="flex flex-col gap-0">
              <SidebarRow
                icon={IconUsers}
                label="Prospects"
                active={deskPage === "prospects"}
                onClick={() => openDesk("prospects")}
              />
              <SidebarRow
                icon={IconMail}
                label="Approvals"
                active={deskPage === "approvals"}
                onClick={() => openDesk("approvals")}
              />
              <SidebarRow
                icon={IconSend}
                label="Campaigns"
                active={deskPage === "campaigns"}
                onClick={() => openDesk("campaigns")}
              />
              <SidebarRow
                icon={IconFilter}
                label="Pipeline"
                active={deskPage === "pipeline"}
                onClick={() => openDesk("pipeline")}
              />
              <SidebarRow
                icon={IconCheckbox}
                label="Tasks"
                active={deskPage === "tasks"}
                onClick={() => openDesk("tasks")}
              />
              <SidebarRow
                icon={IconChartBar}
                label="Performance"
                active={deskPage === "performance"}
                onClick={() => openDesk("performance")}
                className="before:-top-px before:-bottom-1"
              />
            </nav>
            <div className="h-2" aria-hidden />
            <ThreadList />
          </>
        }
        two={<SettingsSidebar />}
      />
      <SidebarFooter />
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        aria-valuenow={width}
        aria-valuemin={SIDEBAR_MIN_WIDTH}
        aria-valuemax={SIDEBAR_MAX_WIDTH}
        onPointerDown={onResizePointerDown}
        onDoubleClick={onResizeDoubleClick}
        /* z-10: the thread list and user button live in SkeletonReveal
           layers (z-2), which would otherwise sit over the handle and eat
           the pointer along their stretch of the edge. */
        className={`absolute inset-y-0 right-0 z-10 block w-1.5 cursor-col-resize touch-none transition-colors duration-150 sidebar-collapsed:hidden ${
          resizing ? "bg-foreground/15" : "hover:bg-foreground/10"
        }`}
      />
    </aside>
  );
}
