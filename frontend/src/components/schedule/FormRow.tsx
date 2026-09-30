export const fieldClass =
  "h-10 rounded-lg border border-line bg-white px-3 text-sm outline-none " +
  "focus:border-zoom-blue focus:ring-2 focus:ring-zoom-blue/30";

interface Props {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}

/** Zoom's schedule form: label on the left, control(s) on the right; stacked on mobile. */
export default function FormRow({ label, htmlFor, hint, children }: Props) {
  return (
    <div className="grid gap-2 py-5 md:grid-cols-[160px_minmax(0,1fr)] md:gap-6">
      <label htmlFor={htmlFor} className="pt-2 text-sm font-bold">
        {label}
      </label>
      <div>
        {children}
        {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}