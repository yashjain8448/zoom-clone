"use client";

import { useCallback, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Video, VideoOff } from "lucide-react";
import { useCameraPreview } from "@/hooks/useCameraPreview";
import { useFetch } from "@/hooks/useFetch";
import { api, ApiError } from "@/lib/api";
import { initials } from "@/lib/format";
import { saveSession } from "@/lib/session";

interface Props {
  code: string;
  asHost: boolean; // a hint from ?host=1; the server verifies it
}

const CAMERA_MESSAGES = {
  starting: "Starting camera…",
  off: "Your video is off",
  denied: "Camera access is blocked. Allow it in your browser settings, or join without video.",
  unavailable: "No camera available",
} as const;

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-surface p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-sm md:p-8">{children}</div>
    </div>
  );
}

export default function Lobby({ code, asHost }: Props) {
  const router = useRouter();
  const fetchMeeting = useCallback((signal: AbortSignal) => api.getMeeting(code, signal), [code]);
  const { data: meeting, error, loading, refetch } = useFetch(fetchMeeting);
  const { data: me } = useFetch(api.getMe);

  const [typedName, setTypedName] = useState<string | null>(null); // null = user hasn't typed yet
  const [videoOff, setVideoOff] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const { videoRef, status } = useCameraPreview(!videoOff);
  const displayName = typedName ?? me?.name ?? "";

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    const name = displayName.trim();
    if (!name || joining) return;
    setJoining(true);
    setJoinError(null);
    try {
      const { participant, meeting: joined } = await api.join(code, {
        display_name: name,
        as_host: asHost,
      });
      saveSession(joined.meeting_code, {
        participantId: participant.id,
        displayName: participant.display_name,
        role: participant.role,
      });
      router.push(`/meeting/${joined.meeting_code}`);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Could not join the meeting.");
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="grid animate-pulse gap-6 md:grid-cols-2" aria-busy="true" aria-label="Loading meeting">
          <div className="aspect-video rounded-xl bg-line" />
          <div className="space-y-4">
            <div className="h-6 w-2/3 rounded bg-line" />
            <div className="h-4 w-1/2 rounded bg-line" />
            <div className="h-11 rounded bg-line" />
          </div>
        </div>
      </Card>
    );
  }

  if (error || !meeting) {
    const notFound = error !== null && /not found|valid 11-digit/i.test(error);
    return (
      <Card>
        <div role="alert" className="mx-auto max-w-md space-y-4 py-8 text-center">
          <h1 className="text-2xl font-bold">{notFound ? "Meeting not found" : "Something went wrong"}</h1>
          <p className="text-muted">{error}</p>
          <div className="flex justify-center gap-3">
            {!notFound && (
              <button
                type="button"
                onClick={refetch}
                className="h-10 rounded-lg border border-line px-4 font-bold text-zoom-blue hover:bg-surface"
              >
                Retry
              </button>
            )}
            <Link href="/" className="grid h-10 place-items-center rounded-lg bg-zoom-blue px-5 font-bold text-white hover:bg-zoom-blue-dark">
              Back to home
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  const ended = meeting.status === "ended";

  return (
    <Card>
      <div className="grid gap-8 md:grid-cols-2">
        {/* ---- Camera preview ---- */}
        <div className="space-y-3">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-900">
            {/* Always rendered: the stream is attached by ref. Mirrored like a real selfie view. */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`size-full -scale-x-100 object-cover ${status === "on" ? "" : "invisible"}`}
            />
            {status !== "on" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
                <span className="grid size-20 place-items-center rounded-full bg-zoom-blue text-2xl font-bold">
                  {initials(displayName) || "?"}
                </span>
                <p className="text-sm text-white/80">{CAMERA_MESSAGES[status]}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setVideoOff((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-ink hover:bg-surface"
          >
            {videoOff ? <Video className="size-5" /> : <VideoOff className="size-5" />}
            {videoOff ? "Start video" : "Stop video"}
          </button>
        </div>

        {/* ---- Join form ---- */}
        <div className="flex flex-col justify-center">
          <p className="text-sm font-bold text-muted">Join meeting</p>
          <h1 className="mt-1 text-2xl font-bold">{meeting.title}</h1>
          <p className="mt-1 text-sm text-muted">Host: {meeting.host.name}</p>
          <p className="text-sm text-muted">Meeting ID: {meeting.display_code}</p>

          {ended ? (
            <div role="alert" className="mt-6 space-y-4">
              <p className="rounded-lg bg-surface p-4 text-sm">This meeting has ended.</p>
              <Link href="/" className="inline-grid h-11 place-items-center rounded-lg bg-zoom-blue px-6 font-bold text-white hover:bg-zoom-blue-dark">
                Back to home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="mt-6 space-y-4">
              <div>
                <label htmlFor="display-name" className="mb-1 block text-sm font-bold">
                  Your name
                </label>
                <input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setTypedName(e.target.value)}
                  maxLength={100}
                  placeholder="Enter your name"
                  className="h-11 w-full rounded-lg border border-line px-3 outline-none focus:border-zoom-blue focus:ring-2 focus:ring-zoom-blue/30"
                />
              </div>

              {joinError && (
                <p role="alert" className="text-sm text-red-600">
                  {joinError}
                </p>
              )}

              <button
                type="submit"
                disabled={joining || !displayName.trim()}
                className="h-11 w-full rounded-lg bg-zoom-blue font-bold text-white hover:bg-zoom-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {joining ? "Joining…" : "Join"}
              </button>
            </form>
          )}
        </div>
      </div>
    </Card>
  );
}