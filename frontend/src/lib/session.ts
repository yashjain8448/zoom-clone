import type { ParticipantRole } from "./types";

export interface MeetingSession {
  participantId: number;
  displayName: string;
  role: ParticipantRole;
}

// sessionStorage is per tab: two tabs can be two different participants.
// Every access is wrapped: storage can be unavailable (privacy mode) or throw when full.
const key = (code: string) => `zoom:session:${code}`;

export function saveSession(code: string, session: MeetingSession): void {
  try {
    sessionStorage.setItem(key(code), JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

/** Raw stored string, or "" when there is none. Used with useSyncExternalStore. */
export function readSessionRaw(code: string): string {
  try {
    return sessionStorage.getItem(key(code)) ?? "";
  } catch {
    return "";
  }
}

export function parseSession(raw: string): MeetingSession | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MeetingSession;
  } catch {
    return null;
  }
}

export function loadSession(code: string): MeetingSession | null {
  return parseSession(readSessionRaw(code));
}

export function clearSession(code: string): void {
  try {
    sessionStorage.removeItem(key(code));
  } catch {
    /* ignore */
  }
}