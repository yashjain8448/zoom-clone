"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Plus, ScreenShare, Video } from "lucide-react";
import ActionTile from "@/components/home/ActionTile";
import Clock from "@/components/home/Clock";
import MeetingList from "@/components/home/MeetingList";
import JoinModal from "@/components/join/JoinModal";
import { useFetch } from "@/hooks/useFetch";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/session";

export default function HomePage() {
  const router = useRouter();
  const upcoming = useFetch(api.getUpcoming);
  const recent = useFetch(api.getRecent);

  const [joinOpen, setJoinOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  async function startInstantMeeting() {
    if (starting) return; // guards against double clicks creating two meetings
    setStarting(true);
    setStartError(null);
    try {
      const meeting = await api.createInstant();
      // The creator enters the room directly, as host, under their own name.
      const { participant } = await api.join(meeting.meeting_code, {
        display_name: meeting.host.name,
        as_host: true,
      });
      saveSession(meeting.meeting_code, {
        participantId: participant.id,
        displayName: participant.display_name,
        role: participant.role,
      });
      router.push(`/meeting/${meeting.meeting_code}`);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Could not start the meeting.");
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="space-y-10">
        <section aria-label="Quick actions" className="space-y-3">
          <div className="flex flex-wrap gap-6">
            <ActionTile
              label={starting ? "Starting…" : "New meeting"}
              icon={Video}
              color="orange"
              onClick={startInstantMeeting}
              disabled={starting}
            />
            <ActionTile label="Join" icon={Plus} color="blue" onClick={() => setJoinOpen(true)} />
            <ActionTile label="Schedule" icon={Calendar} color="blue" /> {/* Step 7 */}
            <ActionTile label="Share screen" icon={ScreenShare} color="blue" />
          </div>
          {startError && (
            <p role="alert" className="text-sm text-red-600">
              {startError}
            </p>
          )}
        </section>

        <MeetingList title="Recent" state={recent} emptyText="No recent meetings yet." />
      </div>

      <aside className="space-y-6">
        <Clock />
        <MeetingList title="Upcoming" state={upcoming} emptyText="No upcoming meetings scheduled." />
      </aside>

      {joinOpen && <JoinModal onClose={() => setJoinOpen(false)} />}
    </div>
  );
}