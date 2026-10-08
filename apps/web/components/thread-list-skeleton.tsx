import { Skeleton } from "@/components/ui/skeleton";
import type { ThreadListSnapshot } from "@/lib/thread-cache";

/* The cache is restored by useThreadListSnapshot in a layout effect. Keep the
   server silhouette structurally identical to the first client render: boot
   scripts that append cached rows before hydration make React discard the
   entire sidebar tree. */
export function ThreadListSkeleton({
  snapshot,
}: {
  snapshot: ThreadListSnapshot | null;
}) {
  return (
    <div
      className={`flex h-full flex-col overflow-hidden px-3 ${
        snapshot ? "gap-1 pt-1" : "gap-2"
      }`}
    >
      <Skeleton className="mb-1 ml-2.5 h-3 w-14 animate-none" />
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex h-8 shrink-0 items-center px-2.5">
          <Skeleton
            className="h-3.5 animate-none"
            style={{ width: `${72 - index * 9}%`, opacity: 1 - index * 0.15 }}
          />
        </div>
      ))}
    </div>
  );
}
