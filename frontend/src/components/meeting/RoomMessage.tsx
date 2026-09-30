export const primaryBtn =
  "h-11 rounded-lg bg-zoom-blue px-6 font-bold text-white hover:bg-zoom-blue-dark";
export const secondaryBtn =
  "h-11 rounded-lg border border-white/30 px-6 font-bold text-white hover:bg-white/10";

interface Props {
  title: string;
  body?: string;
  children?: React.ReactNode;
}

/** Full-screen status in the room's dark theme: joining, ended, removed, errors. */
export default function RoomMessage({ title, body, children }: Props) {
  return (
    <div role="status" className="grid min-h-dvh place-items-center bg-[#1a1a1a] p-6 text-center text-white">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        {body && <p className="text-white/70">{body}</p>}
        {children && <div className="flex flex-wrap justify-center gap-3 pt-2">{children}</div>}
      </div>
    </div>
  );
}