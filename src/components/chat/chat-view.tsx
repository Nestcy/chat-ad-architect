import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowUp, MessageSquarePlus, RotateCcw } from "lucide-react";
import { sendChat, type ChatTurn, type ToolCall } from "@/lib/api";
import { ToolCallCard } from "./tool-call-card";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "autopilot.chat.v1";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
};

const SUGGESTIONS = [
  "Launch a campaign for my coffee shop, $2000 budget, targeting young professionals",
  "Show me all my campaigns",
  "Reroute my latest campaign toward TikTok",
];

function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<{ text: string; message: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    if (!pending) textareaRef.current?.focus();
  }, [pending]);

  const run = useCallback(async (text: string, history: ChatMessage[]) => {
    const runId = ++runIdRef.current;
    setPending(true);
    setFailure(null);
    const turns: ChatTurn[] = [
      ...history,
      { id: "pending", role: "user" as const, content: text },
    ].map((message) => ({ role: message.role, content: message.content }));
    const result = await sendChat(turns);
    if (runId !== runIdRef.current) return;
    setPending(false);

    if (!result.ok) {
      setFailure({ text, message: result.error });
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: result.data.reply ?? "",
        toolCalls: result.data.tool_calls ?? [],
      },
    ]);
  }, []);

  const newConversation = useCallback(() => {
    runIdRef.current += 1;
    setMessages([]);
    setInput("");
    setFailure(null);
    setPending(false);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    textareaRef.current?.focus();
  }, []);


  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending) return;
      const history = messages;
      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: trimmed }]);
      setInput("");
      void run(trimmed, history);
    },
    [messages, pending, run],
  );

  const retry = useCallback(() => {
    if (!failure) return;
    const history = messages.slice(0, -1);
    void run(failure.text, history);
  }, [failure, messages, run]);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-8">
          {messages.length === 0 ? (
            <div className="pt-16">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                What should we run today?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Describe the campaign in plain language — budget, audience, business. The agent
                plans, generates assets, and schedules the publishes.
              </p>
              <div className="mt-6 space-y-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="block w-full rounded-lg border border-border bg-card/60 px-3.5 py-2.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) =>
                message.role === "user" ? (
                  <div key={message.id} className="flex justify-end">
                    <p className="max-w-[80%] rounded-2xl bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                      {message.content}
                    </p>
                  </div>
                ) : (
                  <div key={message.id} className="space-y-3">
                    {message.content ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {message.content}
                      </p>
                    ) : null}
                    {(message.toolCalls ?? []).map((toolCall, index) => (
                      <ToolCallCard
                        key={`${message.id}-${index}`}
                        toolCall={toolCall}
                        onQuickSend={send}
                      />
                    ))}
                  </div>
                ),
              )}

              {pending ? (
                <p className="animate-pulse text-sm text-muted-foreground">Thinking…</p>
              ) : null}

              {failure ? (
                <div className="rounded-lg border border-destructive/35 bg-destructive/[0.07] px-3 py-2.5">
                  <p className="flex items-start gap-2 text-[11px] text-destructive">
                    <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                    {failure.message}
                  </p>
                  <button
                    type="button"
                    onClick={retry}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-2.5 py-1 text-[11px] text-foreground transition-colors hover:border-primary/50"
                  >
                    <RotateCcw className="size-3" /> Retry
                  </button>
                </div>
              ) : null}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-6 py-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
            className="rounded-xl border border-border bg-card focus-within:border-primary/50"
          >
            <textarea
              ref={textareaRef}
              value={input}
              autoFocus
              rows={2}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send(input);
                }
              }}
              placeholder="Launch a campaign, check status, or reroute spend…"
              className="w-full resize-none bg-transparent px-3.5 pt-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
              <button
                type="button"
                onClick={newConversation}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <MessageSquarePlus className="size-3" /> New conversation
              </button>
              <button
                type="submit"
                disabled={pending || input.trim().length === 0}
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity",
                  (pending || input.trim().length === 0) && "opacity-40",
                )}
              >
                <ArrowUp className="size-4" />
              </button>
            </div>
          </form>
          <p className="mt-2 text-[11px] text-muted-foreground">
            This assistant allocates real ad spend. Review plans before they publish.
          </p>
        </div>
      </div>
    </div>
  );
}
