# Marketing Agent Workspace — split-screen redesign

Rebuild the main screen (`/`) as a two-pane workspace: a quiet chat control surface on the left, and a Content Timeline as the primary visual focus on the right. New warm dark design system (terracotta/amber, Space Grotesk + Inter).

## Screen structure

```text
+--------------------------------------------------------------+
| Campaign name          [status pill]   [generating…]         |
+---------------------------+----------------------------------+
| CHAT (40%)                | CONTENT TIMELINE (60%)  [ v ]    |
|  message list             |  Strategy Summary card           |
|  ...                      |  Day card — Aug 12               |
|                           |  Day card — Aug 13               |
|  [ input pinned bottom ]  |  Day card — Aug 14 (skeleton)    |
+---------------------------+----------------------------------+
```

- Header bar spans both panes: campaign name, status pill, and a subtle "generating…" indicator while the agent is working or a poll is in flight.
- Timeline pane collapses via a chevron in its header into a slim clickable vertical rail reading `Content Timeline (N days)`; expanding restores the 40/60 split. Collapse state persists in localStorage.
- The timeline follows the most recent campaign id seen in the conversation, polled every 3s while running (existing behavior, moved out of the chat bubbles).
- Chat keeps its current behavior: history in localStorage, new-conversation, retry on failure. Bubbles become quieter and smaller than today; tool-call cards no longer render a full campaign panel inline — they render a compact one-line reference that focuses the right pane.

## Strategy Summary card

- Content pillars as chips, tone as a short label, platform mix as small icon chips.
- Primary "Approve Plan" (calls the existing plan-approve endpoint) and secondary "Request Changes" which opens an inline textarea (existing plan-refine endpoint).
- Once approved, collapses to a slim one-line strip so day cards take priority.

## Day card

- Header row: date (Space Grotesk), platform chip, status badge.
- Small italic subtitle with the day's idea.
- Caption as the most prominent text block.
- "Show N variants" toggle expanding to a numbered list, each variant with its own copy-to-clipboard icon button.
- Image prompt in a distinct monospace block with a corner copy button — the visual anchor of the card.
- Inline note when the day flags a reference photo: "Consider using your own photo for this one instead of a generated image."
- Footer: "Approve" (primary) and "Tweak" (secondary, inline textarea) using existing day endpoints; after approval both collapse into a small "Edit" text-link.
- Days with no content yet render as a quiet skeleton showing only the date.
- Left-border accent: warm terracotta on awaiting-approval cards, fading to neutral gray when approved or published.

## Status badges

- Awaiting approval — amber fill, dark amber text, small dot.
- Approved — muted gray-green, low visual weight.
- Published — outline badge, charcoal/muted-terracotta border, warm-white text, checkmark.

## Design system

- `src/styles.css`: swap the palette to warm dark — near-black base with a radial/diagonal terracotta glow from one corner, lifted charcoal card surfaces, warm-white foreground, terracotta primary, amber secondary accent. Add tokens for badge states and the timeline accent.
- Fonts: load Space Grotesk + Inter in the root route head; Space Grotesk for headers/dates/labels, Inter for body.
- Generous vertical rhythm inside cards given the text density.

## Technical notes

- New components: `src/components/workspace/workspace-header.tsx`, `content-timeline.tsx`, `strategy-summary-card.tsx`, `day-card.tsx`, `status-badge.tsx`, `copy-button.tsx`; `src/routes/index.tsx` composes chat + timeline in a split layout.
- Ad copy variants, image prompt, pillars, tone, and platform mix are read defensively from the existing status payload (`calendar_plan[date]`, plan fields) with tolerant key lookups, so missing fields degrade to skeleton/hidden sections rather than errors.
- Reuses the existing API client and proxy; no backend or endpoint changes. The `/uploads` and `/hub` routes stay as they are, with the shared header restyled to the new system.
- No images rendered anywhere in the timeline; `image_prompt` is text + copy only.
- Also fixes the current hydration warning by reading persisted chat/collapse state after mount instead of during initial render.

## Out of scope

No auth, no campaign creation flow, no image rendering.
