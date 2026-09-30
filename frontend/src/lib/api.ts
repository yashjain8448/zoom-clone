import type { JoinResponse, Meeting, MeetingPublic, User } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/** FastAPI sends `detail` as a string (HTTPException) or a list (422 validation). */
function messageFromDetail(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const msgs = detail.map((d) => d?.msg).filter(Boolean);
    if (msgs.length) return msgs.join(". ");
  }
  return fallback;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Only set Content-Type when there is a body: on GETs it would trigger a CORS preflight.
  const headers = init.body
    ? { "Content-Type": "application/json", ...init.headers }
    : init.headers;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, messageFromDetail(body?.detail, `Request failed (${res.status})`));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

// Module-level functions => stable identities (required by useFetch).
export const api = {
  getMe: (signal?: AbortSignal) => request<User>("/api/me", { signal }),
  getUpcoming: (signal?: AbortSignal) =>
    request<Meeting[]>("/api/meetings/upcoming", { signal }),
  getRecent: (signal?: AbortSignal) =>
    request<Meeting[]>("/api/meetings/recent?limit=10", { signal }),

  createInstant: () => post<Meeting>("/api/meetings/instant"),
  lookup: (q: string) =>
    request<MeetingPublic>(`/api/meetings/lookup?q=${encodeURIComponent(q)}`),
  getMeeting: (code: string, signal?: AbortSignal) =>
    request<MeetingPublic>(`/api/meetings/${encodeURIComponent(code)}`, { signal }),
  join: (code: string, body: { display_name: string; as_host: boolean }) =>
    post<JoinResponse>(`/api/meetings/${encodeURIComponent(code)}/join`, body),
  leave: (code: string, participantId: number) =>
    post<void>(`/api/meetings/${encodeURIComponent(code)}/leave`, {
      participant_id: participantId,
    }),
};