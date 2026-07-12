import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type EmptyStateProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({ title, description, icon: Icon, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn('glass-panel flex min-w-0 flex-col items-center gap-4 rounded-3xl p-8 text-center', className)}>
      <div className="rounded-3xl bg-medical-500/15 p-4 text-medical-200 ring-1 ring-medical-400/20">
        <Icon className="h-8 w-8" />
      </div>
      <div className="min-w-0 space-y-2">
        <h3 className="text-pretty break-words text-xl font-bold text-white">{title}</h3>
        <p className="mx-auto max-w-md break-words text-sm leading-6 text-slate-300">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button type="button" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
