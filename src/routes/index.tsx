import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ChatView } from "@/components/chat/chat-view";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Autopilot — Autonomous Marketing Assistant" },
      {
        name: "description",
        content:
          "Chat with an autonomous marketing agent that plans campaigns, generates ad assets, allocates budget, and publishes on schedule.",
      },
      { property: "og:title", content: "Autopilot — Autonomous Marketing Assistant" },
      {
        property: "og:description",
        content:
          "Launch and steer ad campaigns in natural language. Plans, creative, and publish status render inline as you chat.",
      },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  return (
    <AppShell>
      <ChatView />
    </AppShell>
  );
}
