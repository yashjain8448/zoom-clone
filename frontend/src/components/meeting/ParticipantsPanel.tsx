import { MicOff, VideoOff, X } from "lucide-react";
import { initials } from "@/lib/format";
import type { Participant } from "@/lib/types";

interface Props {
  participants: Participant[];
  selfId: number;
  onClose: () => void;
}

export default function ParticipantsPanel({ participants, selfId, onClose }: Props) {
  return (
    <aside
      aria-label="Participants"
      className="fixed inset-y-0 right-0 z-20 flex w-full max-w-sm flex-col border-l border-white/10 bg-[#232323] md:static md:z-auto md:w-80 md:max-w-none md:shrink-0"
    >
      <header className="flex h-12 shrink-0 items-center justify-between px-4">
        <h2 className="font-bold">Participants ({participants.length})</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close participants"
          className="grid size-8 place-items-center rounded-full hover:bg-white/10"
        >
          <X className="size-5" />
        </button>
      </header>

      <ul className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        {participants.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zoom-blue text-xs font-bold">
              {initials(p.display_name) || "?"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
                {p.display_name}
                {p.id === selfId ? " (Me)" : ""}
              </p>
              {p.role === "host" && <p className="text-xs text-white/60">Host</p>}
            </div>
            {p.is_muted && <MicOff className="size-4 shrink-0 text-red-400" aria-label="Muted" />}
            {p.is_video_off && <VideoOff className="size-4 shrink-0 text-white/60" aria-label="Video off" />}
          </li>
        ))}
      </ul>
    </aside>
  );
}