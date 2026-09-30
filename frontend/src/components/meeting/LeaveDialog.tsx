"use client";

import { useEffect, useRef } from "react";

interface Props {
  isHost: boolean;
  busy: boolean;
  error: string | null;
  onLeave: () => void;
  onEnd: () => void;
  onClose: () => void;
}

/** Mounted only while open (like JoinModal). Native <dialog>: focus trap and Esc for free. */
export default function LeaveDialog({ isHost, busy, error, onLeave, onEnd, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="leave-title"
      className="m-auto w-full max-w-sm rounded-2xl bg-white p-0 text-ink shadow-xl backdrop:bg-black/60"
    >
      <div className="space-y-3 p-6">
        <h2 id="leave-title" className="text-lg font-bold">
          {isHost ? "End or leave the meeting?" : "Leave the meeting?"}
        </h2>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {isHost && (
          <button
            type="button"
            onClick={onEnd}
            disabled={busy}
            className="h-11 w-full rounded-lg bg-red-600 font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            End meeting for all
          </button>
        )}
        <button
          type="button"
          onClick={onLeave}
          disabled={busy}
          className={
            isHost
              ? "h-11 w-full rounded-lg border border-line font-bold hover:bg-surface disabled:opacity-50"
              : "h-11 w-full rounded-lg bg-red-600 font-bold text-white hover:bg-red-700 disabled:opacity-50"
          }
        >
          Leave meeting
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="h-11 w-full rounded-lg font-bold text-zoom-blue hover:bg-surface"
        >
          Cancel
        </button>
      </div>
    </dialog>
  );
}