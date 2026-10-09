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
          "my-4 overflow-hidden rounded-xl bg-card shadow-[0_0_0_1px_var(--border),0_1px_2px_rgb(0_0_0/0.03)] dark:shadow-[0_0_0_1px_var(--border)]",
        )}
      >
        <div className="w-full overflow-x-auto [scrollbar-width:thin]">
          <table
            className={cn(
              "w-full min-w-[56rem] border-separate border-spacing-0 text-[12.5px]/5",
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
    return <thead className={cn("bg-muted/35", className)} {...props} />;
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
        className={cn(
          "group/chat-table-row transition-colors duration-150 hover:bg-muted/20",
          className,
        )}
        {...props}
      />
    );
  },
  th: ({ node, className, ...props }) => {
    void node;
    return (
      <th
        className={cn(
          "border-r border-b border-border px-3.5 py-2.5 text-left align-bottom text-[11px]/4 font-medium tracking-[0.025em] whitespace-nowrap text-muted-foreground last:border-r-0",
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
        className={cn(
          "border-r border-b border-border px-3.5 py-3 align-top text-wrap-pretty last:border-r-0 group-last/chat-table-row:border-b-0",
          className,
        )}
        {...props}
      />
    );
  },
};
