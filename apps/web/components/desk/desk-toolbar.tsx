import type { ReactNode } from "react";
import { IconTable } from "@tabler/icons-react";

export function DeskToolbar({
  count,
  children,
}: {
  count?: number;
  children?: ReactNode;
}) {
  return (
    <div className="mb-3 flex min-h-9 flex-wrap items-center justify-between gap-2">
      <div className="inline-flex h-8 items-center gap-1.5 border-b-2 border-foreground px-1 text-[12px] font-medium">
        <IconTable size={14} />
        Table
      </div>
      <div className="flex items-center gap-2">
        {count !== undefined ? (
          <span className="text-[12px] tabular-nums text-muted-foreground">
            {count} {count === 1 ? "record" : "records"}
          </span>
        ) : null}
        {children}
      </div>
    </div>
  );
}
