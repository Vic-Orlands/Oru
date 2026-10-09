import type { StreamdownProps } from "streamdown";

import { cn } from "@/lib/utils";
import { THREAD_ANALYSIS_WIDTH } from "@/lib/thread-layout";

/* Tables for assistant prose, replacing Streamdown's boxed default. Data
   earns more room than prose: on desktop the surface breaks out of the
   reading measure into the viewport-aware analysis width; on small screens
   the table scrolls inside that surface rather than squeezing its columns. */

export const TABLE_COMPONENTS: NonNullable<StreamdownProps["components"]> = {
  table: ({ node, className, children, ...props }) => {
    void node;
    return (
      <div
        className={cn(
          THREAD_ANALYSIS_WIDTH,
          "my-4 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border",
        )}
      >
        <div className="w-full overflow-x-auto [scrollbar-width:thin]">
          <table
            className={cn(
              "w-full min-w-[56rem] border-collapse text-[13px]/5",
              className,
            )}
            {...props}
          >
            {children}
          </table>
        </div>
      </div>
    );
  },
  thead: ({ node, className, ...props }) => {
    void node;
    return <thead className={cn("bg-well", className)} {...props} />;
  },
  tbody: ({ node, className, ...props }) => {
    void node;
    return <tbody className={className} {...props} />;
  },
  /* Dividers ride the rows; `last:` drops the rule under the final row so
     the box closes on its own border. (The header band's rule comes from
     the th cells — thead's tr is also a :last-child.) */
  tr: ({ node, className, ...props }) => {
    void node;
    return (
      <tr
        className={cn("border-b border-border last:border-b-0", className)}
        {...props}
      />
    );
  },
  th: ({ node, className, ...props }) => {
    void node;
    return (
      <th
        className={cn(
          "border-b border-border px-4 py-2.5 text-left align-bottom text-[12px]/5 font-medium tracking-[0.02em] whitespace-nowrap text-muted-foreground",
          className,
        )}
        {...props}
      />
    );
  },
  td: ({ node, className, ...props }) => {
    void node;
    return (
      <td
        className={cn("px-4 py-3 align-top text-wrap-pretty", className)}
        {...props}
      />
    );
  },
};
