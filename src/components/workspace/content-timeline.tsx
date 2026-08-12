import { ChevronRight, Loader2 } from "lucide-react";
import type { CampaignStatus } from "@/lib/api";
import { readStrategy } from "@/lib/campaign-shape";
import { DayCard } from "./day-card";
import { StrategySummaryCard } from "./strategy-summary-card";

type Props = {
  campaignId: string | null;
  status: CampaignStatus | null | undefined;
  loading: boolean;
  error: string | null;
  collapsed: boolean;
  onToggle: () => void;
  onChanged: () => void;
};

export function ContentTimeline({
  campaignId,
  status,
  loading,
  error,
  collapsed,
  onToggle,
  onChanged,
}: Props) {
  const calendar = status?.calendar_plan ?? null;
  const dates = calendar ? Object.keys(calendar).sort() : [];
  const strategy = readStrategy(status);
  const approved = status?.plan_status === "approved";

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label="Expand content timeline"
        className="flex h-full w-12 shrink-0 flex-col items-center justify-between gap-4 border-l border-border/70 bg-card/60 py-5 transition-colors hover:bg-card"
      >
        <ChevronRight className="size-4 rotate-180 text-muted-foreground" />
        <span
          className="font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
          style={{ writingMode: "vertical-rl" }}
        >
          Content Timeline ({dates.length} days)
        </span>
        <ChevronRight className="size-4 rotate-180 text-muted-foreground" />
      </button>
    );
  }

  return (
    <section className="flex h-full min-w-0 flex-[3] flex-col border-l border-border/70 bg-background/20">
      <header className="flex shrink-0 items-center gap-2 border-b border-border/70 px-6 py-3.5">
        <h2 className="font-display text-xs uppercase tracking-[0.16em] text-foreground">
          Content Timeline
        </h2>
        <span className="text-xs text-muted-foreground">
          ({dates.length} day{dates.length === 1 ? "" : "s"})
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Collapse content timeline"
          className="ml-auto inline-flex size-7 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition-colors hover:border-accent-warm/50 hover:text-accent-warm"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {!campaignId ? (
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            No campaign loaded yet. Ask the assistant on the left to plan a content calendar and it
            will appear here for review.
          </p>
        ) : (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
            {loading && !status ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Loading the calendar…
              </p>
            ) : null}

            {error ? (
              <p className="rounded-lg border border-destructive/35 bg-destructive/[0.07] px-3 py-2.5 text-xs text-destructive">
                {error}
              </p>
            ) : null}

            {status ? (
              <StrategySummaryCard
                campaignId={campaignId}
                strategy={strategy}
                approved={approved}
                dayCount={dates.length}
                onChanged={onChanged}
              />
            ) : null}

            {dates.map((date) => (
              <DayCard
                key={date}
                campaignId={campaignId}
                date={date}
                day={calendar?.[date] ?? {}}
                caption={status?.generated_captions?.[date] ?? null}
                status={status?.asset_status?.[date] ?? null}
                onChanged={onChanged}
              />
            ))}

            {status && dates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No calendar days yet — the agent is still drafting.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
