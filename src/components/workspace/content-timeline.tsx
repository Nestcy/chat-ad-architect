import { useEffect, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import type { CampaignStatus } from "@/lib/api";
import { readDates, readStrategy } from "@/lib/campaign-shape";
import { DayCard } from "./day-card";
import { StrategySummaryCard } from "./strategy-summary-card";

type Props = {
  campaignId: string | null;
  knownIds?: string[];
  onSelectCampaign?: (campaignId: string) => void;
  status: CampaignStatus | null | undefined;
  loading: boolean;
  error: string | null;
  collapsed: boolean;
  onToggle: () => void;
  onChanged: () => void;
};

function CampaignPicker({
  campaignId,
  knownIds,
  onSelectCampaign,
}: {
  campaignId: string | null;
  knownIds: string[];
  onSelectCampaign: (campaignId: string) => void;
}) {
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setDraft("");
  }, [campaignId]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {knownIds.length > 0 ? (
        <select
          value={campaignId ?? ""}
          onChange={(event) => {
            if (event.target.value) onSelectCampaign(event.target.value);
          }}
          aria-label="Campaign"
          className="max-w-[190px] rounded-md border border-border bg-surface/60 px-2 py-1 text-[11px] text-foreground outline-none focus:border-accent-warm/60"
        >
          <option value="" disabled>
            Select a campaign…
          </option>
          {knownIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      ) : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const value = draft.trim();
          if (value) onSelectCampaign(value);
        }}
        className="flex items-center gap-1.5"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Paste campaign id"
          aria-label="Campaign id"
          className="w-[150px] rounded-md border border-border bg-surface/60 px-2 py-1 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-accent-warm/60"
        />
        <button
          type="submit"
          disabled={draft.trim().length === 0}
          className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-accent-warm/50 hover:text-foreground disabled:opacity-40"
        >
          Load
        </button>
      </form>
    </div>
  );
}

export function ContentTimeline({
  campaignId,
  knownIds = [],
  onSelectCampaign,
  status,
  loading,
  error,
  collapsed,
  onToggle,
  onChanged,
}: Props) {
  const calendar = status?.calendar_plan ?? null;
  const dates = readDates(status);
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
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/70 px-6 py-3">
        <h2 className="font-display text-xs uppercase tracking-[0.16em] text-foreground">
          Content Timeline
        </h2>
        <span className="text-xs text-muted-foreground">
          ({dates.length} day{dates.length === 1 ? "" : "s"})
        </span>
        <div className="ml-auto flex items-center gap-2">
          {onSelectCampaign ? (
            <CampaignPicker
              campaignId={campaignId}
              knownIds={knownIds}
              onSelectCampaign={onSelectCampaign}
            />
          ) : null}
          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse content timeline"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition-colors hover:border-accent-warm/50 hover:text-accent-warm"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {!campaignId ? (
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            No campaign loaded yet. Ask the assistant on the left to plan a content calendar, pick
            one from the selector above, or paste a campaign id to review it here.
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
                variants={status?.ad_copy_variants?.[date] ?? null}
                imagePrompt={status?.image_prompts?.[date] ?? null}
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
