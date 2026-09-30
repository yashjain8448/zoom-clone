import type { Meeting } from "./types";

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** "Today" | "Tomorrow" | "Yesterday" | "Wed, Oct 1", in the viewer's local timezone. */
export function formatDayLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  // Math.round absorbs the 23h/25h days around daylight-saving changes.
  const diff = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function formatTimeRange(startIso: string, endIso: string): string {
  return `${timeFmt.format(new Date(startIso))} – ${timeFmt.format(new Date(endIso))}`;
}

export function endFromDuration(startIso: string, minutes: number): string {
  return new Date(new Date(startIso).getTime() + minutes * 60_000).toISOString();
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/** When the meeting starts (or started): actual start if it happened, else the schedule. */
export function meetingStart(m: Meeting): string | null {
  return m.started_at ?? m.scheduled_start;
}

/** Groups consecutive items that fall on the same local calendar day. Input order is kept. */
export function groupByDay<T>(
  items: T[],
  getIso: (item: T) => string | null,
): { label: string; items: T[] }[] {
  const groups: { label: string; items: T[] }[] = [];
  for (const item of items) {
    const iso = getIso(item);
    if (!iso) continue;
    const label = formatDayLabel(iso);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}