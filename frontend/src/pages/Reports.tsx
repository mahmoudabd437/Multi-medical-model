import { useEffect, useMemo, useState } from 'react';
import { Brain, FileText, Loader2, Search, ShieldCheck, Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { listReports, type ReportRecord } from '@/services/api/reports';

const modelOptions = [
  { label: 'Chest X-ray', value: 'chest_xray', icon: Stethoscope },
  { label: 'Brain MRI', value: 'brain_mri', icon: Brain },
  { label: 'Diabetic Retinopathy', value: 'diabetic_retinopathy', icon: ShieldCheck },
] as const;

type SortField = 'prediction_time' | 'upload_time' | 'confidence' | 'filename' | 'model_name';

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

function compareValues(leftValue: string | number | undefined, rightValue: string | number | undefined, sortDirection: 'asc' | 'desc') {
  const leftDate = new Date(leftValue ?? '').getTime();
  const rightDate = new Date(rightValue ?? '').getTime();
  const leftComparable = typeof leftValue === 'number' ? leftValue : Number.isNaN(leftDate) ? String(leftValue ?? '').toLowerCase() : leftDate;
  const rightComparable = typeof rightValue === 'number' ? rightValue : Number.isNaN(rightDate) ? String(rightValue ?? '').toLowerCase() : rightDate;

  if (leftComparable < rightComparable) {
    return sortDirection === 'asc' ? -1 : 1;
  }

  if (leftComparable > rightComparable) {
    return sortDirection === 'asc' ? 1 : -1;
  }

  return 0;
}

export default function Reports() {
  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<'chest_xray' | 'brain_mri' | 'diabetic_retinopathy'>('chest_xray');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('prediction_time');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    const loadRecords = async () => {
      try {
        setLoading(true);
        const response = await listReports({ modality: model, date: 'today', ordering: `-${sortBy}` });
        setRecords(response.items);
      } finally {
        setLoading(false);
      }
    };

    void loadRecords();
  }, [model, sortBy]);

  const filteredRecords = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const sorted = [...records].sort((left, right) =>
      compareValues(left[sortBy] as string | number | undefined, right[sortBy] as string | number | undefined, sortDirection),
    );

    if (!normalized) {
      return sorted;
    }

    return sorted.filter((record) =>
      [record.filename, record.prediction, record.model_name, record.study_type]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalized)),
    );
  }, [records, search, sortBy, sortDirection]);

  const summary = useMemo(() => {
    const averageProcessing = filteredRecords.length
      ? filteredRecords.reduce((accumulator, record) => accumulator + (record.processing_time ?? 0), 0) / filteredRecords.length
      : 0;

    return {
      total: filteredRecords.length,
      averageProcessing,
    };
  }, [filteredRecords]);

  const exportCsv = () => {
    const header = ['File Name', 'Prediction', 'Confidence', 'Upload Time', 'Prediction Time', 'Processing Time', 'Model Name'];
    const rows = filteredRecords.map((record) => [
      record.filename ?? '',
      record.prediction ?? '',
      (record.confidence ?? 0).toFixed(2),
      record.upload_time ?? '',
      record.prediction_time ?? '',
      (record.processing_time ?? 0).toFixed(2),
      record.model_name ?? '',
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `reports-${model}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const win = window.open('', '_blank', 'width=1200,height=900');
    if (!win) {
      return;
    }

    const rows = filteredRecords
      .map(
        (record) => `
          <tr>
            <td>${record.filename ?? ''}</td>
            <td>${record.prediction ?? ''}</td>
            <td>${(record.confidence ?? 0).toFixed(2)}%</td>
            <td>${formatDateTime(record.upload_time)}</td>
            <td>${formatDateTime(record.prediction_time)}</td>
            <td>${(record.processing_time ?? 0).toFixed(2)} sec</td>
            <td>${record.model_name ?? ''}</td>
          </tr>
        `,
      )
      .join('');

    win.document.write(`
      <html>
        <head>
          <title>Medical AI Report</title>
          <style>
            body { background: #020617; color: #e2e8f0; font-family: Arial, sans-serif; padding: 32px; }
            h1 { margin: 0 0 8px; }
            p { color: #94a3b8; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th, td { border-bottom: 1px solid #1e293b; padding: 12px 10px; text-align: left; font-size: 12px; }
            th { color: #cbd5e1; text-transform: uppercase; letter-spacing: .08em; }
          </style>
        </head>
        <body>
          <h1>${modelOptions.find((option) => option.value === model)?.label ?? 'Report'}</h1>
          <p>${summary.total} records - Average processing ${summary.averageProcessing.toFixed(2)} sec</p>
          <table>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Prediction</th>
                <th>Confidence</th>
                <th>Upload Time</th>
                <th>Prediction Time</th>
                <th>Processing</th>
                <th>Model</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="space-y-8 pb-4">
      <section>
        <SectionHeader
          eyebrow="Reports"
          title="Today's prediction reports"
          description="Choose a model, review only today's stored predictions, and export the filtered report as CSV or PDF."
          action={<Badge variant="info">{summary.total} rows</Badge>}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Selected model</p>
          <p className="mt-2 text-lg font-semibold text-white">{modelOptions.find((option) => option.value === model)?.label}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Today's rows</p>
          <p className="mt-2 text-lg font-semibold text-white">{summary.total}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Average processing</p>
          <p className="mt-2 text-lg font-semibold text-white">{summary.averageProcessing.toFixed(2)} sec</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Export tools</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={exportCsv} className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
              CSV
            </button>
            <button type="button" onClick={exportPdf} className="rounded-full bg-medical-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-medical-400">
              PDF
            </button>
          </div>
        </GlassCard>
      </section>

      <GlassCard className="p-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:items-end">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Model</span>
            <div className="grid gap-2 sm:grid-cols-3">
              {modelOptions.map((option) => {
                const Icon = option.icon;
                const active = model === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setModel(option.value)}
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
                placeholder="Search file, prediction, or model"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Sort by</span>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortField)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="prediction_time">Prediction time</option>
                <option value="upload_time">Upload time</option>
                <option value="confidence">Confidence</option>
                <option value="filename">File name</option>
                <option value="model_name">Model name</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))}
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {sortDirection === 'asc' ? 'Asc' : 'Desc'}
              </button>
            </div>
          </label>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">Report entries</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Medical report table</h3>
          </div>
          <Badge variant={loading ? 'warning' : 'success'}>{loading ? 'Loading' : `${filteredRecords.length} items`}</Badge>
        </div>

        <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/8">
          <div className="hidden lg:block">
            <table className="min-w-full divide-y divide-white/8 text-left text-sm">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.22em] text-slate-400">
                <tr>
                  <th className="px-4 py-4">File Name</th>
                  <th className="px-4 py-4">Prediction</th>
                  <th className="px-4 py-4">Confidence</th>
                  <th className="px-4 py-4">Upload Time</th>
                  <th className="px-4 py-4">Prediction Time</th>
                  <th className="px-4 py-4">Processing Time</th>
                  <th className="px-4 py-4">Model Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8 bg-white/4">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </td>
                  </tr>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-white/6">
                    <td className="px-4 py-4 text-white">{record.filename ?? 'Unknown'}</td>
                    <td className="px-4 py-4 text-slate-200">{record.prediction ?? 'N/A'}</td>
                    <td className="px-4 py-4 text-slate-200">{(record.confidence ?? 0).toFixed(2)}%</td>
                    <td className="px-4 py-4 text-slate-300">{formatDateTime(record.upload_time)}</td>
                    <td className="px-4 py-4 text-slate-300">{formatDateTime(record.prediction_time)}</td>
                    <td className="px-4 py-4 text-slate-300">{(record.processing_time ?? 0).toFixed(2)} sec</td>
                    <td className="px-4 py-4 text-slate-300">{record.model_name ?? 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10">
                    <EmptyState
                      title="No report rows"
                      description="There are no predictions for the selected model today."
                      icon={FileText}
                    />
                  </td>
                </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 lg:hidden">
            {loading ? (
              <div className="flex items-center justify-center px-4 py-10 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <div key={record.id} className="rounded-3xl border border-white/8 bg-white/6 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-xs font-semibold text-slate-300">
                      NA
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-semibold text-white">{record.filename ?? 'Unknown file'}</p>
                      <p className="text-sm text-slate-400">{record.prediction ?? 'N/A'} - {record.model_name ?? 'N/A'}</p>
                      <p className="text-sm text-slate-300">{(record.confidence ?? 0).toFixed(2)}% confidence</p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                    <p>Upload: {formatDateTime(record.upload_time)}</p>
                    <p>Prediction: {formatDateTime(record.prediction_time)}</p>
                    <p>Processing: {(record.processing_time ?? 0).toFixed(2)} sec</p>
                    <p>Model: {record.model_name ?? 'N/A'}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No report rows" description="There are no predictions for the selected model today." icon={FileText} />
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
