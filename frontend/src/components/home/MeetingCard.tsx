import { endFromDuration, formatDayLabel, formatTimeRange } from "@/lib/format";
import type { Meeting } from "@/lib/types";

export default function MeetingCard({ meeting }: { meeting: Meeting }) {
  // Upcoming meetings have scheduled_start; ended ones have started_at/ended_at.
  const startIso = meeting.started_at ?? meeting.scheduled_start;
  if (!startIso) return null;
  const endIso =
    meeting.ended_at ?? endFromDuration(startIso, meeting.duration_minutes);

  return (
    <li className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5">
      <div className="w-20 shrink-0 text-sm font-bold text-muted sm:w-24">
        {formatDayLabel(startIso)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted">
          {formatTimeRange(startIso, endIso)}
        </p>
        <p className="truncate font-bold">{meeting.title}</p>
        <p className="text-sm text-muted">Meeting ID: {meeting.display_code}</p>
      </div>
    </li>
  );
}
