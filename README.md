# Campaign Companion

Build a chat-based frontend for an autonomous marketing platform. The backend is already built and deployed on Railway at:

https://YOUR-RAILWAY-APP.up.railway.app

Replace that URL with the real one before/after generating — store it as a single constant (e.g. API_BASE_URL) so it's easy to change later.

Core concept

This is a chat interface, not a form-based dashboard. The user talks to an assistant in natural language ("launch a campaign for my coffee shop, $2000 budget, targeting young professionals"), and the assistant's responses render as a mix of normal chat bubbles AND inline visual cards for anything structured (a campaign starting, a plan, generated images, a pending photo request, publish status). There's also a secondary "Hub" view showing a timeline of everything that's happened across all campaigns, including things the system did on its own overnight (scheduled daily publishes).

Screens

1. Chat view (primary/default screen)

Standard chat UI: message input at the bottom, scrolling history above.

On send, POST to ${API_BASE_URL}/api/chat with body:

{ "messages": [{"role": "user", "content": "..."}, ...] }


Send the FULL conversation history each time (this API is stateless per-call), formatted as [{role, content}] pairs — include prior assistant replies as role: "assistant".

The response looks like:

{  "reply": "assistant's text response",  "tool_calls": [    { "name": "start_campaign", "arguments": {...}, "result": {...} },    ...  ]}


Render reply as a normal assistant chat bubble.

For each entry in tool_calls, render an inline card BELOW the text bubble, based on name:

start_campaign → a "Campaign Started" card showing the result.campaign_id and a status pill ("Running..."). Store this campaign_id in local state — you'll need it for polling and for the reference-photo upload widget.

get_campaign_status → a status card showing result.campaign_plan (render week_1..week_4 as a simple 4-column or accordion layout), result.generated_images (image grid, keyed by asset_id — image bytes aren't returned directly, only local_path/url metadata, so just show what's available; treat missing/null gracefully), and result.pending_reference_requests (see below).

reroute_campaign → a small "Campaign Updated — replanning" card.

list_campaigns → a simple list/chips of result.campaign_ids, each clickable to say "show me campaign X" in chat.

Any result.error → render as a subtle inline error note, not a full failure state — the chat should keep going.

2. Live status polling after a campaign starts

Once a start_campaign tool_call has fired, poll: GET ${API_BASE_URL}/api/campaign/{campaign_id}/status every 3 seconds while the campaign is running (stop once publishing_status is populated, or after a reasonable timeout like 2 minutes). Update the same "Campaign Started" card in place as new data arrives — don't spam new chat messages for every poll tick, just update the card's contents live (plan appears, then images, then publish status).

The status response shape:

{
  "campaign_id": "...",
  "is_running": true,
  "campaign_plan": {"week_1": [...], "week_2": [...], ...} | null,
  "budget_allocations": {"facebook_ads": 0, "tiktok_ads": 0, "google_ads": 0} | null,
  "generated_copy": {"<asset_id>": "copy text", ...} | null,
  "generated_images": {"<asset_id>": {"model": "...", "url": null, "local_path": "..."}, ...} | null,
  "pending_reference_requests": ["<asset_id>", ...] | null,
  "publish_schedule": {"<asset_id>": "2026-08-03", ...} | null,
  "publishing_status": {"facebook": {"status": "PAUSED_MOCK", "budget_allocated_usd": 0}, ...} | null,
  "logs": ["[Planner] ...", ...]
}


3. Reference photo upload (important, don't skip)

Whenever pending_reference_requests has entries, show each as its own small card: "This asset needs a real photo: {asset_id}" with a drag/drop or file-picker upload widget attached. On file select, submit:

POST ${API_BASE_URL}/api/campaign/{campaign_id}/reference-image as multipart/form-data with fields: - asset_id: the asset_id string from pending_reference_requests - file: the image file

On success, remove that asset from the pending list in local state and show it moving into the generated images grid (re-poll status to get the real result, or optimistically show a "processing" state then refresh).

4. Hub view (secondary screen, reachable via a nav tab/button)

A simple activity feed / dashboard, separate from the chat:

Landing view: GET ${API_BASE_URL}/api/hub — a reverse-chronological list of recent events across ALL campaigns:

{ "events": [  {"id": 1, "campaign_id": "...", "event_type": "cron_publish_run",   "payload": {...}, "source": "cron", "created_at": "2026-08-02T09:00:00"},  ...]}


Render each event as a row: an icon/badge based on source (chat / cron / api / system — cron especially should look visually distinct, e.g. a small clock icon, since these are things that happened automatically overnight with no user present), the event_type as a readable label (e.g. "cron_publish_run" → "Daily publish ran"), the campaign_id, and a relative timestamp.

Clicking a campaign_id (or a "view campaign" link) opens a per-campaign timeline: GET ${API_BASE_URL}/api/campaign/{campaign_id}/timeline — same event shape, filtered to one campaign. Show this as a vertical timeline/history list, most recent first.

Known event_type values to have readable labels ready for: campaign_started, plan_generated, images_generated, reference_photo_requested, reference_photo_uploaded, campaign_rerouted, asset_published, cron_publish_run, chat_message.

Design direction

Clean, modern SaaS chat UI — think Linear/Vercel dashboard aesthetic, not a childish chatbot skin. Dark or light, your call, but should feel like a serious business tool since this is generating real ad spend decisions.

Cards embedded in chat should feel distinct from plain text bubbles — bordered, slightly elevated, clearly "this is a structured result" vs. "this is the assistant talking."

Mobile-responsive isn't critical for v1 — optimize for desktop.

Error handling

If any fetch to the backend fails (network error, 500, etc.), show a small inline error in the chat ("Something went wrong reaching the server — try again") rather than breaking the whole UI.

If /api/chat itself 500s, don't lose the user's typed message — let them retry.

Explicitly NOT in scope for this build

No authentication/login yet (backend doesn't have it) — build as if there's a single implicit user for now, no login screen.

No video generation UI anywhere — this platform is images only.

No editing of generated images in-app — just display them.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://chat-ad-architect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/25b47521-335f-4fb3-af59-27ee50e55af8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
