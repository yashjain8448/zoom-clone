import {
  Calendar, FileText, House, Mail, MessageSquare, Phone, Video, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string; // no href = placeholder, not built in this assignment
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: House, href: "/" },
  { label: "Team Chat", icon: MessageSquare },
  { label: "Meetings", icon: Video, href: "/meetings" },
  { label: "Phone", icon: Phone },
  { label: "Calendar", icon: Calendar },
  { label: "Mail", icon: Mail },
  { label: "Docs", icon: FileText },
];

/** "/" only matches exactly; other items also match their sub-paths. */
export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}