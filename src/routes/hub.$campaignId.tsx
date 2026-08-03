import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EventRow } from "@/components/hub/event-row";
import { fetchCampaignTimeline } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/hub/$campaignId")({
  head: () => ({
    meta: [
      { title: "Campaign Timeline — Autopilot" },
      {
        name: "description",
        content:
          "Full history for a single autonomous campaign: planning, generated assets, reference photos, and every publish.",
      },
      { property: "og:title", content: "Campaign Timeline — Autopilot" },
      {
        property: "og:description",
        content: "Chronological history of one autonomous marketing campaign.",
      },
    ],
  }),
  component: CampaignTimelinePage,
});

function CampaignTimelinePage() {
  const { campaignId } = Route.useParams();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["timeline", campaignId],
    queryFn: async () => {
      const result = await fetchCampaignTimeline(campaignId);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    retry: false,
  });

  return (
    <AppShell>
      <div className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-8">
          <Link
            to="/hub"
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> All activity
          </Link>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
            Campaign timeline
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{campaignId}</p>

          <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="p-4">
                <p className="flex items-start gap-2 text-[11px] text-destructive">
                  <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                  Something went wrong reaching the server — try again.
                </p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11px] text-foreground hover:border-primary/50"
                >
                  <RotateCcw className="size-3" /> Retry
                </button>
              </div>
            ) : (data?.events ?? []).length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground">No events for this campaign yet.</p>
            ) : (
              (data?.events ?? []).map((event) => (
                <EventRow key={event.id} event={event} showCampaign={false} />
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
