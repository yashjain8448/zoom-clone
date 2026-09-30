"use client";

import { useState } from "react";
import { MicOff, VolumeX, VideoOff, X } from "lucide-react";
import { initials } from "@/lib/format";
import type { Participant } from "@/lib/types";

interface Props {
  participants: Participant[];
  selfId: number;
  isHost: boolean;
  busy: boolean;
  error: string | null;
  onMuteAll: () => void;
  onRemove: (id: number) => void;
  onClose: () => void;
}

export default function ParticipantsPanel({
  participants, selfId, isHost, busy, error, onMuteAll, onRemove, onClose,
}: Props) {
  // Which row is showing "Remove? Yes / No". A destructive action needs a second click.
  const [confirmId, setConfirmId] = useState<number | null>(null);

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
        {participants.map((p) => {
          const removable = isHost && p.role !== "host" && p.id !== selfId;
          return (
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

              {confirmId === p.id ? (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-white/70">Remove?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmId(null);
                      onRemove(p.id);
                    }}
                    className="rounded bg-red-600 px-2 py-1 font-bold hover:bg-red-700"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    className="rounded px-2 py-1 font-bold hover:bg-white/10"
                  >
                    No
                  </button>
                </div>
              ) : (
                <>
                  {p.is_muted && <MicOff className="size-4 shrink-0 text-red-400" aria-label="Muted" />}
                  {p.is_video_off && <VideoOff className="size-4 shrink-0 text-white/60" aria-label="Video off" />}
                  {removable && (
                    <button
                      type="button"
                      onClick={() => setConfirmId(p.id)}
                      className="rounded px-2 py-1 text-xs font-bold text-red-400 hover:bg-white/10"
                    >
                      Remove
                    </button>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>

      {isHost && (
        <footer className="shrink-0 space-y-2 border-t border-white/10 p-3">
          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={onMuteAll}
            disabled={busy}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white/10 text-sm font-bold hover:bg-white/20 disabled:opacity-50"
          >
            <VolumeX className="size-4" aria-hidden />
            {busy ? "Muting…" : "Mute all"}
          </button>
        </footer>
      )}
    </aside>
  );
}