import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ImagePlus, Loader2, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DayRow } from "@/components/campaign/day-row";
import { fetchCampaignStatus } from "@/lib/api";

const STORAGE_KEY = "autopilot.uploads.campaign";

export const Route = createFileRoute("/uploads")({
  head: () => ({
    meta: [
      { title: "Reference Photos & Image Studio — Autopilot" },
      {
        name: "description",
        content:
          "Upload reference photos per campaign day and trigger AI image generation for each planned post.",
      },
      { property: "og:title", content: "Reference Photos & Image Studio — Autopilot" },
      {
        property: "og:description",
        content:
          "Feed real product photos to the marketing agent, or let it generate creative for any day of the calendar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UploadsPage,
});

function UploadsPage() {
  const [input, setInput] = useState("");
  const [campaignId, setCampaignId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setInput(stored);
      setCampaignId(stored);
    }
  }, []);

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["campaign-status", campaignId],
    queryFn: async () => {
      const result = await fetchCampaignStatus(campaignId);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: campaignId.length > 0,
    retry: false,
  });

  const calendar = data?.calendar_plan ?? null;
  const dates = calendar ? Object.keys(calendar).sort() : [];

  return (
    <AppShell>
      <div className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-6 py-8">
          <div className="flex items-center gap-2">
            <ImagePlus className="size-4 text-primary" />
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Reference photos & image studio
            </h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Load a campaign to attach real reference photos for any day, or ask the agent to
            generate creative with its image model. Generation happens on the backend, so the chat
            agent no longer has to do it mid-conversation.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = input.trim();
              setCampaignId(trimmed);
              if (typeof window !== "undefined" && trimmed) {
                window.localStorage.setItem(STORAGE_KEY, trimmed);
              }
            }}
            className="mt-5 flex gap-2"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Paste a campaign id…"
              className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary/50"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
            >
              <Search className="size-3.5" /> Load
            </button>
          </form>

          {campaignId && isFetching ? (
            <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Loading campaign…
            </p>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-lg border border-destructive/35 bg-destructive/[0.07] px-3 py-2.5">
              <p className="flex items-start gap-2 text-[11px] text-destructive">
                <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                {(error as Error).message}
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-2 rounded-md border border-border bg-background/50 px-2.5 py-1 text-[11px] text-foreground hover:border-primary/50"
              >
                Retry
              </button>
            </div>
          ) : null}

          {data && dates.length === 0 ? (
            <p className="mt-6 text-xs text-muted-foreground">
              This campaign has no calendar days yet — approve its plan in chat first.
            </p>
          ) : null}

          {dates.length > 0 ? (
            <div className="mt-6 space-y-2">
              {dates.map((date) => (
                <DayRow
                  key={date}
                  campaignId={campaignId}
                  date={date}
                  day={calendar?.[date] ?? {}}
                  image={data?.generated_images?.[date] ?? null}
                  caption={data?.generated_captions?.[date] ?? null}
                  status={data?.asset_status?.[date] ?? null}
                  alwaysShowUpload
                  onChanged={() => void refetch()}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
