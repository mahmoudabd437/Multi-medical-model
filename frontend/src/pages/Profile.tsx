import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, UserCircle2, Loader2, LogOut, RefreshCw, ShieldCheck } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { profileCapabilities, profileMetrics } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';

export default function Profile() {
  const { user, isAuthenticated, loading, signIn, signOut, refreshUser } = useAuth();
  const [credentials, setCredentials] = useState({
    email: user?.email ?? 'amelia.carter@medaiplatform.dev',
    password: 'password123',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setWorking(true);
      setMessage(null);
      await signIn(credentials.email, credentials.password);
      setMessage('Session synchronized with the backend auth endpoint.');
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : 'Unable to sign in.');
    } finally {
      setWorking(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setWorking(true);
      setMessage(null);
      await signOut();
      setMessage('Signed out successfully.');
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : 'Unable to sign out.');
    } finally {
      setWorking(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setWorking(true);
      setMessage(null);
      await refreshUser();
      setMessage('Profile refreshed from the backend.');
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : 'Unable to refresh profile.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-8 pb-4">
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
        <SectionHeader
          eyebrow="Profile"
          title="Clinician identity"
          description="Profile data now comes from the backend auth layer, which is already shaped for real JWT-based sessions."
          action={<Badge variant={isAuthenticated ? 'success' : 'warning'}>{isAuthenticated ? 'Signed in' : 'Guest'}</Badge>}
        />
      </motion.section>

      {message ? (
        <div className="rounded-3xl border border-medical-400/20 bg-medical-500/10 px-4 py-3 text-sm text-medical-100">
          {message}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name ?? 'Guest User'} initials={user?.initials ?? 'GU'} className="h-16 w-16" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">Primary profile</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{user?.name ?? 'Guest User'}</h3>
              <p className="mt-1 text-sm text-slate-400">{user?.role ?? 'Viewer'} - {user?.department ?? 'Clinical'}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 rounded-3xl border border-white/8 bg-white/6 px-4 py-3">
              <Mail className="h-4 w-4 text-medical-200" />
              <span className="text-sm text-slate-200">{user?.email ?? 'No email available'}</span>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-white/8 bg-white/6 px-4 py-3">
              <UserCircle2 className="h-4 w-4 text-medical-200" />
              <span className="text-sm text-slate-200">Backend-backed session state with a mock user response</span>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-white/8 bg-white/6 px-4 py-3">
              <ShieldCheck className="h-4 w-4 text-medical-200" />
              <span className="text-sm text-slate-200">Authentication endpoints are ready for a real JWT flow later</span>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {profileMetrics.map((metric) => (
              <GlassCard key={metric.label} className="p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{metric.label}</p>
                <p className="mt-3 text-lg font-bold text-white">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{metric.description}</p>
              </GlassCard>
            ))}
          </div>

          <GlassCard className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">Session tools</p>
            <form className="mt-5 space-y-4" onSubmit={handleSignIn}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Email</span>
                  <input
                    value={credentials.email}
                    onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Password</span>
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={working || loading}
                  className="inline-flex items-center gap-2 rounded-full bg-medical-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-medical-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {working || loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Sync session
                </button>
                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={working || loading}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh user
                </button>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={working || loading}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </form>
          </GlassCard>

          <GlassCard className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">Capabilities</p>
            <div className="mt-4 space-y-3">
              {profileCapabilities.map((item) => (
                <div key={item} className="rounded-3xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
