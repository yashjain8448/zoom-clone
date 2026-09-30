import type { FetchState } from "@/hooks/useFetch";

interface Props<T> {
  state: FetchState<T[]>;
  emptyText: string;
  /** Only called with a non-empty array, so callers never null-check. */
  children: (items: T[]) => React.ReactNode;
}

function Skeleton() {
  return (
    <div className="space-y-4 px-5 py-4" aria-busy="true" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse space-y-2">
          <div className="h-3 w-1/3 rounded bg-line" />
          <div className="h-4 w-2/3 rounded bg-line" />
        </div>
      ))}
    </div>
  );
}

/** One place for the loading, error (with retry), and empty states of any list. */
export default function ListState<T>({ state, emptyText, children }: Props<T>) {
  const { data, loading, error, refetch } = state;

  if (loading) return <Skeleton />;

  if (error) {
    return (
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
    );
  }

  if (!data || data.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-muted">{emptyText}</p>;
  }

  return <>{children(data)}</>;
}