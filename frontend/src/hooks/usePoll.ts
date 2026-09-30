"use client";

import { useEffect, useState } from "react";

export interface PollState<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Calls `fetcher` now and then again `intervalMs` after each response finishes.
 * Chaining setTimeout (not setInterval) means a slow response can never cause
 * overlapping requests. A failed poll keeps the last good `data`, so the UI can
 * show a "reconnecting" banner instead of going blank.
 * `fetcher` must have a stable identity (useCallback), same rule as useFetch.
 */
export function usePoll<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  intervalMs: number,
): PollState<T> {
  const [state, setState] = useState<PollState<T>>({ data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      try {
        const data = await fetcher(controller.signal);
        if (controller.signal.aborted) return;
        setState({ data, error: null });
      } catch (err) {
        if (controller.signal.aborted) return;
        const error = err instanceof Error ? err : new Error("Something went wrong.");
        setState((s) => ({ data: s.data, error }));
      }
      timer = setTimeout(tick, intervalMs);
    }

    tick();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [fetcher, intervalMs]);

  return state;
}