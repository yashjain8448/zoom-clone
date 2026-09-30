import type { LucideIcon } from "lucide-react";

// Tailwind only generates classes it can find as complete strings, so no `bg-${color}`.
const COLORS = {
  orange: "bg-zoom-orange hover:bg-zoom-orange-dark",
  blue: "bg-zoom-blue hover:bg-zoom-blue-dark",
} as const;

interface Props {
  label: string;
  icon: LucideIcon;
  color: keyof typeof COLORS;
  onClick?: () => void;
  disabled?: boolean;
}

export default function ActionTile({ label, icon: Icon, color, onClick, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex flex-col items-center gap-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={`grid size-24 place-items-center rounded-[22px] text-white shadow-sm transition-colors group-focus-visible:ring-4 group-focus-visible:ring-zoom-blue/30 ${COLORS[color]}`}
      >
        <Icon className="size-10" strokeWidth={2.25} />
      </span>
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}