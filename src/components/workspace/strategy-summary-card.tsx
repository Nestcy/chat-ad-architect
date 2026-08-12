import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { approvePlan, refinePlan } from "@/lib/api";
import type { Strategy } from "@/lib/campaign-shape";
import { cn } from "@/lib/utils";

type Props = {
  campaignId: string;
  strategy: Strategy;
  approved: boolean;
  dayCount: number;
  onChanged?: () => void;
};

function Chip({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "warm" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px]",
        tone === "warm"
          ? "border border-accent-warm/35 bg-accent-warm/[0.08] text-accent-warm"
          : "border border-border/80 bg-surface/60 text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function StrategySummaryCard({
  campaignId,
  strategy,
  approved,
  dayCount,
  onChanged,
}: Props) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState<"approve" | "refine" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(kind: "approve" | "refine", call: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(kind);
    setError(null);
    const result = await call();
    setBusy(null);
    if (!result.ok) {
      setError(result.error ?? "That request failed.");
      return;
    }
    if (kind === "refine") {
      setFeedback("");
      setOpen(false);
    }
    onChanged?.();
  }

  if (approved) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-border/70 bg-card/70 px-4 py-2.5">
        <Check className="size-3.5 text-success" />
        <p className="font-display text-xs text-foreground">Strategy approved</p>
        <p className="truncate text-xs text-muted-foreground">
          {dayCount} day{dayCount === 1 ? "" : "s"}
          {strategy.tone ? ` · ${strategy.tone}` : ""}
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-border/70 bg-card px-5 py-5 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.9)]">
      <h2 className="font-display text-sm uppercase tracking-[0.14em] text-muted-foreground">
        Strategy summary
      </h2>

      {strategy.summary ? (
        <p className="mt-3 text-sm leading-relaxed text-foreground/90">{strategy.summary}</p>
      ) : null}

      <div className="mt-5 space-y-4">
        {strategy.pillars.length > 0 ? (
          <div>
            <p className="font-display text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Content pillars
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {strategy.pillars.map((pillar) => (
                <Chip key={pillar} tone="warm">
                  {pillar}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}

        {strategy.tone ? (
          <div>
            <p className="font-display text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Tone
            </p>
            <p className="mt-1.5 text-sm text-foreground/90">{strategy.tone}</p>
          </div>
        ) : null}

        {strategy.platforms.length > 0 ? (
          <div>
            <p className="font-display text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Platform mix
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {strategy.platforms.map((platform) => (
                <Chip key={platform}>{platform}</Chip>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void act("approve", () => approvePlan(campaignId))}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy === "approve" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          Approve Plan
        </button>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-lg border border-border bg-surface/50 px-3.5 py-2 text-xs text-muted-foreground transition-colors hover:border-accent-warm/50 hover:text-foreground"
        >
          Request Changes
        </button>
      </div>

      {open ? (
        <div className="mt-3">
          <textarea
            value={feedback}
            rows={3}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="What should the agent change about this plan?"
            className="w-full resize-none rounded-lg border border-border bg-surface/60 px-3 py-2 text-xs text-foreground outline-none focus:border-accent-warm/60"
          />
          <button
            type="button"
            disabled={busy !== null || feedback.trim().length === 0}
            onClick={() => void act("refine", () => refinePlan(campaignId, feedback.trim()))}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy === "refine" ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Send changes
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
