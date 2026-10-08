import { IconSparkles } from "@tabler/icons-react";

export function DeskEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-48 w-full flex-col items-center justify-center rounded-xl bg-card px-6 py-10 text-center ring-1 ring-border">
      <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-muted-foreground">
        <IconSparkles size={17} />
      </span>
      <h2 className="mt-3 text-[14px]/5 font-medium">{title}</h2>
      <p className="mt-1 max-w-sm text-[13px]/5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
