import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Sparkles, Stethoscope, Zap } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { dashboardHighlights, dashboardMetrics } from '@/data/mockData';

const quickFacts = [
  { label: 'Safety-first', value: 'Human in the loop', icon: ShieldCheck },
  { label: 'Clinical speed', value: 'Under 3 minutes', icon: Zap },
  { label: 'Premium shell', value: 'Glass + motion', icon: Sparkles },
];

export default function Home() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="space-y-10 pb-4">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
          <Badge variant="info" className="w-fit">
            Premium medical intelligence workspace
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl text-balance">
              A clinical-grade AI dashboard built for multiple medical modalities.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              This frontend is intentionally scaffolded for a future multi-model platform. It focuses on clarity,
              speed, and high-trust presentation while keeping diagnosis logic out of scope for now.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
              Live status: online
            </div>
            <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
              Updated {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-medical-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-medical-400"
            >
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Learn about the platform
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {quickFacts.map((fact) => {
              const Icon = fact.icon;
              return (
                <GlassCard key={fact.label} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/8 p-3 text-medical-200 ring-1 ring-white/10">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{fact.label}</p>
                      <p className="text-sm font-semibold text-white">{fact.value}</p>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </motion.div>

        <GlassCard className="relative overflow-hidden p-6">
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-medical-500/16 blur-3xl" />
          <div className="absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-sky-500/12 blur-3xl" />
          <div className="relative space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-medical-300">Live workspace</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Demo command center</h2>
              </div>
              <Badge variant="success">Stable UI</Badge>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {dashboardHighlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-3xl border border-white/8 bg-white/6 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-medical-500/12 p-3 text-medical-200 ring-1 ring-medical-400/15">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-400">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric, index) => (
          <StatCard key={metric.label} metric={metric} delay={index * 0.08} />
        ))}
      </section>

      <section className="space-y-5">
        <SectionHeader
          eyebrow="Architecture"
          title="Built for modular clinical expansion"
          description="The frontend is split into routed modality pages and reusable dashboard primitives so future AI models can be added cleanly."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {dashboardHighlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <GlassCard key={item.title} className="p-5" delay={index * 0.06}>
                <div className="space-y-4">
                  <div className="w-fit rounded-2xl bg-medical-500/15 p-3 text-medical-200 ring-1 ring-medical-400/15">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>
    </div>
  );
}
