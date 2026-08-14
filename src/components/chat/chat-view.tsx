import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowUp, MessageSquarePlus, RotateCcw, Sparkle } from "lucide-react";
import { sendChat, type ChatTurn, type ToolCall } from "@/lib/api";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "autopilot.chat.v1";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
};

const SUGGESTIONS = [
  "Plan a 3-day content calendar for my coffee shop",
  "Show me all my campaigns",
  "Make the captions shorter and warmer",
];

type Props = {
  onCampaignId?: (campaignId: string) => void;
  onCampaignIds?: (campaignIds: string[]) => void;
  onPendingChange?: (pending: boolean) => void;
};


function toolLabel(toolCall: ToolCall) {
  const name = toolCall.name.replace(/_/g, " ");
  const error = typeof toolCall.result?.["error"] === "string" ? toolCall.result["error"] : null;
  return { name, error };
}

export function ChatView({ onCampaignId, onPendingChange }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<{ text: string; message: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
      if (Array.isArray(parsed)) setMessages(parsed);
    } catch {
      /* ignore malformed history */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages, hydrated]);

  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);

  useEffect(() => {
    if (!onCampaignId) return;
    for (const message of [...messages].reverse()) {
      for (const call of message.toolCalls ?? []) {
        const id = call.result?.campaign_id;
        if (typeof id === "string" && id.length > 0) {
          onCampaignId(id);
          return;
        }
      }
    }
  }, [messages, onCampaignId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  const run = useCallback(async (text: string, history: ChatMessage[]) => {
    const runId = ++runIdRef.current;
    setPending(true);
    setFailure(null);
    const turns: ChatTurn[] = [...history, { id: "pending", role: "user" as const, content: text }].map(
      (message) => ({ role: message.role, content: message.content }),
    );
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
    window.localStorage.removeItem(STORAGE_KEY);
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
    <div className="flex h-full min-w-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="w-full px-5 py-6">
          {messages.length === 0 ? (
            <div className="pt-4">
              <p className="font-display text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Assistant
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/85">
                Describe what you want to post about. I'll draft a content calendar you can review,
                tweak, and approve on the right.
              </p>
              <div className="mt-5 space-y-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="block w-full rounded-lg border border-border/70 bg-card/50 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-accent-warm/40 hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((message) =>
                message.role === "user" ? (
                  <div key={message.id} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-xs leading-relaxed text-primary-foreground">
                      {message.content}
                    </p>
                  </div>
                ) : (
                  <div key={message.id} className="space-y-2">
                    {message.content ? (
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/85">
                        {message.content}
                      </p>
                    ) : null}
                    {(message.toolCalls ?? []).map((toolCall, index) => {
                      const { name, error } = toolLabel(toolCall);
                      return (
                        <p
                          key={`${message.id}-${index}`}
                          className={cn(
                            "flex items-start gap-1.5 text-[11px]",
                            error ? "text-warning" : "text-muted-foreground",
                          )}
                        >
                          {error ? (
                            <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                          ) : (
                            <Sparkle className="mt-0.5 size-3 shrink-0 text-accent-warm" />
                          )}
                          <span>{error ? `${name} — ${error}` : `${name} — see timeline`}</span>
                        </p>
                      );
                    })}
                  </div>
                ),
              )}

              {pending ? (
                <p className="animate-pulse text-xs text-muted-foreground">Thinking…</p>
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
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/50 px-2.5 py-1 text-[11px] text-foreground transition-colors hover:border-accent-warm/50"
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

      <div className="shrink-0 border-t border-border/70 px-5 py-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
          className="rounded-xl border border-border bg-card focus-within:border-accent-warm/50"
        >
          <textarea
            ref={textareaRef}
            value={input}
            rows={2}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask for changes, or request a new calendar…"
            className="w-full resize-none bg-transparent px-3 pt-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <button
              type="button"
              onClick={newConversation}
              className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
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
      </div>
    </div>
  );
}
