# Reference Photo Uploads + Image Generation Controls

## What I found first (important)

Your Railway backend has changed shape since this frontend was built. It is now **v3.0.0 — "Autonomous Marketing Engine"**, a day-by-day calendar with approval gates. The current UI is still written for the old asset-based API, so most cards render empty and uploads point at an endpoint that no longer exists.

Live endpoints today:

```text
POST /api/campaign/start
POST /api/campaign/{id}/plan/approve
POST /api/campaign/{id}/plan/refine        { feedback }
POST /api/campaign/{id}/day/{date}/generate
POST /api/campaign/{id}/day/{date}/approve
POST /api/campaign/{id}/day/{date}/tweak   { feedback }
POST /api/campaign/{id}/day/{date}/reference-image   multipart: file
GET  /api/campaign/{id}/status
GET  /api/campaign/{id}/timeline
GET  /api/hub
POST /api/chat
```

Status now returns `plan_status`, `calendar_plan` (keyed by date, each with `idea`, `platform`, `needs_reference_photo`), `generated_captions`, `generated_images`, `asset_status` (e.g. `pending_generation`), `logs`. There is no `pending_reference_requests`, no `asset_id`, no budget/publishing blocks.

On the 500: reference photos are uploaded **per date**, not per asset, and the frontend is posting to the removed per-asset URL — so that path fails from the UI regardless of the model. Separately, the campaign log for `chat-1d472b89` shows the backend's own planner LLM call failing (`tool_use_failed`) and falling back to a repeating pattern. Frontend work fixes the upload path and gives the agent a way to trigger generation; a failure that originates inside the backend's model call still has to be fixed on Railway.

## What gets built

### 1. Dedicated reference photo screen (`/uploads`)
- Campaign picker at the top (campaign ids pulled from `/api/hub`).
- Grid of every calendar day where `needs_reference_photo` is true, showing date, platform badge, the day's idea, caption if generated, and current `asset_status`.
- Each card has its own drop zone / file picker → `POST /api/campaign/{id}/day/{date}/reference-image` with `file`. Preview thumbnail of the chosen file, uploading state, success state, per-card error text.
- Also a single large "bulk drop" panel: drop several images at once and assign each to a day from a dropdown before sending.
- Days with an image already in `generated_images` show the image instead of a drop zone, with a "Replace photo" action.

### 2. Image generation controls
- Per-day "Generate image" button → `POST /api/campaign/{id}/day/{date}/generate`, then re-poll status so the new entry in `generated_images` / `asset_status` appears in place. Backend uses its own Google GenAI key; the frontend only triggers and displays.
- "Regenerate with feedback" opens a small inline field → `POST .../day/{date}/tweak` with `feedback`.
- Plan-level gate surfaced: when `plan_status` is `draft`, show Approve plan / Refine plan (with feedback) buttons, and make clear daily generation only runs after approval.
- Day approve action → `POST .../day/{date}/approve`.

### 3. Bring the existing UI onto the v3 contract
- Rewrite `src/lib/api.ts` types and helpers for the endpoint list above (drop `asset_id`, add day-level calls, `plan_status`, `calendar_plan`, `asset_status`).
- Campaign card in chat: replace the week-1–4 grid with a date-ordered calendar list (idea, platform, needs-photo flag, caption, image, asset status), keep the 3s polling, keep the agent log, drop the budget/publishing sections that the backend no longer returns.
- Reference-photo cards inside chat reuse the same day-based upload component as `/uploads`.
- `/uploads` added to the top nav next to Chat and Hub.

Error handling stays as-is: every call returns a typed ok/error result and failures render inline, never throwing into the UI.

## Technical notes
- All browser calls keep going through the existing same-origin proxy (`/api/proxy/*` → `API_BASE_URL`), so multipart uploads need the proxy to forward `multipart/form-data` bodies and the `content-type` boundary unchanged — the current forwarder already passes the raw body and content-type through.
- New: `src/routes/uploads.tsx` (own head metadata), `src/components/uploads/day-upload-card.tsx`, `src/components/uploads/bulk-drop-panel.tsx`, `src/components/campaign/day-row.tsx`.
- Edited: `src/lib/api.ts`, `src/components/chat/campaign-status-panel.tsx`, `src/components/chat/reference-upload.tsx`, `src/components/chat/tool-call-card.tsx`, `src/components/app-shell.tsx`.
- Mutations use TanStack Query with invalidation of the `["campaign-status", id]` key so a generate/upload immediately refreshes the day.
- Dark Linear-style styling and existing tokens throughout; no new colors hardcoded.
