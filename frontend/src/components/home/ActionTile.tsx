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
      className="group flex w-full flex-col items-center gap-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      <span
        className={`grid size-16 place-items-center rounded-2xl text-white shadow-sm transition-colors group-focus-visible:ring-4 group-focus-visible:ring-zoom-blue/30 sm:size-24 sm:rounded-[22px] ${COLORS[color]}`}
      >
        <Icon className="size-7 sm:size-10" strokeWidth={2.25} />
      </span>
      <span className="text-center text-xs font-bold sm:text-sm">{label}</span>
    </button>
  );
}