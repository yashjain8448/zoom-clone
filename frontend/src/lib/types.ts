export type MeetingType = "instant" | "scheduled";
export type MeetingStatus = "scheduled" | "live" | "ended";
export type ParticipantRole = "host" | "participant";
export type ParticipantStatus = "joined" | "left" | "removed";

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
}

/** Mirrors backend `MeetingOut`. Datetimes are ISO-8601 UTC strings ("...Z"). */
export interface Meeting {
  id: number;
  meeting_code: string;
  title: string;
  description: string | null;
  type: MeetingType;
  status: MeetingStatus;
  scheduled_start: string | null;
  duration_minutes: number;
  timezone: string;
  passcode: string | null;
  started_at: string | null;
  ended_at: string | null;
  host: User;
  display_code: string;
  invite_link: string;
}

/** Mirrors backend `MeetingPublicOut`: no passcode, no host email. */
export interface MeetingPublic {
  meeting_code: string;
  title: string;
  type: MeetingType;
  status: MeetingStatus;
  scheduled_start: string | null;
  duration_minutes: number;
  host: { name: string; avatar_url: string | null };
  display_code: string;
}

export interface Participant {
  id: number;
  display_name: string;
  role: ParticipantRole;
  is_muted: boolean;
  is_video_off: boolean;
  status: ParticipantStatus;
  joined_at: string;
}

export interface JoinResponse {
  participant: Participant;
  meeting: MeetingPublic;
}