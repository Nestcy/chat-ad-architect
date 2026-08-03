import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EventRow } from "@/components/hub/event-row";
import { fetchHub } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/hub/")({
  head: () => ({
    meta: [
      { title: "Activity Hub — Autopilot" },
      {
        name: "description",
        content:
          "Every action across your campaigns in one feed, including scheduled publishes the agent ran overnight without you.",
      },
      { property: "og:title", content: "Activity Hub — Autopilot" },
      {
        property: "og:description",
        content: "Reverse-chronological activity across all autonomous marketing campaigns.",
      },
    ],
  }),
  component: HubPage,
});

function HubPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hub"],
    queryFn: async () => {
      const result = await fetchHub();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    retry: false,
  });

  return (
    <AppShell>
      <div className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-8">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Activity hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything that happened across your campaigns — including autonomous overnight runs.
          </p>

          <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2, 3].map((index) => (
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
              <p className="p-4 text-xs text-muted-foreground">No activity yet.</p>
            ) : (
              (data?.events ?? []).map((event) => <EventRow key={event.id} event={event} />)
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
