import { FormEvent, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock3, FileClock, Search, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { getHistory, listHistory, type HistoryRecord } from '@/services/api/history';

const initialFilter = {
  status: '',
  search: '',
};

export default function History() {
  const [filter, setFilter] = useState(initialFilter);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

  const loadHistory = async (params = filter) => {
    try {
      setRefreshing(true);
      setError(null);
      const response = await listHistory(params);
      setRecords(response.items);
      setSelectedRecord(response.items[0] ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadHistory(filter);
  };

  const openRecord = async (historyId: string) => {
    try {
      setError(null);
      const detail = await getHistory(historyId);
      setSelectedRecord(detail);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load history detail.');
    }
  };

  return (
    <div className="space-y-8 pb-4">
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
        <SectionHeader
          eyebrow="History"
          title="Audit trail and study history"
          description="The history API now powers this screen so it behaves like a live operational record instead of a static list."
          action={<Badge variant="info">API connected</Badge>}
        />
      </motion.section>

      {error ? (
        <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <GlassCard className="p-6">
        <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end" onSubmit={handleSearch}>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Status filter</span>
            <input
              value={filter.status}
              onChange={(event) => setFilter((current) => ({ ...current, status: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
              placeholder="approved"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Search</span>
            <input
              value={filter.search}
              onChange={(event) => setFilter((current) => ({ ...current, search: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
              placeholder="Chest X-ray"
            />
          </label>
          <button
            type="submit"
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-medical-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-medical-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search history
          </button>
        </form>
      </GlassCard>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">Recent activity</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Timeline</h3>
            </div>
            <Badge variant="success">{loading ? 'Loading' : `${records.length} items`}</Badge>
          </div>

          <div className="mt-6 space-y-3">
            {records.length > 0 ? (
              records.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => void openRecord(record.id)}
                  className="w-full rounded-3xl border border-white/8 bg-white/6 p-4 text-left transition hover:border-white/14 hover:bg-white/8"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-medical-500/12 p-3 text-medical-200 ring-1 ring-medical-400/15">
                          <FileClock className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-white">{record.study_type}</h4>
                          <p className="mt-1 text-sm text-slate-400">{record.patient_ref}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                      <div className="rounded-full border border-white/8 bg-white/6 px-3 py-1.5">{record.created_at}</div>
                      <div className="rounded-full border border-white/8 bg-white/6 px-3 py-1.5">{record.reviewer}</div>
                      <div className="rounded-full border border-white/8 bg-white/6 px-3 py-1.5">{record.status}</div>
                    </div>
                  </div>
                </button>
              ))
            ) : loading ? (
              <div className="rounded-3xl border border-white/8 bg-white/6 p-4 text-sm text-slate-400">Loading history records...</div>
            ) : (
              <EmptyState
                title="No history items"
                description="The backend returned an empty audit trail for the current filter set."
                icon={Clock3}
              />
            )}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-medical-500/12 p-3 text-medical-200 ring-1 ring-medical-400/15">
                <Clock3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Selected record</p>
                <p className="text-xs text-slate-400">Loaded directly from the backend detail endpoint</p>
              </div>
            </div>

            {selectedRecord ? (
              <div className="mt-5 space-y-3 rounded-3xl border border-white/8 bg-white/6 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">{selectedRecord.study_type}</p>
                <p>Patient ref: {selectedRecord.patient_ref}</p>
                <p>Status: {selectedRecord.status}</p>
                <p>Reviewer: {selectedRecord.reviewer}</p>
                <p>Created: {selectedRecord.created_at ?? 'N/A'}</p>
              </div>
            ) : (
              <EmptyState
                title="Select a record"
                description="Pick a history item to inspect the detail endpoint response."
                icon={FileClock}
              />
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-medical-500/12 p-3 text-medical-200 ring-1 ring-medical-400/15">
                <FileClock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Retention</p>
                <p className="text-xs text-slate-400">History is ready for future filters and exports</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
