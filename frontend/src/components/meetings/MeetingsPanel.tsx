"use client";

import ListState from "@/components/common/ListState";
import { useFetch } from "@/hooks/useFetch";
import { groupByDay, meetingStart } from "@/lib/format";
import type { Meeting } from "@/lib/types";
import MeetingRow from "./MeetingRow";

interface Props {
  upcoming: boolean;
  /** Must be a stable function (module-level), see useFetch. */
  fetcher: (signal: AbortSignal) => Promise<Meeting[]>;
  currentUserId: number | undefined;
  emptyText: string;
}

export default function MeetingsPanel({ upcoming, fetcher, currentUserId, emptyText }: Props) {
  const state = useFetch(fetcher);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <ListState state={state} emptyText={emptyText}>
        {(meetings) => (
          <div>
            {groupByDay(meetings, meetingStart).map((group) => (
              <section key={group.label}>
                <h2 className="border-b border-line bg-surface px-5 py-2 text-sm font-bold">
                  {group.label}
                </h2>
                <ul className="divide-y divide-line">
                  {group.items.map((m) => (
                    <MeetingRow
                      key={m.id}
                      meeting={m}
                      upcoming={upcoming}
                      isHost={m.host.id === currentUserId}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </ListState>
    </div>
  );
}