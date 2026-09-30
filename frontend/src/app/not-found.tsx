import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-surface p-4">
      <div className="max-w-md space-y-4 rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-5xl font-bold text-zoom-blue">404</p>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-muted">That page does not exist or has moved.</p>
        <Link
          href="/"
          className="inline-grid h-11 place-items-center rounded-lg bg-zoom-blue px-6 font-bold text-white hover:bg-zoom-blue-dark"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}