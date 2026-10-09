/* Selected rows keep a quiet static fill. Hover for SidebarRow lives in its
   parent SidebarHoverGroup; draggable folders and threads retain this local
   compatibility path because their interaction surfaces own more state. */
export function RowPill({
  active = false,
  className = "",
}: {
  active?: boolean;
  /** Compatibility path for draggable folder/thread rows, whose hover
   *  state is owned by their larger interaction surface. */
  className?: string;
}) {
  return (
    <>
      {className && (
        <span
          aria-hidden
          className={`absolute inset-0 rounded-sm transition-colors duration-100 group-hover/row:bg-accent group-active/row:bg-accent-pressed ${className}`}
        />
      )}
      {active && (
        <span aria-hidden className="absolute inset-0 rounded-sm bg-accent" />
      )}
    </>
  );
}
