import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { AlertTriangle, Eye, CheckCircle2, CloudUpload, Loader2, ScanSearch, UploadCloud, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getHistory, listHistory, type HistoryRecord } from '@/services/api/history';
import {
  analyzeDiabeticRetinopathy,
  type DiabeticRetinopathyAnalyzeResponse,
  type DiabeticRetinopathyModelKey,
} from '@/services/api/predictions';

const modelOptions = [
  {
    value: 'efficientnetb0_dr',
    label: 'EfficientNetB0 DR',
    description: 'Transfer-learning retina classifier for diabetic retinopathy staging',
  },
  {
    value: 'convnext_dr',
    label: 'ConvNeXt DR',
    description: 'ConvNeXt-based retinal image classifier trained on the DR dataset',
  },
] as const;

const initialForm = {
  study_id: 'dr_1001',
  notes: 'Retinal fundus image for diabetic retinopathy screening.',
};

function toNumber(value: unknown, fallback = 0) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getResultVariant(prediction?: string) {
  if (!prediction) {
    return 'neutral';
  }

  return prediction.toLowerCase().includes('no dr') ? 'success' : 'warning';
}

export default function DiabeticRetinopathy() {
  const [form, setForm] = useState(initialForm);
  const [selectedModel, setSelectedModel] = useState<DiabeticRetinopathyModelKey>('efficientnetb0_dr');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DiabeticRetinopathyAnalyzeResponse | null>(null);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<HistoryRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedModelOption = useMemo(
    () => modelOptions.find((model) => model.value === selectedModel) ?? modelOptions[0],
    [selectedModel],
  );
  const isLowConfidence = toNumber(analysisResult?.confidence) < 50;
  const displayedPrediction = analysisResult ? (isLowConfidence ? 'Cannot define' : analysisResult.prediction) : null;
  const sortedScores = useMemo(
    () => Object.entries(analysisResult?.scores ?? {}).sort((a, b) => b[1] - a[1]),
    [analysisResult],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        const response = await listHistory({ status: 'completed', modality: 'diabetic_retinopathy' });
        setHistoryRecords(response.items);
        setSelectedHistory(response.items[0] ?? null);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Failed to load retinal history.');
      } finally {
        setLoadingHistory(false);
      }
    };

    void loadHistory();
  }, []);

  const refreshHistory = async (highlightId?: string) => {
    try {
      const response = await listHistory({ status: 'completed', modality: 'diabetic_retinopathy' });
      setHistoryRecords(response.items);
      setSelectedHistory(response.items.find((item) => item.id === highlightId) ?? response.items[0] ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to refresh retinal history.');
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFile = (file: File | null) => {
    if (!file) {
      clearSelection();
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Unsupported file format. Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setAnalysisResult(null);
    setError(null);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0] ?? null);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please upload a retinal image before analyzing.');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      const response = await analyzeDiabeticRetinopathy({
        image: selectedFile,
        study_id: form.study_id,
        notes: form.notes,
        model: selectedModel,
      });

      setAnalysisResult(response);
      await refreshHistory(response.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Retinal analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const openHistoryRecord = async (historyId: string) => {
    try {
      setError(null);
      const detail = await getHistory(historyId);
      setSelectedHistory(detail);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load the saved retinal scan.');
    }
  };

  return (
    <div className="space-y-8 pb-6">
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
        <SectionHeader
          eyebrow="Diabetic Retinopathy"
          title="Diabetic retinopathy analysis"
          description="Upload a retinal fundus image, choose EfficientNetB0 or ConvNeXt, and review multi-class DR probabilities."
          action={<Badge variant="success">{selectedModelOption.label} active</Badge>}
        />
      </motion.section>

      <AnimatePresence>
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 rounded-3xl border border-rose-400/25 bg-rose-500/10 px-4 py-4 text-sm text-rose-100"
          >
            <div className="mt-0.5 rounded-full bg-rose-500/20 p-2 text-rose-200 ring-1 ring-rose-400/25">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">Action required</p>
              <p className="mt-1 text-rose-100/90">{error}</p>
            </div>
            <button type="button" onClick={() => setError(null)} className="text-rose-200 transition hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Upload workspace</p>
                <h3 className="mt-2 text-2xl font-bold text-white">Drop a retinal image to analyze</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">Multipart upload</Badge>
                <Badge variant="success">Saved to history</Badge>
              </div>
            </div>

            <div
              onDragEnter={() => setIsDragging(true)}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`mt-6 rounded-[2rem] border border-dashed p-6 transition duration-300 ${
                isDragging
                  ? 'border-emerald-400/60 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(16,185,129,0.22),0_24px_80px_rgba(16,185,129,0.16)]'
                  : 'border-white/12 bg-slate-950/55'
              }`}
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />

              <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-500/12 p-3 text-emerald-200 ring-1 ring-emerald-400/15">
                      <CloudUpload className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Upload image</p>
                      <p className="text-xs text-slate-400">JPG, PNG, or WEBP</p>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[1.75rem] border border-white/8 bg-white/4 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Study ID</p>
                    <input
                      value={form.study_id}
                      onChange={(event) => setForm((current) => ({ ...current, study_id: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/45 focus:ring-2 focus:ring-emerald-400/15"
                      placeholder="dr_1001"
                    />

                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Model</p>
                    <select
                      value={selectedModel}
                      onChange={(event) => setSelectedModel(event.target.value as DiabeticRetinopathyModelKey)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/45 focus:ring-2 focus:ring-emerald-400/15"
                    >
                      {modelOptions.map((model) => (
                        <option key={model.value} value={model.value}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs leading-5 text-slate-400">{selectedModelOption.description}</p>

                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Clinical note</p>
                    <textarea
                      rows={4}
                      value={form.notes}
                      onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/45 focus:ring-2 focus:ring-emerald-400/15"
                      placeholder="Optional note"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                      <UploadCloud className="h-4 w-4" />
                      Choose image
                    </Button>
                    <Button type="button" variant="outline" onClick={clearSelection}>
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Preview</p>
                      <p className="text-xs text-slate-400">Inspect the fundus image before inference</p>
                    </div>
                    <Badge variant={selectedFile ? 'success' : 'neutral'}>{selectedFile ? 'Ready' : 'No file selected'}</Badge>
                  </div>

                  <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 p-4">
                    {previewUrl ? (
                      <motion.img
                        key={previewUrl}
                        src={previewUrl}
                        alt="Retinal image preview"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35 }}
                        className="h-[320px] w-full rounded-[1.5rem] object-contain"
                      />
                    ) : (
                      <div className="flex h-[320px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-white/4 px-6 text-center">
                        <div className="rounded-full bg-emerald-500/12 p-4 text-emerald-200 ring-1 ring-emerald-400/15">
                          <ScanSearch className="h-7 w-7" />
                        </div>
                        <p className="mt-4 text-lg font-semibold text-white">Preview will appear here</p>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                          Upload a retinal fundus image to inspect it before sending it to the selected inference model.
                        </p>
                      </div>
                    )}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="min-w-0 rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Target size</p>
                        <p className="mt-1 break-words text-xs font-semibold leading-5 text-white sm:text-sm">224 x 224</p>
                      </div>
                      <div className="min-w-0 rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Input</p>
                        <p className="mt-1 break-words text-xs font-semibold leading-5 text-white sm:text-sm">RGB fundus image</p>
                      </div>
                    </div>
                  </div>

                  <Button type="button" className="w-full py-3" disabled={analyzing || !selectedFile} onClick={() => void handleAnalyze()}>
                    {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                    {analyzing ? 'Analyzing image' : 'Analyze retinal image'}
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Saved scans</p>
                <h3 className="mt-2 text-xl font-bold text-white">Retinopathy history</h3>
              </div>
              <Badge variant="info">Database synced</Badge>
            </div>

            <div className="mt-5 space-y-3">
              {loadingHistory ? (
                <div className="space-y-3">
                  <div className="h-20 animate-pulse rounded-3xl bg-white/6" />
                  <div className="h-20 animate-pulse rounded-3xl bg-white/6" />
                </div>
              ) : historyRecords.length > 0 ? (
                historyRecords.slice(0, 4).map((record) => (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => void openHistoryRecord(record.id)}
                    className="flex w-full items-center justify-between gap-4 rounded-3xl border border-white/8 bg-white/5 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-white/14 hover:bg-white/8"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{record.study_type}</p>
                      <p className="mt-1 truncate text-xs text-slate-400">{record.patient_ref}</p>
                    </div>
                    <Badge variant={getResultVariant(record.prediction)}>{record.prediction ?? record.status}</Badge>
                  </button>
                ))
              ) : (
                <EmptyState title="No retinal scans yet" description="Successful predictions will appear here." icon={CheckCircle2} />
              )}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Prediction result</p>
                <h3 className="mt-2 text-xl font-bold text-white">{analysisResult?.model ?? selectedModelOption.label} output</h3>
              </div>
              <Badge variant={getResultVariant(displayedPrediction ?? analysisResult?.prediction)}>
                {analysisResult ? displayedPrediction ?? analysisResult.prediction : 'Waiting for analysis'}
              </Badge>
            </div>

            <AnimatePresence mode="wait">
              {analysisResult ? (
                <motion.div
                  key={analysisResult.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.28 }}
                  className="mt-5 space-y-5"
                >
                  <div className="rounded-[1.8rem] border border-white/8 bg-white/5 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{displayedPrediction ?? analysisResult.prediction}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">Class index {analysisResult.class_index}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-white">{Number(analysisResult.confidence).toFixed(1)}%</p>
                        <p className="mt-1 text-xs text-slate-400">{analysisResult.inference_time}</p>
                      </div>
                    </div>

                    {isLowConfidence ? (
                      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>
                          Confidence is below 50%, so the result is shown as <span className="font-semibold text-white">Cannot define</span>. The
                          individual class probabilities remain visible below.
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-5">
                      <ProgressBar value={analysisResult.confidence} />
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[1.8rem] border border-white/8 bg-slate-950/60 p-5">
                    <p className="text-sm font-semibold text-white">Class probabilities</p>
                    {sortedScores.map(([label, score]) => (
                      <div key={label} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">{label}</span>
                          <span className="font-semibold text-white">{(Number(score) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-800/80 ring-1 ring-white/8">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(0, Math.min(100, Number(score) * 100))}%` }}
                            transition={{ duration: 0.65, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-300"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-3xl border border-white/8 bg-white/5 p-4 text-sm leading-6 text-slate-300">
                    <p className="font-semibold text-white">Medical recommendation</p>
                    <p className="mt-2 text-slate-400">{analysisResult.medical_note}</p>
                  </div>
                </motion.div>
              ) : analyzing ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 space-y-4">
                  <div className="h-40 animate-pulse rounded-3xl bg-white/6" />
                  <div className="h-64 animate-pulse rounded-3xl bg-white/6" />
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5">
                  <EmptyState title="No analysis yet" description="Upload a retinal image and run the selected model to see probabilities." icon={Eye} />
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-500/12 p-3 text-emerald-200 ring-1 ring-emerald-400/15">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Selected retinal scan</p>
                <p className="text-xs text-slate-400">Loaded from the history endpoint</p>
              </div>
            </div>

            {selectedHistory ? (
              <div className="mt-5 space-y-3 rounded-3xl border border-white/8 bg-white/5 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">{selectedHistory.study_type}</p>
                <p className="text-slate-400">Patient ref: {selectedHistory.patient_ref}</p>
                <p className="text-slate-400">Prediction: {selectedHistory.prediction ?? 'N/A'}</p>
                <p className="text-slate-400">Confidence: {Number(selectedHistory.confidence).toFixed(2)}%</p>
                <p className="text-slate-400">Model: {selectedHistory.model_name ?? 'N/A'}</p>
                <p className="text-slate-400">
                  Inference time: {selectedHistory.inference_time_seconds ? `${Number(selectedHistory.inference_time_seconds).toFixed(2)} sec` : 'N/A'}
                </p>
                <p className="text-slate-400">Created: {selectedHistory.created_at ?? 'N/A'}</p>
              </div>
            ) : (
              <EmptyState title="Select a saved retinal scan" description="Choose a saved prediction to inspect its history details." icon={CheckCircle2} />
            )}
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
