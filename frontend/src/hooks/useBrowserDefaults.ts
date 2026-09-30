"use client";

import { useSyncExternalStore } from "react";
import { defaultStartLocal } from "@/lib/datetime";

// These values never change while the page is open, so there is nothing to subscribe to.
const subscribe = () => () => {};

/**
 * The browser's IANA timezone. The server has no idea what it is, so during SSR and
 * hydration this returns "UTC" and React swaps in the real value right after.
 */
export function useBrowserTimezone(): string {
  return useSyncExternalStore(
    subscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => "UTC",
  );
}

/** "YYYY-MM-DDTHH:mm" for the next half hour, or "" on the server. Strings compare by value, so snapshots stay stable. */
export function useDefaultStart(): string {
  return useSyncExternalStore(subscribe, () => defaultStartLocal(), () => "");
}