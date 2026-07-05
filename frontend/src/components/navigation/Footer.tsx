import env from '@/config/env';
import { cn } from '@/lib/cn';

type FooterProps = {
  compact?: boolean;
};

export function Footer({ compact = false }: FooterProps) {
  return (
    <footer className={cn('mt-auto border-t border-white/8 px-4 py-6 text-sm text-slate-400 sm:px-6 lg:px-8', compact && 'py-4')}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>Multi Medical Model Platform {env.appVersion}</p>
        <p className="text-slate-500">Mock frontend architecture with no backend integration yet.</p>
      </div>
    </footer>
  );
}
