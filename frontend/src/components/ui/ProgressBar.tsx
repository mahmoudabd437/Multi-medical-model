type ProgressBarProps = {
  value: number;
  label?: string;
};

export function ProgressBar({ value, label }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      {label ? <div className="flex items-center justify-between text-sm text-slate-300"><span>{label}</span><span>{value}%</span></div> : null}
      <div className="h-2 overflow-hidden rounded-full bg-slate-800/80 ring-1 ring-white/8">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-400 transition-all duration-700 ease-out" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
