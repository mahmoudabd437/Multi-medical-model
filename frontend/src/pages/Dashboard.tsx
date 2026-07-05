import { FormEvent, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock3, FileClock, Layers3, ScanSearch, Loader2, FileText } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { dashboardQuickLinks } from '@/routes/navigation';
import { dashboardMetrics, dashboardStudies } from '@/data/mockData';
import { cn } from '@/lib/cn';
import { listPredictions, type PredictionRecord } from '@/services/api/predictions';
import { listHistory, type HistoryRecord } from '@/services/api/history';
import { generateReport, listReports, type ReportRecord } from '@/services/api/reports';

const actionTiles = [
  { label: 'Chest X-ray', description: 'Open the available radiology module', icon: ScanSearch },
  { label: 'History', description: 'Review audit-ready study history', icon: FileClock },
  { label: 'Model pipeline', description: 'Track future modality rollouts', icon: Layers3 },
];

export default function Dashboard() {
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [reportForm, setReportForm] = useState({
    title: 'Daily Chest X-ray Summary',
    format: 'pdf' as 'pdf' | 'xlsx' | 'csv',
    scope: 'radiology',
  });

  const loadOverview = async () => {
    try {
      setLoading(true);
      const [predictionResponse, historyResponse, reportResponse] = await Promise.all([
        listPredictions({ page_size: 3 }),
        listHistory({ page_size: 3 }),
        listReports({ page_size: 3 }),
      ]);
      setPredictions(predictionResponse.items);
      setHistory(historyResponse.items);
      setReports(reportResponse.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const handleGenerateReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setReportLoading(true);
      setReportMessage(null);
      const generated = await generateReport(reportForm);
      setReportMessage(`Report queued with status ${generated.status}.`);
      const refreshed = await listReports({ page_size: 3 });
      setReports(refreshed.items);
    } catch (requestError) {
      setReportMessage(requestError instanceof Error ? requestError.message : 'Report generation failed.');
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-4">
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
        <SectionHeader
          eyebrow="Dashboard"
          title="Clinical control center"
          description="The dashboard now queries the backend for predictions, history, and reports so the entire shell behaves like a live AI platform."
          action={<Badge variant="info">API connected</Badge>}
        />
      </motion.section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric, index) => (
          <StatCard key={metric.label} metric={metric} delay={index * 0.08} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">Recent studies</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Operational snapshot</h3>
            </div>
            <Badge variant="success">Updated now</Badge>
          </div>

          <div className="mt-6 space-y-3">
            {dashboardStudies.map((study) => (
              <div key={study.name} className="rounded-3xl border border-white/8 bg-white/6 p-4 transition hover:border-white/14 hover:bg-white/8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className={cn('h-2.5 w-2.5 rounded-full', study.color === 'teal' ? 'bg-teal-400' : study.color === 'blue' ? 'bg-sky-400' : study.color === 'violet' ? 'bg-violet-400' : 'bg-amber-400')} />
                      <h4 className="text-base font-semibold text-white">{study.name}</h4>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{study.modality} - {study.status}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-300">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Confidence</p>
                      <p className="mt-1 font-semibold text-white">{study.confidence}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Time</p>
                      <p className="mt-1 font-semibold text-white">{study.timestamp}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">Quick metrics</p>
                <h3 className="mt-2 text-xl font-bold text-white">Workflow health</h3>
              </div>
              <Clock3 className="h-5 w-5 text-medical-200" />
            </div>
            <div className="mt-5 space-y-4">
              {dashboardQuickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center justify-between rounded-3xl border border-white/8 bg-white/6 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-medical-500/12 p-2 text-medical-200 ring-1 ring-medical-400/15">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-white">{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-200">{item.value}</span>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">Quick actions</p>
                <h3 className="mt-2 text-xl font-bold text-white">Navigate faster</h3>
              </div>
              <ArrowUpRight className="h-5 w-5 text-medical-200" />
            </div>
            <div className="mt-5 space-y-3">
              {actionTiles.map((tile) => {
                const Icon = tile.icon;
                return (
                  <div key={tile.label} className="rounded-3xl border border-white/8 bg-white/6 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white/8 p-3 text-medical-200 ring-1 ring-white/10">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{tile.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">{tile.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">Latest backend signals</p>
              <h3 className="mt-2 text-2xl font-bold text-white">API snapshot</h3>
            </div>
            <Badge variant={loading ? 'warning' : 'success'}>{loading ? 'Loading' : 'Synced'}</Badge>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Predictions</p>
              <p className="mt-2 text-2xl font-bold text-white">{predictions.length}</p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">History</p>
              <p className="mt-2 text-2xl font-bold text-white">{history.length}</p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/6 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Reports</p>
              <p className="mt-2 text-2xl font-bold text-white">{reports.length}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {predictions.length > 0 ? predictions.slice(0, 3).map((prediction) => (
              <div key={prediction.id} className="rounded-3xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-slate-300">
                <p className="font-semibold text-white">{prediction.study_type}</p>
                <p className="mt-1 text-slate-400">{prediction.summary}</p>
              </div>
            )) : (
              <EmptyState title="No predictions yet" description="Prediction records will appear here after the backend responds." icon={FileText} />
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">Report generation</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Backend report queue</h3>
            </div>
            <Badge variant="info">POST /api/v1/reports/generate/</Badge>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleGenerateReport}>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Report title</span>
                <input
                  value={reportForm.title}
                  onChange={(event) => setReportForm((current) => ({ ...current, title: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Format</span>
                <select
                  value={reportForm.format}
                  onChange={(event) => setReportForm((current) => ({ ...current, format: event.target.value as 'pdf' | 'xlsx' | 'csv' }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
                >
                  <option value="pdf">PDF</option>
                  <option value="xlsx">XLSX</option>
                  <option value="csv">CSV</option>
                </select>
              </label>
            </div>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Scope</span>
              <input
                value={reportForm.scope}
                onChange={(event) => setReportForm((current) => ({ ...current, scope: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
              />
            </label>
            <button
              type="submit"
              disabled={reportLoading}
              className="inline-flex items-center gap-2 rounded-full bg-medical-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-medical-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Generate report
            </button>
          </form>

          {reportMessage ? (
            <div className="mt-5 rounded-3xl border border-medical-400/20 bg-medical-500/10 px-4 py-3 text-sm text-medical-100">
              {reportMessage}
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {reports.length > 0 ? reports.map((report) => (
              <div key={report.id} className="rounded-3xl border border-white/8 bg-white/6 px-4 py-3 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{report.title}</p>
                    <p className="mt-1 text-slate-400">{report.format} - {report.status}</p>
                  </div>
                  <Badge variant={report.status === 'ready' ? 'success' : 'warning'}>{report.status}</Badge>
                </div>
              </div>
            )) : (
              <EmptyState title="No reports yet" description="Generate a report to populate the backend queue." icon={FileText} />
            )}
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
