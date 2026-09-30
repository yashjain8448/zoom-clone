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
    <>
      <div className="mx-auto grid max-w-6xl gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[auto_1fr] lg:gap-y-10">
        <section aria-label="Quick actions" className="space-y-3 lg:col-start-1 lg:row-start-1">
          <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:gap-6">
            <ActionTile
              label={starting ? "Starting…" : "New meeting"}
              icon={Video}
              color="orange"
              onClick={startInstantMeeting}
              disabled={starting}
            />
            <ActionTile label="Join" icon={Plus} color="blue" onClick={() => setJoinOpen(true)} />
            <ActionTile label="Schedule" icon={Calendar} color="blue" onClick={() => router.push("/schedule")} />
            <ActionTile label="Share screen" icon={ScreenShare} color="blue" />
          </div>
          {startError && (
            <p role="alert" className="text-sm text-red-600">
              {startError}
            </p>
          )}
        </section>

        <aside className="space-y-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <div className="hidden lg:block">
            <Clock />
          </div>
          <MeetingList title="Upcoming" state={upcoming} emptyText="No upcoming meetings scheduled." />
        </aside>

        <div className="lg:col-start-1 lg:row-start-2 lg:self-start">
          <MeetingList title="Recent" state={recent} emptyText="No recent meetings yet." />
        </div>
      </div>

      {joinOpen && <JoinModal onClose={() => setJoinOpen(false)} />}
    </>
  );
}