"use client";

import { useState } from "react";
import Link from "next/link";
import { useFetch } from "@/hooks/useFetch";
import { api } from "@/lib/api";
import MeetingsPanel from "./MeetingsPanel";

type Tab = "upcoming" | "previous";

const TABS: { id: Tab; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "previous", label: "Previous" },
];

export default function MeetingsView() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const { data: me } = useFetch(api.getMe);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Meetings</h1>
        <Link
          href="/schedule"
          className="grid h-10 place-items-center rounded-lg bg-zoom-blue px-5 font-bold text-white hover:bg-zoom-blue-dark"
        >
          Schedule a meeting
        </Link>
      </div>

      <div
        role="tablist"
        aria-label="Meetings"
        className="mt-5 flex gap-6 border-b border-line"
      >
        {TABS.map(({ id, label }) => {
          const selected = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={selected}
              aria-controls={`panel-${id}`}
              onClick={() => setTab(id)}
              className={`-mb-px border-b-2 pb-3 text-sm font-bold transition-colors ${
                selected
                  ? "border-zoom-blue text-zoom-blue"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* key={tab} remounts the panel: fresh fetch, and no expanded-row state carried across tabs */}
      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="mt-5"
      >
        {tab === "upcoming" ? (
          <MeetingsPanel
            key="upcoming"
            upcoming
            fetcher={api.getUpcoming}
            currentUserId={me?.id}
            emptyText="No upcoming meetings. Schedule one to get started."
          />
        ) : (
          <MeetingsPanel
            key="previous"
            upcoming={false}
            fetcher={api.getPrevious}
            currentUserId={me?.id}
            emptyText="No previous meetings yet."
          />
        )}
      </div>
    </div>
  );
}
