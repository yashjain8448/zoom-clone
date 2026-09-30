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

export function loadSession(code: string): MeetingSession | null {
  try {
    const raw = sessionStorage.getItem(key(code));
    return raw ? (JSON.parse(raw) as MeetingSession) : null;
  } catch {
    return null;
  }
}

export function clearSession(code: string): void {
  try {
    sessionStorage.removeItem(key(code));
  } catch {
    /* ignore */
  }
}