import { FormEvent, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Gauge, Lock, BellRing, Database, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Badge } from '@/components/ui/Badge';
import { settingsGroups } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';

export default function Settings() {
  const { user, requestPasswordReset, changePassword } = useAuth();
  const initialState = useMemo(
    () =>
      settingsGroups.reduce<Record<string, boolean>>((accumulator, group) => {
        group.options.forEach((option) => {
          accumulator[option.label] = option.enabled;
        });
        return accumulator;
      }, {}),
    [],
  );

  const [preferences, setPreferences] = useState<Record<string, boolean>>(initialState);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [resetEmail, setResetEmail] = useState(user?.email ?? 'amelia.carter@medaiplatform.dev');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: 'password123',
    newPassword: 'new-password-123',
  });

  const handleResetRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setWorking(true);
      setStatusMessage(null);
      await requestPasswordReset(resetEmail);
      setStatusMessage('Password reset request accepted by the backend.');
    } catch (requestError) {
      setStatusMessage(requestError instanceof Error ? requestError.message : 'Reset request failed.');
    } finally {
      setWorking(false);
    }
  };

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setWorking(true);
      setStatusMessage(null);
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setStatusMessage('Password change request accepted by the backend.');
    } catch (requestError) {
      setStatusMessage(requestError instanceof Error ? requestError.message : 'Password change failed.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-8 pb-4">
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
        <SectionHeader
          eyebrow="Settings"
          title="Application preferences"
          description="These controls exercise the backend auth endpoints and session utilities while preserving the dark medical dashboard experience."
          action={<Badge variant="info">API driven</Badge>}
        />
      </motion.section>

      {statusMessage ? (
        <div className="rounded-3xl border border-medical-400/20 bg-medical-500/10 px-4 py-3 text-sm text-medical-100">
          {statusMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {settingsGroups.map((group) => (
          <GlassCard key={group.title} className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">{group.title}</p>
                <h3 className="mt-2 text-2xl font-bold text-white">Controls</h3>
              </div>
              <Badge variant="neutral">Editable locally</Badge>
            </div>

            <div className="mt-6 space-y-3">
              {group.options.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setPreferences((current) => ({ ...current, [option.label]: !current[option.label] }))}
                  className="flex w-full items-start justify-between gap-4 rounded-3xl border border-white/8 bg-white/6 px-4 py-4 text-left transition hover:border-white/14 hover:bg-white/8"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{option.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{option.description}</p>
                  </div>
                  <span
                    className={
                      preferences[option.label]
                        ? 'rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200'
                        : 'rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-slate-300'
                    }
                  >
                    {preferences[option.label] ? 'On' : 'Off'}
                  </span>
                </button>
              ))}
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <GlassCard className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">Authentication utilities</p>
          <form className="mt-5 space-y-4" onSubmit={handleResetRequest}>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Password reset email</span>
              <input
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
              />
            </label>
            <button
              type="submit"
              disabled={working}
              className="inline-flex items-center gap-2 rounded-full bg-medical-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-medical-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Request password reset
            </button>
          </form>
        </GlassCard>

        <GlassCard className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">Password management</p>
          <form className="mt-5 space-y-4" onSubmit={handlePasswordChange}>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Current password</span>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">New password</span>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
              />
            </label>
            <button
              type="submit"
              disabled={working}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Change password
            </button>
          </form>
        </GlassCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Theme', value: 'Dark default', icon: Gauge },
          { label: 'Security', value: 'JWT ready', icon: Lock },
          { label: 'Notifications', value: 'Clinical alerts', icon: BellRing },
          { label: 'Storage', value: 'SQLite dev / PostgreSQL ready', icon: Database },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <GlassCard key={item.label} className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-medical-500/12 p-3 text-medical-200 ring-1 ring-medical-400/15">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.value}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
