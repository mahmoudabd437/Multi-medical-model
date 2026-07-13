import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function GlassCard({ children, className, delay = 0 }: GlassCardProps) {
  return (
    <div
      className={cn('glass-panel min-w-0 rounded-[2rem] p-5 text-white/90 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_90px_rgba(2,6,23,0.42)]', className)}
    >
      {children}
    </div>
  );
}
