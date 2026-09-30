"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Copy } from "lucide-react";
import { useClipboard } from "@/hooks/useClipboard";
import { formatDuration } from "@/lib/datetime";
import { endFromDuration, formatTimeRange, meetingStart } from "@/lib/format";
import { invitationText } from "@/lib/invitation";
import type { Meeting } from "@/lib/types";

interface Props {
  meeting: Meeting;
  upcoming: boolean; // upcoming rows get Start/Join; previous rows don't
  isHost: boolean; // a UI hint only: the server verifies host rights on /join
}

export default function MeetingRow({ meeting, upcoming, isHost }: Props) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const { copied, copy } = useClipboard();

  const startIso = meetingStart(meeting);
  if (!startIso) return null;
  const endIso = meeting.ended_at ?? endFromDuration(startIso, meeting.duration_minutes);

  const details: [string, string][] = [
    ["Host", meeting.host.name],
    ["Duration", formatDuration(meeting.duration_minutes)],
    ["Meeting ID", meeting.display_code],
    ["Passcode", meeting.passcode ?? "None"],
    ["Invite link", meeting.invite_link],
  ];

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <p className="w-36 shrink-0 text-sm text-muted">{formatTimeRange(startIso, endIso)}</p>

        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{meeting.title}</p>
          <p className="text-sm text-muted">Meeting ID: {meeting.display_code}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {upcoming && (
            <Link
              href={isHost ? `/j/${meeting.meeting_code}?host=1` : `/j/${meeting.meeting_code}`}
              className="grid h-9 place-items-center rounded-lg bg-zoom-blue px-4 text-sm font-bold text-white hover:bg-zoom-blue-dark"
            >
              {isHost ? "Start" : "Join"}
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={detailsId}
            className="flex h-9 items-center gap-1 rounded-lg border border-line px-3 text-sm font-bold hover:bg-surface"
          >
            Details
            <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
          </button>
        </div>
      </div>

      {open && (
        <div id={detailsId} className="mt-4 rounded-xl bg-surface p-4">
          <dl className="space-y-2 text-sm">
            {details.map(([label, value]) => (
              <div key={label} className="grid gap-1 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-4">
                <dt className="font-bold">{label}</dt>
                <dd className="break-words">{value}</dd>
              </div>
            ))}
          </dl>
          <button
            type="button"
            onClick={() => copy(invitationText(meeting))}
            className="mt-4 flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-bold text-zoom-blue hover:bg-white/60"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy invitation"}
          </button>
        </div>
      )}
    </li>
  );
}