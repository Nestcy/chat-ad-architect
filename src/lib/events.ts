const EVENT_LABELS: Record<string, string> = {
  campaign_started: "Campaign started",
  plan_generated: "Plan generated",
  images_generated: "Images generated",
  reference_photo_requested: "Reference photo requested",
  reference_photo_uploaded: "Reference photo uploaded",
  campaign_rerouted: "Campaign rerouted",
  asset_published: "Asset published",
  cron_publish_run: "Daily publish ran",
  chat_message: "Chat message",
};

export function eventLabel(eventType: string) {
  const known = EVENT_LABELS[eventType];
  if (known) return known;
  const words = eventType.replace(/[_-]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function relativeTime(iso: string) {
  const then = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`).getTime();
  if (Number.isNaN(then)) return iso;
  const diff = Date.now() - then;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(then).toLocaleDateString();
}

export function absoluteTime(iso: string) {
  const date = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}
