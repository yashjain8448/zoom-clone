"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function JoinModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal(); // native focus trap + Esc handling
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || !query.trim()) return;
    setBusy(true);
    setError(null);
    try {
      // The server parses IDs and invite links and validates existence.
      const meeting = await api.lookup(query);
      router.push(`/j/${meeting.meeting_code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose} // fires on Esc as well as close()
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // click on the backdrop
      }}
      aria-labelledby="join-title"
      className="m-auto w-full max-w-md rounded-2xl bg-white p-0 text-ink shadow-xl backdrop:bg-black/50"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <h2 id="join-title" className="text-xl font-bold">
          Join meeting
        </h2>

        <div>
          <label htmlFor="meeting-id" className="mb-1 block text-sm font-bold">
            Meeting ID or invite link
          </label>
          <input
            id="meeting-id"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="123 4567 8901"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "join-error" : undefined}
            className="h-11 w-full rounded-lg border border-line px-3 outline-none focus:border-zoom-blue focus:ring-2 focus:ring-zoom-blue/30"
          />
          {error && (
            <p id="join-error" role="alert" className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg px-4 font-bold text-zoom-blue hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !query.trim()}
            className="h-10 rounded-lg bg-zoom-blue px-5 font-bold text-white hover:bg-zoom-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Checking…" : "Join"}
          </button>
        </div>
      </form>
    </dialog>
  );
}