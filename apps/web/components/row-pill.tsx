"use client";

import { motion, useReducedMotion } from "motion/react";

/* Selected rows keep a quiet static fill. Hover mounts one shared Motion
   layer, so the highlight glides between adjacent rows instead of each row
   flashing its own rectangle. */
export function RowPill({
  active = false,
  hovered = false,
  className = "",
}: {
  active?: boolean;
  hovered?: boolean;
  /** Compatibility path for draggable folder/thread rows, whose hover
   *  state is owned by their larger interaction surface. */
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <>
      {className && (
        <span
          aria-hidden
          className={`absolute inset-0 rounded-md transition-colors duration-150 group-hover/row:bg-accent group-active/row:bg-accent-pressed ${className}`}
        />
      )}
      {active && (
        <span aria-hidden className="absolute inset-0 rounded-md bg-accent" />
      )}
      {hovered && (
        <motion.span
          aria-hidden
          layoutId="sidebar-fluid-hover"
          className="absolute inset-0 rounded-md bg-accent group-active/row:bg-accent-pressed"
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 520, damping: 42, mass: 0.7 }
          }
        />
      )}
    </>
  );
}
