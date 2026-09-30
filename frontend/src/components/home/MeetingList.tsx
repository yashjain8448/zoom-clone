import type { FetchState } from "@/hooks/useFetch";
import type { Meeting } from "@/lib/types";
import MeetingCard from "./MeetingCard";

interface Props {
  title: string;
  state: FetchState<Meeting[]>;
  emptyText: string;
}

function Skeleton() {
  return (
    <div className="space-y-4 px-5 py-4" aria-busy="true" aria-label="Loading meetings">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse space-y-2">
          <div className="h-3 w-1/3 rounded bg-line" />
          <div className="h-4 w-2/3 rounded bg-line" />
        </div>
      ))}
    </div>
  );
}

export default function MeetingList({ title, state, emptyText }: Props) {
  const { data, loading, error, refetch } = state;

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white">
      <h2 className="border-b border-line px-5 py-3 text-base font-bold">{title}</h2>

      {loading && <Skeleton />}

      {!loading && error && (
        <div role="alert" className="px-5 py-6 text-sm">
          <p className="text-muted">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-3 rounded-lg border border-line px-3 py-1.5 font-bold text-zoom-blue hover:bg-surface"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data?.length === 0 && (
        <p className="px-5 py-8 text-center text-sm text-muted">{emptyText}</p>
      )}

      {!loading && !error && data && data.length > 0 && (
        <ul className="divide-y divide-line">
          {data.map((m) => (
            <MeetingCard key={m.id} meeting={m} />
          ))}
        </ul>
      )}
    </section>
  );
}