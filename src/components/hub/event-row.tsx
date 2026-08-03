import { Link } from "@tanstack/react-router";
import { Clock, MessageSquare, Radio, Terminal, Zap } from "lucide-react";
import { eventLabel, relativeTime, absoluteTime } from "@/lib/events";
import type { HubEvent } from "@/lib/api";
import { cn } from "@/lib/utils";

function SourceBadge({ source }: { source: string }) {
  const config: Record<string, { icon: typeof Clock; className: string; label: string }> = {
    cron: { icon: Clock, className: "border-primary/45 bg-primary/10 text-primary", label: "cron" },
    chat: {
      icon: MessageSquare,
      className: "border-border bg-muted/40 text-muted-foreground",
      label: "chat",
    },
    api: { icon: Terminal, className: "border-border bg-muted/40 text-muted-foreground", label: "api" },
    system: { icon: Zap, className: "border-border bg-muted/40 text-muted-foreground", label: "system" },
  };
  const entry = config[source] ?? {
    icon: Radio,
    className: "border-border bg-muted/40 text-muted-foreground",
    label: source,
  };
  const Icon = entry.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        entry.className,
      )}
    >
      <Icon className="size-3" />
      {entry.label}
    </span>
  );
}

export function EventRow({ event, showCampaign = true }: { event: HubEvent; showCampaign?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <SourceBadge source={event.source} />
          <p className="truncate text-xs font-medium text-foreground">
            {eventLabel(event.event_type)}
          </p>
        </div>
        {showCampaign ? (
          <Link
            to="/hub/$campaignId"
            params={{ campaignId: event.campaign_id }}
            className="mt-1 inline-block font-mono text-[11px] text-muted-foreground transition-colors hover:text-primary"
          >
            {event.campaign_id}
          </Link>
        ) : null}
        {event.payload && Object.keys(event.payload).length > 0 ? (
          <p className="mt-1 line-clamp-2 font-mono text-[10px] text-muted-foreground/80">
            {JSON.stringify(event.payload)}
          </p>
        ) : null}
      </div>
      <p
        className="shrink-0 text-[11px] text-muted-foreground"
        title={absoluteTime(event.created_at)}
      >
        {relativeTime(event.created_at)}
      </p>
    </div>
  );
}
