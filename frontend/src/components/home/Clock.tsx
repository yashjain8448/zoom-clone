"use client";

import { useEffect, useState } from "react";

export default function Clock() {
  // null on the server and first client render: `new Date()` would differ between the
  // two and cause a hydration mismatch. We fill it in after mount.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl bg-zoom-blue px-6 py-6 text-white" aria-live="off">
      <div className="min-h-[3.75rem] text-5xl font-bold tracking-tight">
        {now?.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
      </div>
      <div className="mt-1 min-h-6 text-base">
        {now?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </div>
    </div>
  );
}