import {
  IconCircleCheckFilled,
  IconCircleDashed,
  IconRobot,
  IconUser,
} from "@tabler/icons-react";

export function JobApplicationTimeline({
  events,
}: {
  events: Array<{
    id: string;
    summary: string;
    source: string;
    createdAt: number;
  }>;
}) {
  if (events.length === 0) return null;
  return (
    <ol className="space-y-2">
      {events.map((event, index) => {
        const Icon = event.source === "user" ? IconUser : IconRobot;
        return (
          <li key={event.id} className="grid grid-cols-[20px_1fr] gap-2 text-xs">
            <span className="relative flex justify-center pt-0.5 text-muted-foreground">
              {index === 0 ? <IconCircleCheckFilled size={15} className="text-emerald-600 dark:text-emerald-400" /> : <IconCircleDashed size={15} />}
            </span>
            <div className="min-w-0">
              <p>{event.summary}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Icon size={12} />
                {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(event.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
