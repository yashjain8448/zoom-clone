"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMeetingSession } from "@/hooks/useMeetingSession";
import { clearSession } from "@/lib/session";
import Room from "./Room";
import RoomMessage from "./RoomMessage";

export default function MeetingRoom({ code }: { code: string }) {
  const router = useRouter();
  const state = useMeetingSession(code);
  const exiting = useRef(false);

  // Leaving clears the session; the flag stops the effect below from mistaking that for
  // "opened the room without joining" and redirecting to the lobby instead of the target.
  const exit = useCallback(
    (to: string) => {
      exiting.current = true;
      clearSession(code);
      router.push(to);
    },
    [code, router],
  );

  useEffect(() => {
    if (state.status === "missing" && !exiting.current) router.replace(`/j/${code}`);
  }, [state.status, code, router]);

  if (state.status !== "ready") return <RoomMessage title="Joining meeting…" />;
  return <Room code={code} session={state.session} onExit={exit} />;
}