import { cn } from '@/lib/cn';

type AvatarProps = {
  name: string;
  initials: string;
  className?: string;
};

export function Avatar({ name, initials, className }: AvatarProps) {
  return (
    <div
      aria-label={name}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-medical-400 to-sky-500 text-sm font-bold text-slate-950 shadow-glow ring-1 ring-white/15',
        className,
      )}
    >
      {initials}
    </div>
  );
}
