"use client";

import { useCallback, useState } from "react";

/** Copy text and expose a short-lived `copied` flag for button feedback. */
export function useClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        // Needs a secure context (HTTPS or localhost); the browser may also deny it.
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), resetMs);
      } catch {
        setCopied(false);
      }
    },
    [resetMs],
  );

  return { copied, copy };
}