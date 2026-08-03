import { AlertTriangle, RefreshCcw, Rocket } from "lucide-react";
import type { ToolCall } from "@/lib/api";
import { CampaignStatusPanel } from "./campaign-status-panel";

function ErrorNote({ message }: { message: string }) {
  return (
    <p className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/[0.06] px-3 py-2 text-[11px] text-warning">
      <AlertTriangle className="mt-0.5 size-3 shrink-0" />
      {message}
    </p>
  );
}

function CardFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.8)]">
      {children}
    </div>
  );
}

export function ToolCallCard({
  toolCall,
  onQuickSend,
}: {
  toolCall: ToolCall;
  onQuickSend: (text: string) => void;
}) {
  const result = toolCall.result ?? {};
  const error = typeof result["error"] === "string" ? (result["error"] as string) : null;
  const campaignId = typeof result["campaign_id"] === "string" ? result["campaign_id"] : null;

  if (toolCall.name === "start_campaign" && campaignId) {
    return (
      <CampaignStatusPanel campaignId={campaignId} initial={result} live title="Campaign started" />
    );
  }

  if (toolCall.name === "get_campaign_status" && campaignId) {
    return <CampaignStatusPanel campaignId={campaignId} initial={result} title="Campaign status" />;
  }

  if (toolCall.name === "reroute_campaign") {
    return (
      <CardFrame>
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <RefreshCcw className="size-3.5 text-primary" />
          Campaign updated — replanning
        </div>
        {campaignId ? (
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">{campaignId}</p>
        ) : null}
        {error ? (
          <div className="mt-2">
            <ErrorNote message={error} />
          </div>
        ) : null}
      </CardFrame>
    );
  }

  if (toolCall.name === "list_campaigns") {
    const ids = Array.isArray(result["campaign_ids"]) ? (result["campaign_ids"] as string[]) : [];
    return (
      <CardFrame>
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Rocket className="size-3.5 text-primary" />
          Campaigns
        </div>
        {ids.length === 0 ? (
          <p className="mt-2 text-[11px] text-muted-foreground">No campaigns yet.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ids.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onQuickSend(`show me campaign ${id}`)}
                className="rounded-full border border-border bg-background/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {id}
              </button>
            ))}
          </div>
        )}
        {error ? (
          <div className="mt-2">
            <ErrorNote message={error} />
          </div>
        ) : null}
      </CardFrame>
    );
  }

  return (
    <CardFrame>
      <p className="text-xs font-semibold text-foreground">{toolCall.name.replace(/_/g, " ")}</p>
      {error ? (
        <div className="mt-2">
          <ErrorNote message={error} />
        </div>
      ) : (
        <pre className="mt-2 max-h-40 overflow-auto rounded-md border border-border bg-background/60 p-2 font-mono text-[10px] text-muted-foreground">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </CardFrame>
  );
}
