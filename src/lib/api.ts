import { API_BASE_URL, API_PROXY_PREFIX } from "./api-base";

export { API_BASE_URL };

export type ChatRole = "user" | "assistant";

export type ChatTurn = { role: ChatRole; content: string };

export type ToolCall = {
  name: string;
  arguments?: Record<string, unknown> | null;
  result?: ToolResult | null;
};

export type ToolResult = {
  campaign_id?: string | null;
  campaign_ids?: string[] | null;
  error?: string | null;
  [key: string]: unknown;
};

export type ChatResponse = {
  reply: string;
  tool_calls?: ToolCall[] | null;
};

export type GeneratedImage = {
  model?: string | null;
  url?: string | null;
  local_path?: string | null;
};

export type CampaignPlan = Record<string, unknown[] | null>;

export type CampaignStatus = {
  campaign_id: string;
  is_running?: boolean | null;
  campaign_plan?: CampaignPlan | null;
  budget_allocations?: Record<string, number> | null;
  generated_copy?: Record<string, string> | null;
  generated_images?: Record<string, GeneratedImage> | null;
  pending_reference_requests?: string[] | null;
  publish_schedule?: Record<string, string> | null;
  publishing_status?: Record<
    string,
    { status?: string | null; budget_allocated_usd?: number | null }
  > | null;
  logs?: string[] | null;
};

export type HubEvent = {
  id: number;
  campaign_id: string;
  event_type: string;
  payload?: Record<string, unknown> | null;
  source: string;
  created_at: string;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

const GENERIC_ERROR = "Something went wrong reaching the server — try again.";

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_PROXY_PREFIX}${path}`, init);
    if (!response.ok) {
      return { ok: false, error: `Server responded ${response.status}. ${GENERIC_ERROR}` };
    }
    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }
}

export function sendChat(messages: ChatTurn[]) {
  return request<ChatResponse>("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
}

export function fetchCampaignStatus(campaignId: string) {
  return request<CampaignStatus>(`/api/campaign/${encodeURIComponent(campaignId)}/status`);
}

export function uploadReferenceImage(campaignId: string, assetId: string, file: File) {
  const form = new FormData();
  form.append("asset_id", assetId);
  form.append("file", file);
  return request<Record<string, unknown>>(
    `/api/campaign/${encodeURIComponent(campaignId)}/reference-image`,
    { method: "POST", body: form },
  );
}

export function fetchHub() {
  return request<{ events: HubEvent[] }>("/api/hub");
}

export function fetchCampaignTimeline(campaignId: string) {
  return request<{ events: HubEvent[] }>(
    `/api/campaign/${encodeURIComponent(campaignId)}/timeline`,
  );
}
