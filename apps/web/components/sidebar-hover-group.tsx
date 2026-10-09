"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

const ROW_SELECTOR = "[data-sidebar-hover-row]";

/** One persistent highlight for a run of sidebar rows. Pointer delegation
 * keeps it mounted while the pointer crosses row boundaries, eliminating
 * the flash caused by unmounting one hover layer before mounting the next. */
export function SidebarHoverGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<Element | null>(null);
  const reduceMotion = useReducedMotion();
  const [highlight, setHighlight] = useState({ y: 0, visible: false });

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const target = (event.target as Element).closest(ROW_SELECTOR);
    if (!target || !rootRef.current?.contains(target)) {
      if (activeRowRef.current) {
        activeRowRef.current = null;
        setHighlight((current) => ({ ...current, visible: false }));
      }
      return;
    }
    if (target === activeRowRef.current) return;
    activeRowRef.current = target;
    const rootRect = rootRef.current.getBoundingClientRect();
    const rowRect = target.getBoundingClientRect();
    setHighlight({ y: rowRect.top - rootRect.top, visible: true });
  };

  return (
    <div
      ref={rootRef}
      onPointerMove={move}
      onPointerLeave={() => {
        activeRowRef.current = null;
        setHighlight((current) => ({ ...current, visible: false }));
      }}
      className={cn("relative", className)}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-8 rounded-sm bg-accent will-change-transform"
        initial={false}
        animate={{
          transform: `translate3d(0, ${highlight.y}px, 0)`,
          opacity: highlight.visible ? 1 : 0,
        }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.09, ease: [0.45, 0, 0.55, 1] }
        }
      />
      {children}
    </div>
  );
}
