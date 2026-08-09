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

/** Backend may return either a plain URL string or an object per day. */
export type GeneratedImage =
  | string
  | {
      model?: string | null;
      url?: string | null;
      local_path?: string | null;
      [key: string]: unknown;
    };

export function imageUrl(image: GeneratedImage | null | undefined): string | null {
  if (!image) return null;
  if (typeof image === "string") return image.startsWith("http") ? image : null;
  return typeof image.url === "string" && image.url.length > 0 ? image.url : null;
}

export function imageFallbackLabel(image: GeneratedImage | null | undefined): string | null {
  if (!image) return null;
  if (typeof image === "string") return image;
  return typeof image.local_path === "string" ? image.local_path : null;
}

export type PlanStatus = "draft" | "approved" | string;

export type CampaignDay = {
  idea?: string | null;
  platform?: string | null;
  needs_reference_photo?: boolean | null;
  [key: string]: unknown;
};

export type CampaignStatus = {
  campaign_id: string;
  is_running?: boolean | null;
  plan_status?: PlanStatus | null;
  calendar_plan?: Record<string, CampaignDay> | null;
  generated_captions?: Record<string, string> | null;
  generated_images?: Record<string, GeneratedImage> | null;
  asset_status?: Record<string, string> | null;
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
    const text = await response.text();
    if (!response.ok) {
      let detail = "";
      try {
        const parsed = JSON.parse(text) as { detail?: unknown; error?: unknown };
        const raw = parsed.detail ?? parsed.error;
        if (typeof raw === "string") detail = ` ${raw}`;
      } catch {
        /* keep generic message */
      }
      return { ok: false, error: `Server responded ${response.status}.${detail || ` ${GENERIC_ERROR}`}` };
    }
    return { ok: true, data: (text ? JSON.parse(text) : {}) as T };
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }
}

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const id = (value: string) => encodeURIComponent(value);

export function sendChat(messages: ChatTurn[]) {
  return request<ChatResponse>("/api/chat", json({ messages }));
}

export function fetchCampaignStatus(campaignId: string) {
  return request<CampaignStatus>(`/api/campaign/${id(campaignId)}/status`);
}

export function approvePlan(campaignId: string) {
  return request<Record<string, unknown>>(`/api/campaign/${id(campaignId)}/plan/approve`, {
    method: "POST",
  });
}

export function refinePlan(campaignId: string, feedback: string) {
  return request<Record<string, unknown>>(
    `/api/campaign/${id(campaignId)}/plan/refine`,
    json({ feedback }),
  );
}

/** Triggers the backend's GenAI image + caption generation for one calendar day. */
export function generateDay(campaignId: string, date: string) {
  return request<Record<string, unknown>>(
    `/api/campaign/${id(campaignId)}/day/${id(date)}/generate`,
    { method: "POST" },
  );
}

export function approveDay(campaignId: string, date: string) {
  return request<Record<string, unknown>>(
    `/api/campaign/${id(campaignId)}/day/${id(date)}/approve`,
    { method: "POST" },
  );
}

export function tweakDay(campaignId: string, date: string, feedback: string) {
  return request<Record<string, unknown>>(
    `/api/campaign/${id(campaignId)}/day/${id(date)}/tweak`,
    json({ feedback }),
  );
}

export function uploadReferenceImage(campaignId: string, date: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return request<Record<string, unknown>>(
    `/api/campaign/${id(campaignId)}/day/${id(date)}/reference-image`,
    { method: "POST", body: form },
  );
}

export function fetchHub() {
  return request<{ events: HubEvent[] }>("/api/hub");
}

export function fetchCampaignTimeline(campaignId: string) {
  return request<{ events: HubEvent[] }>(`/api/campaign/${id(campaignId)}/timeline`);
}
