const pad = (n: number) => String(n).padStart(2, "0");

/** Common IANA zones. The browser's own zone is added to the list at runtime. */
export const COMMON_ZONES: readonly string[] = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

/** "YYYY-MM-DDTHH:mm" in the browser's local zone, rounded up to the next :00 or :30. */
export function defaultStartLocal(now: Date = new Date()): string {
  const d = new Date(now);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60); // 60 rolls over into the next hour or day
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/** The wall-clock time a zone shows at instant `ts`, re-expressed as a UTC timestamp. */
function wallClockInZone(ts: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23", // avoids "24:00" at midnight
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(new Date(ts));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
}

/**
 * Interprets "2026-10-15" + "09:00" as wall-clock time in `timeZone` and returns the UTC instant.
 * Two passes: the zone's offset at the guessed instant may differ from its offset at the
 * real one when a DST change falls in between. Returns null for malformed input.
 * (Nonexistent or ambiguous DST times resolve to a nearby valid instant.)
 */
export function zonedDateTimeToUtc(date: string, time: string, timeZone: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;

  const wall = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
  let utc = wall - (wallClockInZone(wall, timeZone) - wall);
  utc = wall - (wallClockInZone(utc, timeZone) - utc);
  return new Date(utc);
}

/** Offset of `timeZone` from UTC in minutes at instant `ts` (e.g. Kolkata = 330). */
function offsetMinutes(ts: number, timeZone: string): number {
  return Math.round((wallClockInZone(ts, timeZone) - ts) / 60_000);
}

/** "(GMT+5:30) Kolkata". The offset is computed, not taken from Intl's wording, so the
 * server and the browser always render the identical string (no hydration mismatch). */
export function zoneLabel(zone: string, at: number = Date.now()): string {
  const mins = offsetMinutes(at, zone);
  const sign = mins < 0 ? "-" : "+";
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const offset = m ? `GMT${sign}${h}:${pad(m)}` : `GMT${sign}${h}`;
  const city = zone === "UTC" ? "UTC" : (zone.split("/").pop() ?? zone).replace(/_/g, " ");
  return `(${offset}) ${city}`;
}

/** "Thursday, October 15, 2026 at 9:00 AM EDT", rendered in the given zone. */
export function formatInZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

/** 90 -> "1 hr 30 min" */
export function formatDuration(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return [h ? `${h} hr` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
}