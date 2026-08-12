import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DayState } from "@/lib/campaign-shape";

const LABELS: Record<DayState, string> = {
  empty: "Not written yet",
  awaiting: "Awaiting approval",
  approved: "Approved",
  published: "Published",
};

export function StatusBadge({ state, className }: { state: DayState; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
        state === "awaiting" && "bg-warning text-warning-foreground",
        state === "approved" && "bg-success/15 text-success",
        state === "published" &&
          "border border-primary/45 bg-transparent text-foreground/85",
        state === "empty" && "border border-border/70 bg-surface/50 text-muted-foreground",
        className,
      )}
    >
      {state === "awaiting" ? (
        <span className="size-1.5 rounded-full bg-warning-foreground/80" />
      ) : null}
      {state === "published" ? <Check className="size-3" /> : null}
      {LABELS[state]}
    </span>
  );
}
