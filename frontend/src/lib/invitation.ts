import { formatInZone } from "./datetime";
import type { Meeting } from "./types";

/** Plain-text invitation, the same wording wherever the user copies it from. */
export function invitationText(m: Meeting): string {
  const startIso = m.scheduled_start ?? m.started_at;
  return [
    `${m.host.name} is inviting you to a scheduled Zoom meeting.`,
    "",
    `Topic: ${m.title}`,
    ...(startIso ? [`Time: ${formatInZone(startIso, m.timezone)}`] : []),
    "",
    `Join: ${m.invite_link}`,
    `Meeting ID: ${m.display_code}`,
    ...(m.passcode ? [`Passcode: ${m.passcode}`] : []),
  ].join("\n");
}