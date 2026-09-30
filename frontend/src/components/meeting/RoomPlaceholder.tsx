"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { clearSession, loadSession } from "@/lib/session";

export default function RoomPlaceholder({ code }: { code: string }) {
  const router = useRouter();

  async function leave() {
    const session = loadSession(code);
    try {
      if (session) await api.leave(code, session.participantId);
    } catch {
      /* leaving is best-effort; we navigate away regardless */
    }
    clearSession(code);
    router.push("/");
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-[#1a1a1a] p-6 text-center text-white">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">You&apos;re in the meeting</h1>
        <p className="text-white/70">Meeting room coming in Step 9. Code: {code}</p>
        <button
          type="button"
          onClick={leave}
          className="h-11 rounded-lg bg-red-600 px-6 font-bold hover:bg-red-700"
        >
          Leave
        </button>
      </div>
    </div>
  );
}