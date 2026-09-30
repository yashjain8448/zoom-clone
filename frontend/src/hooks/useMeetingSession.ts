"use client";

import { useMemo, useSyncExternalStore } from "react";
import { parseSession, readSessionRaw, type MeetingSession } from "@/lib/session";

const subscribe = () => () => {}; // sessionStorage changes only through our own code

export type SessionState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "ready"; session: MeetingSession };

/** Reads this tab's session without a hydration mismatch (server has no sessionStorage). */
export function useMeetingSession(code: string): SessionState {
  // null = server / hydration pass, "" = this tab has no session for the meeting
  const raw = useSyncExternalStore(subscribe, () => readSessionRaw(code), () => null);

  return useMemo<SessionState>(() => {
    if (raw === null) return { status: "loading" };
    const session = parseSession(raw);
    return session ? { status: "ready", session } : { status: "missing" };
  }, [raw]);
}