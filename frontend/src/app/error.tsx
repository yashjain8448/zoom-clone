"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-surface p-4">
      <div role="alert" className="max-w-md space-y-4 rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted">An unexpected error occurred. You can try again.</p>
        <button
          type="button"
          onClick={reset}
          className="h-11 rounded-lg bg-zoom-blue px-6 font-bold text-white hover:bg-zoom-blue-dark"
        >
          Try again
        </button>
      </div>
    </div>
  );
}