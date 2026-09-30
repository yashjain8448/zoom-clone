"use client";

import { Check, Copy, ShieldCheck } from "lucide-react";
import { useClipboard } from "@/hooks/useClipboard";
import { useNow } from "@/hooks/useNow";
import { formatElapsed } from "@/lib/format";

interface Props {
  code: string;
  title: string;
  displayCode: string;
  startedAt: string; // ISO UTC
}

export default function RoomTopBar({ code, title, displayCode, startedAt }: Props) {
  const { copied, copy } = useClipboard();
  const now = useNow();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 px-3">
      <div className="flex min-w-0 items-center gap-2">
        <ShieldCheck className="size-5 shrink-0 text-green-500" aria-label="Meeting is secured" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{title}</p>
          <p className="text-xs text-white/60">Meeting ID: {displayCode}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm tabular-nums text-white/80" aria-label="Elapsed time">
          {formatElapsed(now - Date.parse(startedAt))}
        </span>
        <button
          type="button"
          // location is read inside the handler, which only runs in the browser
          onClick={() => copy(`${window.location.origin}/j/${code}`)}
          className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-bold hover:bg-white/10"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy invite link"}
        </button>
      </div>
    </header>
  );
}