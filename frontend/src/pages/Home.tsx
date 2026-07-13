import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Brain,
  Camera,
  Clock3,
  FileClock,
  FileText,
  HeartPulse,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { cn } from '@/lib/cn';
import { getDashboardStats, type DashboardStats } from '@/services/api/dashboard';

const quickLinks = [
  { label: 'Chest X-ray', path: '/chest-xray', description: 'Radiology workstation', icon: Stethoscope },
  { label: 'Brain MRI', path: '/brain-mri', description: 'Neurology pipeline', icon: Brain },
  { label: 'Diabetic Retinopathy', path: '/diabetic-retinopathy', description: 'Retina analysis', icon: ShieldCheck },
  { label: 'Face Recognition', path: '/face-recognition', description: 'Identity workflow', icon: Camera },
];

const modelHighlights = [
  { path: '/chest-xray', label: 'Chest X-ray', icon: Stethoscope, tone: 'teal' },
  { path: '/brain-mri', label: 'Brain MRI', icon: Brain, tone: 'sky' },
  { path: '/diabetic-retinopathy', label: 'Diabetic Retinopathy', icon: ShieldCheck, tone: 'violet' },
];

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await getDashboardStats();
        setStats(response);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
  }, []);

  const metricCards = useMemo(
    () => [
      {
        label: 'Total predictions',
        value: loading ? '...' : `${stats?.total_predictions ?? 0}`,
        delta: 'All stored AI results',
        note: 'Across every saved clinical prediction',
        icon: FileText,
        tone: 'teal' as const,
      },
      {
        label: "Today's predictions",
        value: loading ? '...' : `${stats?.today_predictions ?? 0}`,
        delta: 'Current day',
        note: 'Predictions uploaded and processed today',
        icon: FileClock,
        tone: 'sky' as const,
      },
      {
        label: 'Average turnaround',
        value: loading ? '...' : `${(Number(stats?.average_turnaround_seconds) ?? 0).toFixed(2)} sec`,
        delta: 'Processing time',
        note: 'Average prediction duration from the backend',
        icon: Clock3,
        tone: 'violet' as const,
      },
      {
        label: 'Configured accuracy',
        value: loading ? '...' : `${(Number(stats?.average_accuracy) ?? 0).toFixed(1)}%`,
        delta: `${stats?.active_models ?? 0} active models`,
        note: 'Aggregated deployment accuracy by model family',
        icon: HeartPulse,
        tone: 'amber' as const,
      },
    ],
    [loading, stats],
  );

  return (
    <div className="space-y-10 pb-4">
      <section>
        <SectionHeader
          eyebrow="Home"
          title="Medical AI command center"
          description="A live, backend-driven dashboard for imaging predictions, recent activity, and fast navigation across the platform."
          action={<Badge variant="success">{loading ? 'Syncing' : 'Live data'}</Badge>}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric, index) => (
          <StatCard key={metric.label} metric={metric} delay={index * 0.08} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard className="relative overflow-hidden p-6">
          <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-medical-500/15 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">Recent activity</p>
                <h3 className="mt-2 text-2xl font-bold text-white">Latest predictions</h3>
              </div>
              <Badge variant="info">Backend synced</Badge>
            </div>

            <div className="mt-6 space-y-3">
              {stats?.recent_predictions?.length ? (
                stats.recent_predictions.map((prediction) => (
                  <div key={prediction.id} className="rounded-3xl border border-white/8 bg-white/6 p-4 transition hover:border-white/14 hover:bg-white/8">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-2xl bg-medical-500/12 p-3 text-medical-200 ring-1 ring-medical-400/15">
                            <ScanSearch className="h-4 w-4" />
                          </span>
                          <div>
                            <h4 className="text-base font-semibold text-white">{prediction.study_type}</h4>
                            <p className="mt-1 text-sm text-slate-400">{prediction.model_name}</p>
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Prediction</p>
                          <p className="mt-1 font-semibold text-white">{prediction.prediction}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Confidence</p>
                          <p className="mt-1 font-semibold text-white">{(Number(prediction.confidence) ?? 0).toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Time</p>
                          <p className="mt-1 font-semibold text-white">{Number(prediction.prediction_time) ?? Number(prediction.created_at) ?? 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : loading ? (
                <div className="rounded-3xl border border-white/8 bg-white/6 p-4 text-sm text-slate-400">Loading recent predictions...</div>
              ) : (
                <EmptyState
                  title="No predictions yet"
                  description="Once the backend stores studies, recent predictions will appear here."
                  icon={FileText}
                />
              )}
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">Quick navigation</p>
                <h3 className="mt-2 text-xl font-bold text-white">Open a module</h3>
              </div>
              <ArrowRight className="h-5 w-5 text-medical-200" />
            </div>
            <div className="mt-5 space-y-3">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center justify-between rounded-3xl border border-white/8 bg-white/6 px-4 py-3 transition hover:border-white/14 hover:bg-white/8"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-2xl bg-white/8 p-3 text-medical-200 ring-1 ring-white/10">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </Link>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">Model overview</p>
                <h3 className="mt-2 text-xl font-bold text-white">Available AI models</h3>
              </div>
              <Sparkles className="h-5 w-5 text-medical-200" />
            </div>

            <div className="mt-5 space-y-3">
              {stats?.model_breakdown?.length ? stats.model_breakdown.map((item) => {
                const config = modelHighlights.find((entry) => entry.label === item.label);
                const Icon = config?.icon ?? ShieldCheck;
                return (
                  <div key={item.modality} className="rounded-3xl border border-white/8 bg-white/6 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'rounded-2xl p-3 ring-1',
                          config?.tone === 'sky' ? 'bg-sky-500/12 text-sky-200 ring-sky-400/15' :
                          config?.tone === 'violet' ? 'bg-violet-500/12 text-violet-200 ring-violet-400/15' :
                          'bg-teal-500/12 text-teal-200 ring-teal-400/15',
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{item.label}</p>
                          <p className="mt-1 text-xs text-slate-400">{item.predictions} stored predictions</p>
                        </div>
                      </div>
                      <Badge variant="info">{Number(item.accuracy).toFixed(1)}%</Badge>
                    </div>
                  </div>
                );
              }) : (
                <div className="rounded-3xl border border-white/8 bg-white/6 p-4 text-sm text-slate-400">
                  No model breakdown available yet.
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
