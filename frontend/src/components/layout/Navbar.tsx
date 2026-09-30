"use client";

import { Search, Settings } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { api } from "@/lib/api";
import { initials } from "@/lib/format";

export default function Navbar() {
  const { data: me } = useFetch(api.getMe);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line bg-white px-4">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-zoom-blue">zoom</span>
        <span className="hidden text-sm text-muted sm:inline">Workplace</span>
      </div>

      <label className="relative hidden sm:block">
        <span className="sr-only">Search</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          placeholder="Search"
          className="h-9 w-72 rounded-lg bg-surface pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-zoom-blue lg:w-96"
        />
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Settings"
          className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface"
        >
          <Settings className="size-5" />
        </button>
        {me ? (
          <button
            type="button"
            aria-label={`Profile: ${me.name}`}
            title={me.name}
            className="grid size-8 place-items-center rounded-full bg-zoom-blue text-xs font-bold text-white"
          >
            {initials(me.name)}
          </button>
        ) : (
          <div className="size-8 animate-pulse rounded-full bg-line" />
        )}
      </div>
    </header>
  );
}