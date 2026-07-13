import { Menu, Microscope } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { publicNavigation } from '@/routes/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';

type NavbarProps = {
  mode: 'public' | 'dashboard';
  onMenuClick?: () => void;
  title?: string;
  subtitle?: string;
};

export function Navbar({ mode, onMenuClick, title = 'Medical AI Dashboard', subtitle = 'Premium clinical workspace' }: NavbarProps) {
  const { user } = useAuth();

  if (mode === 'public') {
    return (
      <header className="sticky top-0 z-40 border-b border-white/8 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-medical-400 to-sky-500 text-slate-950 shadow-glow">
              <Microscope className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">Multi Medical Model</p>
              <p className="truncate text-xs text-slate-400">AI medical intelligence platform</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {publicNavigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition',
                    isActive ? 'bg-white/12 text-white' : 'text-slate-300 hover:bg-white/8 hover:text-white',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-slate-950/72 backdrop-blur-xl">
      <div className="flex min-w-0 items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white transition hover:bg-white/12 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.3em] text-medical-300">{title}</p>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
              <span className="min-w-0 break-words">{subtitle}</span>
              <span className="hidden h-1 w-1 rounded-full bg-slate-500 sm:inline-block" />
              <span className="hidden min-w-0 max-w-[16rem] truncate sm:inline-flex">{user?.department ?? 'Clinical'} workspace</span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 max-w-full items-center gap-3 rounded-full border border-white/10 bg-white/6 px-3 py-2">
          <Avatar name={user?.name ?? 'Guest'} initials={user?.initials ?? 'GD'} className="h-9 w-9" />
          <div className="hidden min-w-0 text-left sm:block">
            <p className="truncate text-sm font-semibold text-white">{user?.name ?? 'Guest User'}</p>
            <p className="truncate text-xs text-slate-400">{user?.role ?? 'Viewer'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
