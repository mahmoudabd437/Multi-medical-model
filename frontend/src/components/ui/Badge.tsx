import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type BadgeVariant = 'success' | 'warning' | 'info' | 'neutral' | 'danger';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
};

const badgeClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-400/12 text-emerald-200 ring-1 ring-emerald-400/20',
  warning: 'bg-amber-400/12 text-amber-200 ring-1 ring-amber-400/20',
  info: 'bg-sky-400/12 text-sky-200 ring-1 ring-sky-400/20',
  neutral: 'bg-white/8 text-slate-200 ring-1 ring-white/10',
  danger: 'bg-rose-400/12 text-rose-200 ring-1 ring-rose-400/20',
};

export function Badge({ children, className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', badgeClasses[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
