import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChatView } from "@/components/chat/chat-view";
import { ContentTimeline } from "@/components/workspace/content-timeline";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { useCampaignStatus } from "@/components/workspace/use-campaign-status";

const COLLAPSE_KEY = "autopilot.timeline.collapsed";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marketing Agent Workspace — Review & Approve Content" },
      {
        name: "description",
        content:
          "Chat with a marketing agent and review its social content calendar day by day — captions, ad copy variants, and image prompts ready to copy.",
      },
      { property: "og:title", content: "Marketing Agent Workspace — Review & Approve Content" },
      {
        property: "og:description",
        content:
          "A calm split-screen workspace: quiet chat on the left, your AI-generated content timeline on the right.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkspacePage,
});

function WorkspacePage() {
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [chatPending, setChatPending] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const handleCampaignId = useCallback((id: string) => {
    setCampaignId((prev) => (prev === id ? prev : id));
  }, []);

  const { data, isFetching, error, refetch } = useCampaignStatus(campaignId);
  const generating = chatPending || Boolean(data?.is_running);

  return (
    <div className="flex h-screen flex-col">
      <WorkspaceHeader campaignId={campaignId} status={data} generating={generating} />
      <main className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-[2] flex-col">
          <ChatView onCampaignId={handleCampaignId} onPendingChange={setChatPending} />
        </div>
        <ContentTimeline
          campaignId={campaignId}
          status={data}
          loading={isFetching}
          error={error ? (error as Error).message : null}
          collapsed={collapsed}
          onToggle={toggle}
          onChanged={() => void refetch()}
        />
      </main>
    </div>
  );
}
