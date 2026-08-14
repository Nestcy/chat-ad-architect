# Fix: strategy and day content never render in the Content Timeline

I pulled a live campaign (`chat-e1d206c4`) from the backend and compared the real payload with what the timeline reads. The shapes don't match — the panel is looking in the wrong places, so the strategy card renders empty and no day cards appear at all, leaving nothing to approve or tweak.

## What the backend actually returns

```text
{
  campaign_id, is_running, plan_status: "draft",
  strategy_outline: { content_pillars: [...], tone: "...", platform_mix: "LinkedIn and X ...", notes: "..." },
  calendar_dates: ["2026-08-14", "2026-08-15", "2026-08-16"],
  calendar_plan: {},              // empty until each day is generated
  generated_captions: {},         // keyed by date
  ad_copy_variants: {},           // keyed by date
  image_prompts: {},              // keyed by date
  asset_status: {}, logs: [...]
}
```

Current reader looks for `strategy` / `plan` / `campaign_plan` / `brief` (never `strategy_outline`) and builds the day list only from `calendar_plan` keys — which are empty while the plan is a draft. That's exactly the mismatch you're seeing.

## Fixes

1. **Read the real strategy.** Add `strategy_outline` to the nested lookup, map `platform_mix` (a sentence, not a list) to the platform display, and surface `notes` as the strategy summary text. Platform chips fall back to splitting the `platform_mix` sentence on commas/"and" so chips stay meaningful.
2. **Build the day list from `calendar_dates`.** Union `calendar_dates` with `calendar_plan` keys, sorted. Draft campaigns then show three date cards immediately instead of "No calendar days yet".
3. **Read day content from the top-level date maps.** Merge `generated_captions[date]`, `ad_copy_variants[date]`, and `image_prompts[date]` into each day, still preferring per-day fields inside `calendar_plan[date]` when present.
4. **Never hide the approve/tweak controls.** The strategy card always renders its "Approve Plan" / "Request Changes" buttons whenever a campaign is loaded, even with zero pillars — with a short line explaining the plan is still an outline. Day cards keep Approve/Tweak available on empty days too (Tweak sends feedback for that date), so a card with no generated content is still actionable.
5. **Make a campaign selectable.** Today the timeline only binds to a campaign when a tool result carries `campaign_id`; `list_campaigns` returns `campaign_ids`, so asking "show my campaigns" leaves the pane empty. Add to the timeline header a small campaign selector: any ids seen in chat tool results (`campaign_id` or `campaign_ids`) plus a text field to paste an id directly, persisted in localStorage so a refresh keeps the campaign.

## Technical notes

- `src/lib/campaign-shape.ts`: extend `readStrategy` (`strategy_outline`, `platform_mix`, `notes`), add a `readDates(status)` helper, and extend `readDay` to accept caption/variants/prompt passed in from the top-level maps.
- `src/lib/api.ts`: add `strategy_outline`, `calendar_dates`, `ad_copy_variants`, `image_prompts` to the `CampaignStatus` type.
- `src/components/workspace/content-timeline.tsx`: dates from `readDates`, pass per-date variants/prompt into `DayCard`, add the campaign selector control.
- `src/components/workspace/strategy-summary-card.tsx` and `day-card.tsx`: always show action buttons; empty-state copy instead of blank sections.
- `src/components/chat/chat-view.tsx`: also report ids from `campaign_ids`.
- No backend or endpoint changes; approve/refine/tweak endpoints stay as they are.
