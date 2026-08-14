import type { CampaignDay, CampaignStatus } from "./api";

type Bag = Record<string, unknown>;

function pick(bag: Bag | null | undefined, keys: string[]): unknown {
  if (!bag) return undefined;
  for (const key of keys) {
    const value = bag[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          const inner = pick(item as Bag, ["text", "copy", "variant", "body", "value", "name"]);
          return asString(inner) ?? "";
        }
        return "";
      })
      .filter((item) => item.length > 0);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.includes("\n")) {
      return trimmed
        .split("\n")
        .map((line) => line.replace(/^\s*(?:\d+[.)]|[-*])\s*/, "").trim())
        .filter((line) => line.length > 0);
    }
    return [trimmed];
  }
  if (value && typeof value === "object") {
    return asStringList(Object.values(value as Bag));
  }
  return [];
}

export type DayContent = {
  idea: string | null;
  platform: string | null;
  caption: string | null;
  variants: string[];
  imagePrompt: string | null;
  needsPhoto: boolean;
  hasContent: boolean;
};

export function readDay(
  day: CampaignDay | undefined | null,
  caption?: string | null,
  extraVariants?: unknown,
  extraImagePrompt?: unknown,
): DayContent {
  const bag = (day ?? {}) as Bag;
  const resolvedCaption =
    asString(pick(bag, ["caption", "post_caption", "copy", "text"])) ?? asString(caption);
  const variants = (() => {
    const inline = asStringList(
      pick(bag, ["ad_copy_variants", "ad_copy", "copy_variants", "variants", "ad_variants"]),
    );
    return inline.length > 0 ? inline : asStringList(extraVariants);
  })();
  const imagePrompt =
    asString(pick(bag, ["image_prompt", "imagePrompt", "prompt", "visual_prompt"])) ??
    asString(extraImagePrompt) ??
    asString(pick((extraImagePrompt ?? {}) as Bag, ["prompt", "image_prompt", "text"]));
  const idea = asString(pick(bag, ["idea", "concept", "theme", "hook"]));
  const platform = asString(pick(bag, ["platform", "channel"]));
  return {
    idea,
    platform,
    caption: resolvedCaption,
    variants,
    imagePrompt,
    needsPhoto: Boolean(pick(bag, ["needs_reference_photo", "needsReferencePhoto"])),
    hasContent: Boolean(resolvedCaption || variants.length > 0 || imagePrompt),
  };
}

/** Dates come from calendar_dates while the plan is still a draft. */
export function readDates(status: CampaignStatus | null | undefined): string[] {
  const set = new Set<string>();
  for (const date of status?.calendar_dates ?? []) {
    if (typeof date === "string" && date.trim()) set.add(date.trim());
  }
  for (const date of Object.keys(status?.calendar_plan ?? {})) set.add(date);
  return [...set].sort();
}


export type DayState = "empty" | "awaiting" | "approved" | "published";

export function readDayState(status: string | null | undefined, hasContent: boolean): DayState {
  const value = (status ?? "").toLowerCase();
  if (value.includes("publish")) return "published";
  if (value.includes("approve")) return "approved";
  if (!hasContent) return "empty";
  return "awaiting";
}

export type Strategy = {
  pillars: string[];
  tone: string | null;
  platforms: string[];
  summary: string | null;
};

export function readStrategy(status: CampaignStatus | null | undefined): Strategy {
  const bag = (status ?? {}) as unknown as Bag;
  const nested = (pick(bag, ["strategy", "plan", "campaign_plan", "brief"]) ?? {}) as Bag;
  const pillars = asStringList(
    pick(bag, ["content_pillars", "pillars"]) ?? pick(nested, ["content_pillars", "pillars"]),
  );
  const tone =
    asString(pick(bag, ["tone", "brand_tone", "voice"])) ??
    asString(pick(nested, ["tone", "brand_tone", "voice"]));
  const explicitPlatforms = asStringList(
    pick(bag, ["platforms", "platform_mix", "channels"]) ??
      pick(nested, ["platforms", "platform_mix", "channels"]),
  );
  const derived = new Set<string>();
  for (const day of Object.values(status?.calendar_plan ?? {})) {
    const platform = asString((day as Bag)["platform"]);
    if (platform) derived.add(platform);
  }
  const summary =
    asString(pick(bag, ["strategy_summary", "summary", "goal", "objective"])) ??
    asString(pick(nested, ["strategy_summary", "summary", "goal", "objective"]));
  return {
    pillars,
    tone,
    platforms: explicitPlatforms.length > 0 ? explicitPlatforms : [...derived],
    summary,
  };
}

export function formatDayDate(date: string) {
  const parts = date.split("-").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return date;
  const [year, month, day] = parts as [number, number, number];
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][parsed.getUTCDay()] ?? "";
  const monthName =
    [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ][parsed.getUTCMonth()] ?? "";
  return `${weekday} ${monthName} ${day}`;
}
