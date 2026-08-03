import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, CheckCircle2, ImageOff, Loader2 } from "lucide-react";
import {
  fetchCampaignStatus,
  type CampaignStatus,
  type GeneratedImage,
  type ToolResult,
} from "@/lib/api";
import { ReferenceUploadCard } from "./reference-upload";
import { cn } from "@/lib/utils";

const POLL_TIMEOUT_MS = 120_000;

function StatusPill({ label, tone }: { label: string; tone: "live" | "done" | "idle" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tone === "live" && "border-primary/40 bg-primary/10 text-primary",
        tone === "done" && "border-success/40 bg-success/10 text-success",
        tone === "idle" && "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      {tone === "live" ? (
        <Loader2 className="size-3 animate-spin" />
      ) : tone === "done" ? (
        <CheckCircle2 className="size-3" />
      ) : null}
      {label}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border px-4 py-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

function PlanGrid({ plan }: { plan: Record<string, unknown[] | null> }) {
  const weeks = Object.keys(plan).sort();
  return (
    <div className="grid gap-2 md:grid-cols-4">
      {weeks.map((week) => (
        <div key={week} className="rounded-md border border-border bg-background/40 p-2.5">
          <p className="mb-1.5 text-[11px] font-semibold text-foreground">
            {week.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
          </p>
          <ul className="space-y-1">
            {(plan[week] ?? []).map((item, index) => (
              <li key={index} className="text-[11px] leading-snug text-muted-foreground">
                •{" "}
                {typeof item === "string"
                  ? item
                  : typeof item === "object" && item !== null
                    ? String(
                        (item as Record<string, unknown>)["description"] ??
                          (item as Record<string, unknown>)["title"] ??
                          (item as Record<string, unknown>)["asset_id"] ??
                          JSON.stringify(item),
                      )
                    : String(item)}
              </li>
            ))}
            {(plan[week] ?? []).length === 0 ? (
              <li className="text-[11px] text-muted-foreground/70">No items</li>
            ) : null}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ImageGrid({
  images,
  copy,
}: {
  images: Record<string, GeneratedImage>;
  copy?: Record<string, string> | null;
}) {
  const entries = Object.entries(images);
  if (entries.length === 0) {
    return <p className="text-[11px] text-muted-foreground">No images generated yet.</p>;
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map(([assetId, image]) => (
        <div key={assetId} className="overflow-hidden rounded-md border border-border bg-background/40">
          {image?.url ? (
            <img
              src={image.url}
              alt={`Generated asset ${assetId}`}
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 bg-muted/20 text-muted-foreground">
              <ImageOff className="size-4" />
              <span className="px-3 text-center font-mono text-[10px] leading-tight">
                {image?.local_path ?? "no preview available"}
              </span>
            </div>
          )}
          <div className="space-y-1 p-2">
            <p className="truncate font-mono text-[10px] text-foreground">{assetId}</p>
            {image?.model ? (
              <p className="truncate text-[10px] text-muted-foreground">{image.model}</p>
            ) : null}
            {copy?.[assetId] ? (
              <p className="line-clamp-3 text-[10px] leading-snug text-muted-foreground">
                {copy[assetId]}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

type Props = {
  campaignId: string;
  initial?: ToolResult | null;
  live?: boolean;
  title: string;
};

export function CampaignStatusPanel({ campaignId, initial, live = false, title }: Props) {
  const [startedAt] = useState(() => Date.now());
  const [timedOut, setTimedOut] = useState(false);
  const [uploaded, setUploaded] = useState<string[]>([]);

  const { data, refetch } = useQuery({
    queryKey: ["campaign-status", campaignId],
    queryFn: async () => {
      const result = await fetchCampaignStatus(campaignId);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: Boolean(campaignId),
    refetchInterval: (query) => {
      if (!live || timedOut) return false;
      const status = query.state.data as CampaignStatus | undefined;
      if (status?.publishing_status) return false;
      return 3000;
    },
    retry: false,
  });

  useEffect(() => {
    if (!live) return;
    const timer = setTimeout(() => setTimedOut(true), POLL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [live, startedAt]);

  const status: CampaignStatus | undefined = useMemo(() => {
    if (data) return data;
    if (initial && (initial.campaign_plan || initial.generated_images || initial.logs)) {
      return initial as unknown as CampaignStatus;
    }
    return undefined;
  }, [data, initial]);

  const pending = (status?.pending_reference_requests ?? []).filter(
    (assetId) => !uploaded.includes(assetId),
  );
  const publishing = status?.publishing_status;
  const tone = publishing ? "done" : timedOut ? "idle" : "live";
  const pillLabel = publishing
    ? "Published"
    : timedOut
      ? "Still working — refresh for updates"
      : "Running…";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_24px_-16px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs font-semibold tracking-tight text-foreground">{title}</p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{campaignId}</p>
        </div>
        <StatusPill label={pillLabel} tone={tone} />
      </div>

      {status?.campaign_plan ? (
        <Section title="Campaign plan">
          <PlanGrid plan={status.campaign_plan} />
        </Section>
      ) : null}

      {status?.budget_allocations ? (
        <Section title="Budget allocation">
          <div className="flex flex-wrap gap-2">
            {Object.entries(status.budget_allocations).map(([channel, amount]) => (
              <span
                key={channel}
                className="rounded-md border border-border bg-background/40 px-2 py-1 text-[11px] text-muted-foreground"
              >
                {channel.replace(/_/g, " ")}{" "}
                <span className="font-mono text-foreground">${amount ?? 0}</span>
              </span>
            ))}
          </div>
        </Section>
      ) : null}

      {status?.generated_images ? (
        <Section title="Generated images">
          <ImageGrid images={status.generated_images} copy={status.generated_copy} />
        </Section>
      ) : null}

      {pending.length > 0 ? (
        <Section title="Reference photos needed">
          <div className="space-y-2">
            {pending.map((assetId) => (
              <ReferenceUploadCard
                key={assetId}
                campaignId={campaignId}
                assetId={assetId}
                onUploaded={(id) => {
                  setUploaded((prev) => [...prev, id]);
                  void refetch();
                }}
              />
            ))}
          </div>
        </Section>
      ) : null}

      {status?.publish_schedule ? (
        <Section title="Publish schedule">
          <div className="space-y-1">
            {Object.entries(status.publish_schedule).map(([assetId, date]) => (
              <div key={assetId} className="flex items-center gap-2 text-[11px]">
                <CalendarClock className="size-3 text-muted-foreground" />
                <span className="font-mono text-foreground">{assetId}</span>
                <span className="text-muted-foreground">{date}</span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {publishing ? (
        <Section title="Publishing status">
          <div className="flex flex-wrap gap-2">
            {Object.entries(publishing).map(([channel, info]) => (
              <span
                key={channel}
                className="rounded-md border border-success/30 bg-success/5 px-2 py-1 text-[11px] text-foreground"
              >
                {channel} · <span className="font-mono">{info?.status ?? "unknown"}</span>
                {typeof info?.budget_allocated_usd === "number"
                  ? ` · $${info.budget_allocated_usd}`
                  : ""}
              </span>
            ))}
          </div>
        </Section>
      ) : null}

      {status?.logs && status.logs.length > 0 ? (
        <Section title="Agent log">
          <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-background/60 p-2">
            {status.logs.map((line, index) => (
              <p key={index} className="font-mono text-[10px] leading-relaxed text-muted-foreground">
                {line}
              </p>
            ))}
          </div>
        </Section>
      ) : null}

      {!status ? (
        <Section title="Status">
          <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Waiting for the first planning results…
          </p>
        </Section>
      ) : null}

      {initial?.error ? (
        <Section title="Note">
          <p className="flex items-start gap-2 text-[11px] text-warning">
            <AlertTriangle className="mt-0.5 size-3 shrink-0" />
            {initial.error}
          </p>
        </Section>
      ) : null}
    </div>
  );
}
