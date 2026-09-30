"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CircleCheck, Copy } from "lucide-react";
import { formatDuration, formatInZone } from "@/lib/datetime";
import type { Meeting } from "@/lib/types";

function invitationText(m: Meeting, when: string): string {
  return [
    `${m.host.name} is inviting you to a scheduled Zoom meeting.`,
    "",
    `Topic: ${m.title}`,
    `Time: ${when}`,
    "",
    `Join: ${m.invite_link}`,
    `Meeting ID: ${m.display_code}`,
    ...(m.passcode ? [`Passcode: ${m.passcode}`] : []),
  ].join("\n");
}

export default function ScheduleSuccess({ meeting }: { meeting: Meeting }) {
  const [copied, setCopied] = useState(false);
  const when = meeting.scheduled_start ? formatInZone(meeting.scheduled_start, meeting.timezone) : "";

  async function copyInvitation() {
    try {
      // Needs a secure context (HTTPS or localhost); can also be denied by the browser.
      await navigator.clipboard.writeText(invitationText(meeting, when));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const rows: [string, string][] = [
    ["Topic", meeting.title],
    ["When", when],
    ["Duration", formatDuration(meeting.duration_minutes)],
    ["Meeting ID", meeting.display_code],
    ["Passcode", meeting.passcode ?? "None"],
    ["Invite link", meeting.invite_link],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-3">
        <CircleCheck className="size-8 text-green-600" aria-hidden />
        <h1 className="text-2xl font-bold">Your meeting has been scheduled</h1>
      </div>

      <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white px-6">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 py-4 md:grid-cols-[160px_minmax(0,1fr)] md:gap-6">
            <dt className="text-sm font-bold">{label}</dt>
            <dd className="break-words text-sm">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={copyInvitation}
          className="flex h-10 items-center gap-2 rounded-lg bg-zoom-blue px-5 font-bold text-white hover:bg-zoom-blue-dark"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy invitation"}
        </button>
        <Link
          href="/"
          className="grid h-10 place-items-center rounded-lg border border-line px-5 font-bold text-zoom-blue hover:bg-surface"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}