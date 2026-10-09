"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconX,
} from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LEAD_AGENTS,
  setLeadAgent,
  useLeadAgent,
} from "@/lib/lead-agents";
import { useView } from "@/lib/view";
import { AgentAvatar } from "./agent-avatar";

export function AgentDeckPicker() {
  const activeId = useLeadAgent();
  const activeIndex = Math.max(
    0,
    LEAD_AGENTS.findIndex((agent) => agent.id === activeId),
  );
  const active = LEAD_AGENTS[activeIndex];
  const { openHome } = useView();
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [spotlight, setSpotlight] = useState(activeIndex);

  const centerCard = useCallback((index: number, behavior: ScrollBehavior) => {
    const track = trackRef.current;
    const card = cardRefs.current[index];
    if (!track || !card) return;
    track.scrollTo({
      left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2,
      behavior,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      centerCard(activeIndex, "auto");
    });
    return () => cancelAnimationFrame(frame);
  }, [activeIndex, centerCard, open]);

  const reveal = (index: number, moveFocus = false) => {
    const next = (index + LEAD_AGENTS.length) % LEAD_AGENTS.length;
    setSpotlight(next);
    if (moveFocus) cardRefs.current[next]?.focus();
    centerCard(next, reduceMotion ? "auto" : "smooth");
  };

  const select = (index: number) => {
    setLeadAgent(LEAD_AGENTS[index].id);
    openHome();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setSpotlight(activeIndex);
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label={`Choose agent. Current agent: ${active.shortName}`}
            className="group flex h-8 max-w-[11rem] items-center gap-2 rounded-md bg-(--well-translucent) px-2 text-[12.5px]/4 font-medium shadow-[inset_0_0_0_1px_var(--well-outline),inset_0_1px_0_0_var(--well-highlight)] backdrop-blur-xl transition-colors duration-100 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        }
      >
        <AgentAvatar agentId={active.id} size={20} />
        <span className="truncate">{active.shortName}</span>
        <IconChevronDown
          size={13}
          aria-hidden="true"
          className="shrink-0 text-muted-foreground"
        />
      </DialogTrigger>

      <DialogContent
        backdropClassName="bg-background/72 backdrop-blur-xl"
        className="!inset-0 !top-0 !left-0 !h-dvh !w-screen !max-w-none !translate-x-0 !overflow-hidden !rounded-none !bg-transparent !p-0 !ring-0 !shadow-none data-open:!zoom-in-100 data-closed:!zoom-out-100"
      >
        <div className="flex h-full flex-col overflow-hidden">
          <header className="flex shrink-0 items-start justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] md:px-10 md:pt-8">
            <div>
              <DialogTitle className="text-[20px]/6 font-semibold tracking-[-0.025em] md:text-[24px]/7">
                Choose your specialist
              </DialogTitle>
              <DialogDescription className="mt-1 max-w-md text-[13px]/5">
                Each agent keeps a separate workspace, memory, and playbook.
              </DialogDescription>
            </div>
            <DialogClose
              aria-label="Close agent chooser"
              className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors duration-100 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <IconX size={19} aria-hidden="true" />
            </DialogClose>
          </header>

          <div
            ref={trackRef}
            role="radiogroup"
            aria-label="Available agents"
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                reveal(spotlight - 1, true);
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                reveal(spotlight + 1, true);
              }
            }}
            className="flex min-h-0 flex-1 snap-x snap-mandatory items-center gap-3 overflow-x-auto px-[max(1.25rem,calc((100vw-18rem)/2))] py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-5"
          >
            {LEAD_AGENTS.map((agent, index) => {
              const selected = agent.id === activeId;
              const focused = spotlight === index;
              return (
                <motion.button
                  ref={(node) => {
                    cardRefs.current[index] = node;
                  }}
                  key={agent.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onFocus={() => setSpotlight(index)}
                  onClick={() => select(index)}
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          transform: focused
                            ? "translate3d(0,-8px,0) scale(1)"
                            : "translate3d(0,0,0) scale(0.965)",
                          opacity: focused ? 1 : 0.56,
                        }
                  }
                  transition={{ duration: 0.18, ease: [0.45, 0, 0.55, 1] }}
                  className="group/card relative flex h-[22rem] w-[17.5rem] shrink-0 snap-center flex-col overflow-hidden rounded-md bg-card/78 p-5 text-left shadow-[0_24px_80px_-36px_rgb(0_0_0/0.5)] backdrop-blur-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-white/[0.055]"
                >
                  <span className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-foreground/18 to-transparent" />
                  <span className="text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <AgentAvatar
                    agentId={agent.id}
                    size={76}
                    className="mt-7 shadow-[0_14px_35px_-16px_rgb(0_0_0/0.55)]"
                  />
                  <span className="mt-5 flex items-center gap-2">
                    <span className="text-[20px]/6 font-semibold tracking-[-0.025em]">
                      {agent.shortName}
                    </span>
                    {selected && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <IconCheck size={13} stroke={3} aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span className="mt-1 text-[12.5px]/5 text-muted-foreground">
                    {agent.description}
                  </span>
                  <span className="mt-auto text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                    Best for
                  </span>
                  <span className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11.5px]/4">
                    {agent.strengths.map((strength) => (
                      <span key={strength}>{strength}</span>
                    ))}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <footer className="flex shrink-0 items-center justify-between px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-10 md:pb-8">
            <span className="text-[11.5px] text-muted-foreground">
              Use arrow keys to browse · Enter to choose
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => reveal(spotlight - 1)}
                aria-label="Previous agent"
                className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors duration-100 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <IconChevronLeft size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => reveal(spotlight + 1)}
                aria-label="Next agent"
                className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors duration-100 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <IconChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
