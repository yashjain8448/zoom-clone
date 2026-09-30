import { MicOff } from "lucide-react";
import { initials } from "@/lib/format";

// Complete class names only: Tailwind can't see `bg-${color}`.
const AVATAR_COLORS = [
  "bg-zoom-blue",
  "bg-emerald-600",
  "bg-violet-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-cyan-700",
] as const;

interface Props {
  id: number;
  name: string;
  isSelf: boolean;
  isHost: boolean;
  muted: boolean;
  showVideo: boolean;
  /** Only the local tile has a stream. Other tiles are avatars (no WebRTC in this project). */
  videoRef?: React.Ref<HTMLVideoElement>;
}

export default function VideoTile({ id, name, isSelf, isHost, muted, showVideo, videoRef }: Props) {
  return (
    <div className="relative min-h-40 overflow-hidden rounded-lg bg-neutral-800">
      {videoRef && (
        // Always rendered: the stream is attached by ref, and mirrored like a selfie view.
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`absolute inset-0 size-full -scale-x-100 object-cover ${showVideo ? "" : "invisible"}`}
        />
      )}

      {!showVideo && (
        <div className="absolute inset-0 grid place-items-center">
          <span
            className={`grid size-20 place-items-center rounded-full text-2xl font-bold ${AVATAR_COLORS[id % AVATAR_COLORS.length]}`}
          >
            {initials(name) || "?"}
          </span>
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-sm">
        {muted && (
          <>
            <MicOff className="size-3.5 shrink-0 text-red-400" aria-hidden />
            <span className="sr-only">Muted</span>
          </>
        )}
        <span className="truncate">
          {name}
          {isSelf ? " (You)" : ""}
          {isHost ? " · Host" : ""}
        </span>
      </div>
    </div>
  );
}