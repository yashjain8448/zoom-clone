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

export interface MeetingPublic {
  meeting_code: string;
  title: string;
  type: MeetingType;
  status: MeetingStatus;
  scheduled_start: string | null;
  started_at: string | null;
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

/** Body of POST /api/meetings/schedule. Optional fields are omitted when blank. */
export interface ScheduleInput {
  title: string;
  description?: string;
  scheduled_start: string; // ISO-8601 UTC
  duration_minutes: number;
  timezone: string; // IANA name, e.g. "America/New_York"
  passcode?: string;
  invitees: string[];
}