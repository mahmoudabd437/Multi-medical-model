import { NavLink } from 'react-router-dom';
import { SidebarClose, SidebarOpen, X } from 'lucide-react';
import { sidebarNavigation } from '@/routes/navigation';
import { cn } from '@/lib/cn';

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 border-r border-white/8 bg-slate-950/92 p-5 backdrop-blur-2xl transition-all duration-300 lg:translate-x-0',
          collapsed ? 'lg:w-24' : 'lg:w-80',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:static lg:flex lg:flex-col',
        )}
      >
        <div className="flex items-center justify-between gap-4 lg:justify-start">
          <div className="flex items-center gap-3">
            <div className={cn('min-w-0 transition-all', collapsed ? 'lg:hidden' : 'lg:block')}>
              <p className="text-sm font-bold text-white">Medical AI Platform</p>
              <p className="text-xs text-slate-400">Operational command center</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white transition hover:bg-white/12 lg:inline-flex"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <SidebarOpen className="h-5 w-5" /> : <SidebarClose className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-white transition hover:bg-white/12 lg:hidden"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="mt-6 flex-1 space-y-2 overflow-y-auto pr-1">
          {sidebarNavigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-4 rounded-3xl border px-4 py-3 transition duration-200',
                  collapsed ? 'lg:justify-center lg:px-3' : '',
                  isActive
                    ? 'border-medical-400/30 bg-medical-400/12 text-white shadow-glow'
                    : 'border-white/8 bg-transparent text-slate-300 hover:border-white/12 hover:bg-white/6 hover:text-white',
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="rounded-2xl bg-white/6 p-2 text-medical-200 ring-1 ring-white/8 transition group-hover:bg-white/10">
                <item.icon className="h-4 w-4" />
              </span>
              <span className={cn('min-w-0 flex-1', collapsed ? 'lg:hidden' : '')}>
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="block text-xs text-slate-400">{item.description}</span>
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {open ? <button type="button" aria-label="Close overlay" onClick={onClose} className="fixed inset-0 z-30 bg-slate-950/65 backdrop-blur-sm lg:hidden" /> : null}
    </>
  );
}
