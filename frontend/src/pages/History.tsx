import { useEffect, useMemo, useState } from 'react';
import { Brain, Camera, FileClock, FileText, Loader2, Search, ShieldCheck, Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { listHistory, type HistoryRecord } from '@/services/api/history';

const modelFilters = [
  { label: 'All', value: 'all', icon: FileClock },
  { label: 'Chest X-ray', value: 'chest_xray', icon: Stethoscope },
  { label: 'Brain MRI', value: 'brain_mri', icon: Brain },
  { label: 'Diabetic Retinopathy', value: 'diabetic_retinopathy', icon: ShieldCheck },
  { label: 'Face Recognition', value: 'face_recognition', icon: Camera },
] as const;

function formatDateTime(value?: string) {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

export default function History() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<(typeof modelFilters)[number]['value']>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const response = await listHistory({
          modality: selectedModel === 'all' ? undefined : selectedModel,
          search: search.trim() || undefined,
          ordering: '-prediction_time',
          page_size: 100,
        });
        setRecords(response.items);
      } finally {
        setLoading(false);
      }
    };

    void loadHistory();
  }, [selectedModel, search]);

  const filteredRecords = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return records;
    }

    return records.filter((record) =>
      [record.filename, record.prediction, record.model_name, record.study_type]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalized)),
    );
  }, [records, search]);

  return (
    <div className="space-y-8 pb-4">
      <section>
        <SectionHeader
          eyebrow="History"
          title="Prediction history"
          description="A unified audit trail for all stored predictions, with model filtering and medical-grade presentation."
          action={<Badge variant="info">{filteredRecords.length} records</Badge>}
        />
      </section>

      <GlassCard className="p-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Filter by model</span>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              {modelFilters.map((option) => {
                const Icon = option.icon;
                const active = selectedModel === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedModel(option.value)}
                    className={`flex items-center gap-3 rounded-3xl border px-4 py-3 text-left transition ${
                      active ? 'border-medical-400/30 bg-medical-400/12 text-white shadow-glow' : 'border-white/8 bg-white/6 text-slate-300 hover:border-white/12 hover:bg-white/8'
                    }`}
                  >
                    <Icon className="h-4 w-4 text-medical-200" />
                    <span className="text-sm font-semibold">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Search</span>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                placeholder="Search file, model, or prediction"
              />
            </div>
          </label>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">Audit trail</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Prediction records</h3>
          </div>
          <Badge variant={loading ? 'warning' : 'success'}>{loading ? 'Loading' : `${filteredRecords.length} items`}</Badge>
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="rounded-3xl border border-white/8 bg-white/6 p-4 text-sm text-slate-400">
              <Loader2 className="inline h-4 w-4 animate-spin" /> Loading prediction history...
            </div>
          ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
              <div key={record.id} className="rounded-3xl border border-white/8 bg-white/6 p-4 transition hover:border-white/14 hover:bg-white/8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-xs font-semibold text-slate-300">
                      {(record.study_type ?? 'NA').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-white">{record.study_type}</h4>
                      <p className="mt-1 text-sm text-slate-400">{record.filename ?? 'Unknown file'}</p>
                      <p className="mt-1 text-sm text-slate-300">{record.prediction ?? 'N/A'} - {record.model_name ?? 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Confidence</p>
                      <p className="mt-1 font-semibold text-white">{(record.confidence ?? 0).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Date</p>
                      <p className="mt-1 font-semibold text-white">{record.date ?? formatDateTime(record.prediction_time).split(',')[0]}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Time</p>
                      <p className="mt-1 font-semibold text-white">{record.time ?? formatDateTime(record.prediction_time).split(',')[1] ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Model</p>
                      <p className="mt-1 font-semibold text-white">{record.model_name ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Status</p>
                      <p className="mt-1 font-semibold text-white">{record.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No history records"
              description="There are no records for the selected model and search criteria."
              icon={FileText}
            />
          )}
        </div>
      </GlassCard>
    </div>
  );
}
