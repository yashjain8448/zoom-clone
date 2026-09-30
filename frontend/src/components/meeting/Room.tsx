"use client";

import { useCallback, useState } from "react";
import { useCameraPreview } from "@/hooks/useCameraPreview";
import { usePoll } from "@/hooks/usePoll";
import { api } from "@/lib/api";
import type { MeetingSession } from "@/lib/session";
import ControlBar from "./ControlBar";
import LeaveDialog from "./LeaveDialog";
import ParticipantsPanel from "./ParticipantsPanel";
import RoomMessage, { primaryBtn, secondaryBtn } from "./RoomMessage";
import RoomTopBar from "./RoomTopBar";
import VideoTile from "./VideoTile";

const POLL_MS = 3000;

/** Complete class strings (Tailwind can't build them dynamically). */
function gridClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count <= 4) return "grid-cols-1 sm:grid-cols-2";
  if (count <= 9) return "grid-cols-2 lg:grid-cols-3";
  return "grid-cols-2 lg:grid-cols-4";
}

interface Props {
  code: string;
  session: MeetingSession;
  /** Clears the session and navigates. Owned by the gate so it can guard the redirect. */
  onExit: (to: string) => void;
}

export default function Room({ code, session, onExit }: Props) {
  const fetchMeeting = useCallback((s: AbortSignal) => api.getMeeting(code, s), [code]);
  const fetchParticipants = useCallback((s: AbortSignal) => api.getParticipants(code, s), [code]);
  const meetingPoll = usePoll(fetchMeeting, POLL_MS);
  const participantsPoll = usePoll(fetchParticipants, POLL_MS);

  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  // Host controls
  const [hiddenIds, setHiddenIds] = useState<number[]>([]); // removed rows, hidden until the poll agrees
  const [hostBusy, setHostBusy] = useState(false);
  const [hostError, setHostError] = useState<string | null>(null);

  const { videoRef, status: camera } = useCameraPreview(!videoOff);

  const meeting = meetingPoll.data;
  const participants = participantsPoll.data;
  const isHost = session.role === "host";

  // Adopt a mute the *server* changed (the host's "Mute all"). Local clicks win instantly;
  // this only fires when the polled value itself changes. Setting state during render
  // (guarded by a comparison) is React's sanctioned alternative to effect + setState.
  const serverMuted = participants?.find((p) => p.id === session.participantId)?.is_muted;
  const [seenServerMuted, setSeenServerMuted] = useState<boolean | undefined>(serverMuted);
  if (serverMuted !== seenServerMuted) {
    setSeenServerMuted(serverMuted);
    if (serverMuted !== undefined) setMuted(serverMuted);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    api.updateMedia(code, session.participantId, { is_muted: next }).catch(() => {});
  }

  function toggleVideo() {
    const next = !videoOff;
    setVideoOff(next);
    api.updateMedia(code, session.participantId, { is_video_off: next }).catch(() => {});
  }

  async function leave() {
    if (leaving) return;
    setLeaving(true);
    try {
      await api.leave(code, session.participantId);
    } catch {
      /* best effort: we leave the room regardless */
    }
    onExit("/");
  }

  async function endForAll() {
    if (leaving) return;
    setLeaving(true);
    setLeaveError(null);
    try {
      await api.end(code, session.participantId);
      onExit("/");
    } catch (err) {
      setLeaveError(err instanceof Error ? err.message : "Could not end the meeting.");
      setLeaving(false);
    }
  }

  async function muteAll() {
    if (hostBusy) return;
    setHostBusy(true);
    setHostError(null);
    try {
      await api.muteAll(code, session.participantId);
    } catch (err) {
      setHostError(err instanceof Error ? err.message : "Could not mute everyone.");
    } finally {
      setHostBusy(false);
    }
  }

  async function removeParticipant(id: number) {
    setHostError(null);
    try {
      await api.removeParticipant(code, id, session.participantId);
      setHiddenIds((ids) => [...ids, id]); // only hide once the server accepted it
    } catch (err) {
      setHostError(err instanceof Error ? err.message : "Could not remove the participant.");
    }
  }

  // ---------- states before the room itself ----------
  if (leaving) return <RoomMessage title="Leaving meeting…" />;

  if (!meeting || !participants) {
    const error = meetingPoll.error ?? participantsPoll.error;
    if (!error) return <RoomMessage title="Joining meeting…" />;
    return (
      <RoomMessage title="Can't reach the meeting" body={error.message}>
        <button type="button" onClick={() => onExit("/")} className={primaryBtn}>
          Back to home
        </button>
      </RoomMessage>
    );
  }

  if (meeting.status === "ended") {
    return (
      <RoomMessage title="This meeting has ended">
        <button type="button" onClick={() => onExit("/")} className={primaryBtn}>
          Back to home
        </button>
      </RoomMessage>
    );
  }

  const me = participants.find((p) => p.id === session.participantId);
  if (!me) {
    return (
      <RoomMessage
        title="You're no longer in this meeting"
        body="You may have left, or the host removed you."
      >
        <button type="button" onClick={() => onExit(`/j/${code}`)} className={primaryBtn}>
          Rejoin
        </button>
        <button type="button" onClick={() => onExit("/")} className={secondaryBtn}>
          Back to home
        </button>
      </RoomMessage>
    );
  }

  // Our own mic/camera state comes from local state (instant), everyone else's from the poll.
  const roster = participants
    .filter((p) => !hiddenIds.includes(p.id))
    .map((p) => (p.id === me.id ? { ...p, is_muted: muted, is_video_off: videoOff } : p));
  const reconnecting = meetingPoll.error !== null || participantsPoll.error !== null;

  return (
    <div className="flex h-dvh flex-col bg-[#1a1a1a] text-white">
      <RoomTopBar
        code={code}
        title={meeting.title}
        displayCode={meeting.display_code}
        startedAt={meeting.started_at ?? me.joined_at}
      />

      {reconnecting && (
        <div role="status" className="bg-amber-400 px-3 py-1 text-center text-sm font-bold text-black">
          Connection lost. Reconnecting…
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <main className={`grid min-h-0 flex-1 auto-rows-fr gap-2 overflow-y-auto p-2 ${gridClass(roster.length)}`}>
          {roster.map((p) => {
            const self = p.id === me.id;
            return (
              <VideoTile
                key={p.id}
                id={p.id}
                name={p.display_name}
                isSelf={self}
                isHost={p.role === "host"}
                muted={p.is_muted}
                showVideo={self && camera === "on"}
                videoRef={self ? videoRef : undefined}
              />
            );
          })}
        </main>

        {panelOpen && (
          <ParticipantsPanel
            participants={roster}
            selfId={me.id}
            isHost={isHost}
            busy={hostBusy}
            error={hostError}
            onMuteAll={muteAll}
            onRemove={removeParticipant}
            onClose={() => setPanelOpen(false)}
          />
        )}
      </div>

      <ControlBar
        muted={muted}
        videoOff={videoOff}
        participantCount={roster.length}
        panelOpen={panelOpen}
        isHost={isHost}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onTogglePanel={() => setPanelOpen((v) => !v)}
        onLeave={() => setLeaveOpen(true)}
      />

      {leaveOpen && (
        <LeaveDialog
          isHost={isHost}
          busy={leaving}
          error={leaveError}
          onLeave={leave}
          onEnd={endForAll}
          onClose={() => setLeaveOpen(false)}
        />
      )}
    </div>
  );
}