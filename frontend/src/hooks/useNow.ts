"use client";

import { useSyncExternalStore } from "react";

const subscribe = (onTick: () => void) => {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
};

/**
 * Current time in ms, ticking every second. Returns 0 during server render and
 * hydration, so both sides produce the same HTML (no hydration mismatch), then
 * real time from the first client update onward.
 */
export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 1000) * 1000, // whole seconds, so the snapshot is stable
    () => 0,
  );
}