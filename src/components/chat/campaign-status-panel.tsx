import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2, ThumbsUp } from "lucide-react";
import {
  approvePlan,
  fetchCampaignStatus,
  type CampaignStatus,
  type ToolResult,
} from "@/lib/api";
import { DayRow } from "@/components/campaign/day-row";
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

type Props = {
  campaignId: string;
  initial?: ToolResult | null;
  live?: boolean;
  title: string;
};

export function CampaignStatusPanel({ campaignId, initial, live = false, title }: Props) {
  const [timedOut, setTimedOut] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["campaign-status", campaignId],
    queryFn: async () => {
      const result = await fetchCampaignStatus(campaignId);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: Boolean(campaignId),
    refetchInterval: () => {
      if (!live || timedOut) return false;
      return 3000;
    },
    retry: false,
  });

  useEffect(() => {
    if (!live) return;
    const timer = setTimeout(() => setTimedOut(true), POLL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [live]);

  const status: CampaignStatus | undefined = useMemo(() => {
    if (data) return data;
    if (initial && (initial["calendar_plan"] || initial["plan_status"] || initial["logs"])) {
      return initial as unknown as CampaignStatus;
    }
    return undefined;
  }, [data, initial]);

  const calendar = status?.calendar_plan ?? null;
  const dates = calendar ? Object.keys(calendar).sort() : [];
  const planApproved = status?.plan_status === "approved";
  const running = Boolean(status?.is_running);
  const tone = planApproved && !running ? "done" : timedOut && !running ? "idle" : "live";
  const pillLabel = planApproved
    ? running
      ? "Producing assets…"
      : "Plan approved"
    : status?.plan_status
      ? "Plan draft — awaiting approval"
      : timedOut
        ? "Still working — refresh for updates"
        : "Running…";

  async function onApprovePlan() {
    setApproving(true);
    setApproveError(null);
    const result = await approvePlan(campaignId);
    setApproving(false);
    if (!result.ok) {
      setApproveError(result.error);
      return;
    }
    void refetch();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_24px_-16px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs font-semibold tracking-tight text-foreground">{title}</p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{campaignId}</p>
        </div>
        <StatusPill label={pillLabel} tone={tone} />
      </div>

      {status?.plan_status && !planApproved ? (
        <Section title="Plan approval">
          <button
            type="button"
            disabled={approving}
            onClick={() => void onApprovePlan()}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/15 disabled:opacity-50"
          >
            {approving ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <ThumbsUp className="size-3" />
            )}
            Approve this plan
          </button>
          {approveError ? (
            <p className="mt-2 text-[11px] text-destructive">{approveError}</p>
          ) : null}
        </Section>
      ) : null}

      {dates.length > 0 ? (
        <Section title="Content calendar">
          <div className="space-y-2">
            {dates.map((date) => (
              <DayRow
                key={date}
                campaignId={campaignId}
                date={date}
                day={calendar?.[date] ?? {}}
                image={status?.generated_images?.[date] ?? null}
                caption={status?.generated_captions?.[date] ?? null}
                status={status?.asset_status?.[date] ?? null}
                onChanged={() => void refetch()}
              />
            ))}
          </div>
        </Section>
      ) : null}

      {status?.logs && status.logs.length > 0 ? (
        <Section title="Agent log">
          <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-background/60 p-2">
            {status.logs.map((line, index) => (
              <p
                key={index}
                className="font-mono text-[10px] leading-relaxed text-muted-foreground"
              >
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
