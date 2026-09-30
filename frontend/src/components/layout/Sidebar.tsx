"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar, FileText, House, Mail, MessageSquare, Phone, Video, type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string; // no href = placeholder, not built in this assignment
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: House, href: "/" },
  { label: "Team Chat", icon: MessageSquare },
  { label: "Meetings", icon: Video }, // gets href: "/meetings" in Step 8
  { label: "Phone", icon: Phone },
  { label: "Calendar", icon: Calendar },
  { label: "Mail", icon: Mail },
  { label: "Docs", icon: FileText },
];

const base =
  "flex w-16 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-zoom-blue";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="hidden w-[76px] shrink-0 flex-col items-center gap-1 border-r border-line bg-white py-3 md:flex"
    >
      {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
        if (!href) {
          return (
            <button
              key={label}
              type="button"
              disabled
              title="Not part of this demo"
              className={`${base} cursor-not-allowed text-muted/50`}
            >
              <Icon className="size-5" />
              {label}
            </button>
          );
        }
        const active = pathname === href;
        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`${base} ${active ? "bg-zoom-blue/10 text-zoom-blue" : "text-muted hover:bg-surface"}`}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}