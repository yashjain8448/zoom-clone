"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useBrowserTimezone, useDefaultStart } from "@/hooks/useBrowserDefaults";
import { useFetch } from "@/hooks/useFetch";
import { api } from "@/lib/api";
import { COMMON_ZONES, zoneLabel, zonedDateTimeToUtc } from "@/lib/datetime";
import type { Meeting } from "@/lib/types";
import FormRow, { fieldClass } from "./FormRow";
import ScheduleSuccess from "./ScheduleSuccess";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

export default function ScheduleForm() {
  const { data: me } = useFetch(api.getMe);
  const browserZone = useBrowserTimezone();
  const defaultStart = useDefaultStart();

  // `typed ?? default`: null means the user hasn't touched the field yet, so we show the
  // derived default instead of copying it into state from an effect.
  const [typedTitle, setTypedTitle] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [typedDate, setTypedDate] = useState<string | null>(null);
  const [typedTime, setTypedTime] = useState<string | null>(null);
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [typedZone, setTypedZone] = useState<string | null>(null);
  const [passcode, setPasscode] = useState("");
  const [invitees, setInvitees] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Meeting | null>(null);

  const title = typedTitle ?? (me ? `${me.name}'s Meeting` : "");
  const date = typedDate ?? defaultStart.slice(0, 10);
  const time = typedTime ?? defaultStart.slice(11);
  const zone = typedZone ?? browserZone;

  const zoneOptions = useMemo(() => {
    const zones = COMMON_ZONES.includes(browserZone) ? [...COMMON_ZONES] : [browserZone, ...COMMON_ZONES];
    return zones.map((value) => ({ value, label: zoneLabel(value) }));
  }, [browserZone]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const start = zonedDateTimeToUtc(date, time, zone);
    if (!start) {
      setError("Choose a date and time.");
      return;
    }
    const duration = hours * 60 + minutes;
    if (duration === 0) {
      setError("Choose a duration.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const meeting = await api.schedule({
        title: title.trim(),
        description: description.trim() || undefined, // blank -> omitted
        scheduled_start: start.toISOString(),
        duration_minutes: duration,
        timezone: zone,
        passcode: passcode.trim() || undefined, // blank -> server generates one
        invitees: invitees.split(/[\s,;]+/).filter(Boolean),
      });
      setCreated(meeting);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule the meeting.");
      setSubmitting(false);
    }
  }

  if (created) return <ScheduleSuccess meeting={created} />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Schedule meeting</h1>

      <form onSubmit={handleSubmit} className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white px-6">
        <FormRow label="Topic" htmlFor="topic">
          <input
            id="topic"
            value={title}
            onChange={(e) => setTypedTitle(e.target.value)}
            maxLength={200}
            className={`${fieldClass} w-full`}
          />
        </FormRow>

        <FormRow label="Description" htmlFor="description">
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Description (optional)"
            className={`${fieldClass} h-auto w-full py-2`}
          />
        </FormRow>

        <FormRow label="When" htmlFor="date">
          <div className="flex flex-wrap gap-3">
            <input
              id="date"
              type="date"
              required
              value={date}
              onChange={(e) => setTypedDate(e.target.value)}
              className={fieldClass}
            />
            <input
              aria-label="Start time"
              type="time"
              required
              value={time}
              onChange={(e) => setTypedTime(e.target.value)}
              className={fieldClass}
            />
          </div>
        </FormRow>

        <FormRow label="Duration" htmlFor="duration-hours">
          <div className="flex items-center gap-2 text-sm">
            <select
              id="duration-hours"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className={fieldClass}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span>hr</span>
            <select
              aria-label="Duration minutes"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className={fieldClass}
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <span>min</span>
          </div>
        </FormRow>

        <FormRow
          label="Time zone"
          htmlFor="timezone"
          hint="The date and time above are read in this time zone."
        >
          <select
            id="timezone"
            value={zone}
            onChange={(e) => setTypedZone(e.target.value)}
            className={`${fieldClass} w-full max-w-sm`}
          >
            {zoneOptions.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </select>
        </FormRow>

        <FormRow label="Meeting ID" htmlFor="meeting-id-note">
          <p id="meeting-id-note" className="pt-2 text-sm text-muted">
            Generated automatically when you save.
          </p>
        </FormRow>

        <FormRow
          label="Passcode"
          htmlFor="passcode"
          hint="4 to 10 characters. Leave blank to generate one."
        >
          <input
            id="passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            maxLength={10}
            autoComplete="off"
            className={`${fieldClass} w-full max-w-xs`}
          />
        </FormRow>

        <FormRow
          label="Invitees"
          htmlFor="invitees"
          hint="Email addresses separated by commas or spaces. Invitees see the meeting in their Upcoming list."
        >
          <input
            id="invitees"
            value={invitees}
            onChange={(e) => setInvitees(e.target.value)}
            placeholder="name@example.com, other@example.com"
            className={`${fieldClass} w-full`}
          />
        </FormRow>

        <div className="space-y-3 py-5">
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex gap-3 md:pl-[184px]">
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="h-10 rounded-lg bg-zoom-blue px-6 font-bold text-white hover:bg-zoom-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
            <Link
              href="/"
              className="grid h-10 place-items-center rounded-lg px-5 font-bold text-zoom-blue hover:bg-surface"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}