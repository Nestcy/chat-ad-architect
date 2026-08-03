# Autonomous Marketing Platform — Chat Frontend

Dark, Linear-style desktop UI with two screens: a chat that renders structured results as inline cards, and a Hub activity feed. Backend: `https://web-production-5ce11.up.railway.app` (single `API_BASE_URL` constant).

## Screens

### Chat (`/`) — default
- Scrolling transcript, composer pinned at bottom, always-focused textarea.
- One ongoing conversation, persisted to localStorage so it restores on reload. "New conversation" button clears it.
- On send: POST `/api/chat` with the full history as `[{role, content}]`, including prior assistant replies.
- `reply` renders as a plain assistant message (no bubble background). Each `tool_calls` entry renders as a bordered, slightly elevated card below the text:
  - `start_campaign` — "Campaign Started" card with `campaign_id`, "Running..." status pill; becomes the live card (below).
  - `get_campaign_status` — plan (week_1–week_4 columns), generated images grid keyed by asset_id (graceful when `url`/`local_path` are null), pending reference requests.
  - `reroute_campaign` — compact "Campaign Updated — replanning" card.
  - `list_campaigns` — chips of `campaign_ids`; clicking one sends "show me campaign X".
  - Any `result.error` — subtle inline warning note inside the card; chat continues.
- Failed fetch or 500: inline error note in the transcript, the typed message is preserved with a Retry action.

### Live status polling
- After `start_campaign`, poll `GET /api/campaign/{id}/status` every 3s, stopping when `publishing_status` is populated or after 2 minutes.
- The existing campaign card updates in place (plan → copy/images → budget allocations → publish schedule → publishing status → logs). No new chat messages per tick.

### Reference photo upload
- Each `pending_reference_requests` asset_id gets its own small card: "This asset needs a real photo" plus drag-and-drop / file-picker.
- On select: `POST /api/campaign/{id}/reference-image` as multipart with `asset_id` + `file`. Optimistic "processing" state, remove from pending list, then re-poll status so the asset appears in the images grid. Upload errors surface on the card only.

### Hub (`/hub`)
- `GET /api/hub` → reverse-chronological event rows: source badge (cron gets a distinct clock treatment for overnight automation), readable `event_type` label, campaign_id link, relative timestamp.
- Labels mapped for: campaign_started, plan_generated, images_generated, reference_photo_requested, reference_photo_uploaded, campaign_rerouted, asset_published, cron_publish_run, chat_message. Unknown types fall back to a de-underscored title case.
- `/hub/$campaignId` → `GET /api/campaign/{id}/timeline` as a vertical timeline, most recent first.
- Loading skeletons and a retry-able error state for both.

## Design
Dark near-black surfaces, one restrained accent for status/actions, tight type scale, subtle 1px borders. Cards are visually distinct from assistant text: border, faint elevation, small monospace labels for ids and asset keys. Status pills for running/paused/published. Desktop-first layout with a slim top nav (Chat / Hub).

## Technical notes
- `src/lib/api.ts`: `API_BASE_URL` constant plus typed fetch helpers (chat, status, upload, hub, timeline) returning discriminated success/error results so no call can throw into the UI.
- Chat state in a single hook (`useCampaignChat`) owning messages, per-message tool-call cards, active campaign ids, and localStorage persistence keyed under one storage key.
- Polling via TanStack Query `refetchInterval` per active campaign card, disabled on completion/timeout.
- Chat UI built from AI Elements primitives (conversation, message, prompt-input, shimmer) with a custom transport calling this Railway API instead of the AI SDK route; cards are project components rendered from `tool_calls`.
- Routes: `src/routes/index.tsx` (chat), `src/routes/hub.index.tsx`, `src/routes/hub.$campaignId.tsx`, each with its own head metadata.
- No auth, no video UI, no image editing.
