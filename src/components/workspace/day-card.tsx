import { useState } from "react";
import { Camera, Check, Loader2 } from "lucide-react";
import { approveDay, tweakDay, type CampaignDay } from "@/lib/api";
import { formatDayDate, readDay, readDayState } from "@/lib/campaign-shape";
import { CopyButton } from "./copy-button";
import { StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils";

type Props = {
  campaignId: string;
  date: string;
  day: CampaignDay | null | undefined;
  caption?: string | null;
  variants?: unknown;
  imagePrompt?: unknown;
  status?: string | null;
  onChanged?: () => void;
};

export function DayCard({
  campaignId,
  date,
  day,
  caption,
  variants,
  imagePrompt,
  status,
  onChanged,
}: Props) {
  const content = readDay(day, caption, variants, imagePrompt);
  const state = readDayState(status, content.hasContent);

  const [showVariants, setShowVariants] = useState(false);
  const [tweakOpen, setTweakOpen] = useState(false);
  const [tweakText, setTweakText] = useState("");
  const [busy, setBusy] = useState<"approve" | "tweak" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const settled = state === "approved" || state === "published";

  async function act(kind: "approve" | "tweak", call: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(kind);
    setError(null);
    const result = await call();
    setBusy(null);
    if (!result.ok) {
      setError(result.error ?? "That request failed.");
      return;
    }
    if (kind === "tweak") {
      setTweakText("");
      setTweakOpen(false);
    }
    onChanged?.();
  }

  const empty = state === "empty";

  return (
    <article
      className={cn(
        "rounded-xl border bg-card px-5 py-5",
        empty
          ? "border-border/60 bg-card/50"
          : "border-border/70 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.9)]",
        "border-l-2",
        state === "awaiting" ? "border-l-primary" : "border-l-border",
      )}
    >
      <header className="flex flex-wrap items-center gap-2.5">
        <h3 className="font-display text-base text-foreground">{formatDayDate(date)}</h3>
        {content.platform ? (
          <span className="rounded-full border border-border/80 bg-surface/60 px-2.5 py-0.5 text-[11px] text-muted-foreground">
            {content.platform}
          </span>
        ) : null}
        <span className="ml-auto">
          <StatusBadge state={state} />
        </span>
      </header>

      {content.idea ? (
        <p className="mt-2 text-xs italic text-muted-foreground">{content.idea}</p>
      ) : null}

      {empty ? (
        <>
          <div className="mt-4 space-y-2.5">
            <div className="h-2.5 w-2/3 rounded-full bg-muted/60" />
            <div className="h-2.5 w-full rounded-full bg-muted/40" />
            <div className="h-2.5 w-1/2 rounded-full bg-muted/30" />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Content not written yet — approve the plan to let the agent draft this day, or send a
            note below to steer it.
          </p>
        </>
      ) : null}

      {content.caption ? (
        <p className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
          {content.caption}
        </p>
      ) : null}



      {content.variants.length > 0 ? (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowVariants((prev) => !prev)}
            className="text-xs font-medium text-accent-warm transition-opacity hover:opacity-80"
          >
            {showVariants ? "Hide" : "Show"} {content.variants.length} variant
            {content.variants.length === 1 ? "" : "s"}
          </button>
          {showVariants ? (
            <ol className="mt-3 space-y-3">
              {content.variants.map((variant, index) => (
                <li key={index} className="flex items-start gap-2.5">
                  <span className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {index + 1}.
                  </span>
                  <p className="min-w-0 flex-1 text-sm leading-relaxed text-foreground/90">
                    {variant}
                  </p>
                  <CopyButton value={variant} label={`Copy variant ${index + 1}`} />
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}

      {content.imagePrompt ? (
        <div className="relative mt-5 rounded-lg border border-border bg-surface/70 p-4">
          <p className="mb-2 font-display text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Image prompt
          </p>
          <p className="whitespace-pre-wrap pr-9 font-mono text-xs leading-relaxed text-foreground/90">
            {content.imagePrompt}
          </p>
          <CopyButton
            value={content.imagePrompt}
            label="Copy image prompt"
            className="absolute right-3 top-3"
          />
        </div>
      ) : null}

      {content.needsPhoto ? (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-accent-warm/30 bg-accent-warm/[0.07] px-3 py-2 text-xs text-accent-warm">
          <Camera className="mt-0.5 size-3.5 shrink-0" />
          Consider using your own photo for this one instead of a generated image.
        </p>
      ) : null}

      <footer className="mt-5 border-t border-border/60 pt-4">
        {settled ? (
          <button
            type="button"
            onClick={() => setTweakOpen((prev) => !prev)}
            className="text-xs text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
          >
            Edit
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void act("approve", () => approveDay(campaignId, date))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy === "approve" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              Approve
            </button>
            <button
              type="button"
              onClick={() => setTweakOpen((prev) => !prev)}
              className="rounded-lg border border-border bg-surface/50 px-3.5 py-2 text-xs text-muted-foreground transition-colors hover:border-accent-warm/50 hover:text-foreground"
            >
              Tweak
            </button>
          </div>
        )}

        {tweakOpen ? (
          <div className="mt-3">
            <textarea
              value={tweakText}
              rows={3}
              onChange={(event) => setTweakText(event.target.value)}
              placeholder="What should change about this day?"
              className="w-full resize-none rounded-lg border border-border bg-surface/60 px-3 py-2 text-xs text-foreground outline-none focus:border-accent-warm/60"
            />
            <button
              type="button"
              disabled={busy !== null || tweakText.trim().length === 0}
              onClick={() => void act("tweak", () => tweakDay(campaignId, date, tweakText.trim()))}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy === "tweak" ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Send feedback
            </button>
          </div>
        ) : null}

        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      </footer>
    </article>
  );
}
