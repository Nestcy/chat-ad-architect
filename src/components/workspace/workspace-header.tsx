import { Link } from "@tanstack/react-router";
import { ImagePlus, Loader2, Radio } from "lucide-react";
import type { CampaignStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

type Props = {
  campaignId: string | null;
  status: CampaignStatus | null | undefined;
  generating: boolean;
};

function statusLabel(status: CampaignStatus | null | undefined) {
  if (!status) return "No campaign";
  if (status.plan_status === "approved") return "Plan approved";
  if (status.plan_status) return "Plan in review";
  return "Draft";
}

export function WorkspaceHeader({ campaignId, status, generating }: Props) {
  const approved = status?.plan_status === "approved";
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/70 px-6">
      <span className="flex size-6 items-center justify-center rounded-[6px] bg-primary/20 ring-1 ring-primary/45">
        <Radio className="size-3.5 text-primary" />
      </span>
      <h1 className="font-display text-sm text-foreground">
        {campaignId ? "Content Campaign" : "Marketing Workspace"}
      </h1>
      {campaignId ? (
        <span className="hidden truncate font-mono text-[11px] text-muted-foreground md:inline">
          {campaignId}
        </span>
      ) : null}

      <span
        className={cn(
          "rounded-full px-2.5 py-1 text-[11px] font-medium",
          approved
            ? "bg-success/15 text-success"
            : status
              ? "bg-warning text-warning-foreground"
              : "border border-border/70 bg-surface/50 text-muted-foreground",
        )}
      >
        {statusLabel(status)}
      </span>

      {generating ? (
        <span className="inline-flex items-center gap-1.5 text-[11px] text-accent-warm">
          <Loader2 className="size-3 animate-spin" /> generating…
        </span>
      ) : null}

      <nav className="ml-auto flex items-center gap-1">
        <Link
          to="/uploads"
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ImagePlus className="size-3.5" /> Photos
        </Link>
        <Link
          to="/hub"
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Radio className="size-3.5" /> Hub
        </Link>
      </nav>
    </header>
  );
}
