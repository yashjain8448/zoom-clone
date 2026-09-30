import {
  MessageSquare, Mic, MicOff, ScreenShare, Smile, Users, Video, VideoOff, type LucideIcon,
} from "lucide-react";

interface ButtonProps {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  pressed?: boolean;
  badge?: number;
}

function ControlButton({ label, icon: Icon, onClick, disabled, danger, pressed, badge }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      title={disabled ? "Not part of this demo" : undefined}
      className="relative flex w-16 shrink-0 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 sm:w-18"
    >
      <Icon className={`size-6 ${danger ? "text-red-500" : ""}`} aria-hidden />
      {label}
      {badge !== undefined && (
        <span className="absolute right-1.5 top-0.5 rounded-full bg-neutral-600 px-1.5 text-[10px] font-bold leading-4">
          {badge}
        </span>
      )}
    </button>
  );
}

interface Props {
  muted: boolean;
  videoOff: boolean;
  participantCount: number;
  panelOpen: boolean;
  isHost: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onTogglePanel: () => void;
  onLeave: () => void;
}

export default function ControlBar(p: Props) {
  return (
    <footer className="flex h-20 shrink-0 items-center justify-between gap-2 border-t border-white/10 bg-[#1a1a1a] px-2 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto">
        <ControlButton
          label={p.muted ? "Unmute" : "Mute"}
          icon={p.muted ? MicOff : Mic}
          danger={p.muted}
          pressed={p.muted}
          onClick={p.onToggleMute}
        />
        <ControlButton
          label={p.videoOff ? "Start Video" : "Stop Video"}
          icon={p.videoOff ? VideoOff : Video}
          danger={p.videoOff}
          pressed={p.videoOff}
          onClick={p.onToggleVideo}
        />
        <ControlButton
          label="Participants"
          icon={Users}
          badge={p.participantCount}
          pressed={p.panelOpen}
          onClick={p.onTogglePanel}
        />
        <ControlButton label="Chat" icon={MessageSquare} disabled />
        <ControlButton label="Share" icon={ScreenShare} disabled />
        <ControlButton label="Reactions" icon={Smile} disabled />
      </div>

      <button
        type="button"
        onClick={p.onLeave}
        className="h-10 shrink-0 rounded-lg bg-red-600 px-5 font-bold hover:bg-red-700"
      >
        {p.isHost ? "End" : "Leave"}
      </button>
    </footer>
  );
}