"use client";

import { useCallback, useEffect, useState } from "react";

export interface FetchState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
}

/**
 * `fetcher` MUST have a stable identity (a module-level function, or wrapped in
 * useCallback). A new function every render would re-run the effect forever.
 */
export function useFetch<T>(fetcher: (signal: AbortSignal) => Promise<T>): FetchState<T> {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({
    data: null,
    error: null,
    loading: true,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetcher(controller.signal)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return; // unmounted or superseded: ignore
        setState({
          data: null,
          error: err instanceof Error ? err.message : "Something went wrong.",
          loading: false,
        });
      });
    return () => controller.abort();
  }, [fetcher, attempt]);

  const refetch = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, refetch };
}