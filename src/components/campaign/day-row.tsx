import { useState } from "react";
import {
  Camera,
  CheckCircle2,
  ImageOff,
  Loader2,
  Sparkles,
  ThumbsUp,
  Wand2,
} from "lucide-react";
import {
  approveDay,
  generateDay,
  imageFallbackLabel,
  imageUrl,
  tweakDay,
  type CampaignDay,
  type GeneratedImage,
} from "@/lib/api";
import { ReferenceDropZone } from "@/components/chat/reference-upload";
import { cn } from "@/lib/utils";

type Props = {
  campaignId: string;
  date: string;
  day: CampaignDay;
  image?: GeneratedImage | null;
  caption?: string | null;
  status?: string | null;
  onChanged?: () => void;
  /** Uploads screen shows the drop zone always; chat shows it only when needed. */
  alwaysShowUpload?: boolean;
};

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function DayRow({
  campaignId,
  date,
  day,
  image,
  caption,
  status,
  onChanged,
  alwaysShowUpload = false,
}: Props) {
  const [busy, setBusy] = useState<"generate" | "approve" | "tweak" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const url = imageUrl(image);
  const fallback = imageFallbackLabel(image);
  const needsPhoto = Boolean(day.needs_reference_photo);

  async function act(
    kind: "generate" | "approve" | "tweak",
    call: () => Promise<{ ok: boolean; error?: string }>,
  ) {
    setBusy(kind);
    setError(null);
    const result = (await call()) as { ok: boolean; error?: string };
    setBusy(null);
    if (!result.ok) {
      setError(result.error ?? "That request failed.");
      return;
    }
    if (kind === "tweak") {
      setFeedback("");
      setShowFeedback(false);
    }
    onChanged?.();
  }

  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{formatDate(date)}</p>
          <p className="font-mono text-[10px] text-muted-foreground">{date}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {day.platform ? (
            <span className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">
              {String(day.platform)}
            </span>
          ) : null}
          {status ? (
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px]",
                status === "approved" || status === "published"
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-border bg-muted/30 text-muted-foreground",
              )}
            >
              {status.replace(/_/g, " ")}
            </span>
          ) : null}
          {needsPhoto && !url ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] text-warning">
              <Camera className="size-2.5" /> photo needed
            </span>
          ) : null}
        </div>
      </div>

      {day.idea ? (
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{String(day.idea)}</p>
      ) : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,180px)_1fr]">
        <div>
          {url ? (
            <img
              src={url}
              alt={`Generated creative for ${date}`}
              loading="lazy"
              className="aspect-square w-full rounded-md border border-border object-cover"
            />
          ) : (
            <div className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-md border border-border bg-muted/20 px-2 text-center text-muted-foreground">
              <ImageOff className="size-4" />
              <span className="font-mono text-[10px] leading-tight">
                {fallback ?? "no image yet"}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {caption ? (
            <p className="rounded-md border border-border bg-background/60 p-2 text-[11px] leading-snug text-muted-foreground">
              {caption}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void act("generate", () => generateDay(campaignId, date))}
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/15 disabled:opacity-50"
            >
              {busy === "generate" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Sparkles className="size-3" />
              )}
              {url ? "Regenerate image" : "Generate image"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => setShowFeedback((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              <Wand2 className="size-3" /> Tweak
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void act("approve", () => approveDay(campaignId, date))}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              {busy === "approve" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <ThumbsUp className="size-3" />
              )}
              Approve
            </button>
          </div>

          {showFeedback ? (
            <div className="flex gap-1.5">
              <input
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="e.g. warmer lighting, show the product closer"
                className="min-w-0 flex-1 rounded-md border border-border bg-background/60 px-2 py-1 text-[11px] text-foreground outline-none focus:border-primary/50"
              />
              <button
                type="button"
                disabled={busy !== null || feedback.trim().length === 0}
                onClick={() =>
                  void act("tweak", () => tweakDay(campaignId, date, feedback.trim()))
                }
                className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] text-primary disabled:opacity-50"
              >
                {busy === "tweak" ? <Loader2 className="size-3 animate-spin" /> : "Send"}
              </button>
            </div>
          ) : null}

          {alwaysShowUpload || (needsPhoto && !url) ? (
            <ReferenceDropZone
              campaignId={campaignId}
              date={date}
              compact
              label={
                needsPhoto
                  ? "This day needs a real photo — drop or choose one"
                  : "Attach a reference photo for this day"
              }
              onUploaded={() => onChanged?.()}
            />
          ) : null}

          {status === "approved" ? (
            <p className="inline-flex items-center gap-1.5 text-[10px] text-success">
              <CheckCircle2 className="size-3" /> Ready to publish
            </p>
          ) : null}

          {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
