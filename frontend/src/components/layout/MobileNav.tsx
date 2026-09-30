"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActive } from "./nav";

const item = "flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-bold";

/** Phone-only tab bar (Zoom's mobile app has one). Same items as the desktop Sidebar. */
export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex shrink-0 border-t border-line bg-white md:hidden">
      {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
        if (!href) {
          return (
            <button
              key={label}
              type="button"
              disabled
              title="Not part of this demo"
              className={`${item} cursor-not-allowed text-muted/50`}
            >
              <Icon className="size-5" />
              <span className="max-w-full truncate">{label}</span>
            </button>
          );
        }
        const active = isActive(pathname, href);
        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`${item} ${active ? "text-zoom-blue" : "text-muted"}`}
          >
            <Icon className="size-5" />
            <span className="max-w-full truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}