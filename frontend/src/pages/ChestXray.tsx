import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { AlertTriangle, ArrowUpRight, BrainCircuit, CheckCircle2, ChevronRight, CloudUpload, Loader2, ScanSearch, ShieldCheck, UploadCloud, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { analyzeChestXray, type ChestXrayAnalyzeRequest, type ChestXrayAnalyzeResponse } from '@/services/api/predictions';
import { getHistory, listHistory, type HistoryRecord } from '@/services/api/history';

const modelOptions = [
  {
    value: 'efficientnetb0',
    label: 'EfficientNetB0',
    description: 'Transfer-learning chest X-ray classifier',
    status: 'Active',
  },
  {
    value: 'densenet121',
    label: 'DenseNet121',
    description: 'Dense feature extractor for chest workflows',
    status: 'Active',
  },
  {
    value: 'custom_cnn',
    label: 'Custom CNN',
    description: 'Grayscale CNN trained from best_model.h5',
    status: 'Active',
  },
] as const;

type ChestXrayModelKey = NonNullable<ChestXrayAnalyzeRequest['model']>;

const initialForm = {
  study_id: 'study_1001',
  notes: 'Portable chest X-ray, frontal view.',
};

function buildAnalysisHighlights(modelLabel: string) {
  return [
    { label: 'Target size', value: '224 x 224' },
    { label: 'Channels', value: modelLabel === 'Custom CNN' ? 'Grayscale' : 'RGB' },
    { label: 'Threshold', value: '0.50' },
    { label: 'Model', value: modelLabel },
  ];
}

function toNumber(value: unknown, fallback = 0) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function formatHistoryPreview(record: HistoryRecord) {
  if (!record.prediction) {
    return record.status;
  }

  const percentage = (Number(record.probability) * 100).toFixed(1);
  return `${record.prediction} · ${percentage}%`;
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-3xl bg-white/6 ${className ?? ''}`} />;
}

export default function ChestXray() {
  const [form, setForm] = useState(initialForm);
  const [selectedModel, setSelectedModel] = useState<ChestXrayModelKey>('efficientnetb0');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<HistoryRecord | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ChestXrayAnalyzeResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const confidencePercentage = useMemo(() => analysisResult?.confidence ?? 0, [analysisResult]);
  const circularProgress = useMemo(() => Math.max(0, Math.min(100, confidencePercentage)), [confidencePercentage]);
  const selectedModelOption = useMemo(
    () => modelOptions.find((model) => model.value === selectedModel) ?? modelOptions[0],
    [selectedModel],
  );
  const activeModelLabel = analysisResult?.model_name ?? analysisResult?.model ?? selectedModelOption.label;
  const analysisHighlights = useMemo(() => buildAnalysisHighlights(activeModelLabel), [activeModelLabel]);

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
        const response = await listHistory({ status: 'completed' });
        setHistoryRecords(response.items);
        setSelectedHistory(response.items[0] ?? null);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Failed to load saved scans.');
      } finally {
        setLoadingHistory(false);
      }
    };

    void loadHistory();
  }, []);

  useEffect(() => {
    if (analysisResult) {
      setError(null);
    }
  }, [analysisResult]);

  const refreshHistory = async (highlightId?: string) => {
    const loadPredictions = async () => {
      try {
        const response = await listHistory({ status: 'completed' });
        setHistoryRecords(response.items);
        if (highlightId) {
          const matched = response.items.find((item) => item.id === highlightId) ?? response.items[0] ?? null;
          setSelectedHistory(matched);
        } else {
          setSelectedHistory(response.items[0] ?? null);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Failed to refresh saved scans.');
      }
    };

    await loadPredictions();
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
      setError('Please upload a chest X-ray image before analyzing.');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      const response = await analyzeChestXray({
        image: selectedFile,
        study_id: form.study_id,
        notes: form.notes,
        model: selectedModel,
      });

      setAnalysisResult(response);
      await refreshHistory(response.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Prediction failure.');
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
      setError(requestError instanceof Error ? requestError.message : 'Unable to load the saved scan.');
    }
  };

  const noteTone = analysisResult?.prediction === 'Pneumonia' ? 'danger' : 'success';

  return (
    <div className="space-y-8 pb-6">
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
        <SectionHeader
          eyebrow="Chest X-ray"
          title="Chest X-ray analysis"
          description="Upload an image, preview it, choose a trained chest model, and save each successful inference to the database."
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
                <h3 className="mt-2 text-2xl font-bold text-white">Drop a chest X-ray to analyze</h3>
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
                  ? 'border-blue-400/60 bg-blue-500/10 shadow-[0_0_0_1px_rgba(37,99,235,0.22),0_24px_80px_rgba(37,99,235,0.18)]'
                  : 'border-white/12 bg-slate-950/55'
              }`}
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />

              <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-blue-500/12 p-3 text-blue-200 ring-1 ring-blue-400/15">
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
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/45 focus:ring-2 focus:ring-blue-400/15"
                      placeholder="study_1001"
                    />

                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Model</p>
                    <select
                      value={selectedModel}
                      onChange={(event) => setSelectedModel(event.target.value as ChestXrayModelKey)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400/45 focus:ring-2 focus:ring-blue-400/15"
                    >
                      {modelOptions.map((model) => (
                        <option key={model.value} value={model.value}>
                          {model.label} {model.status}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs leading-5 text-slate-400">{selectedModelOption.description}</p>

                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Clinical note</p>
                    <textarea
                      rows={4}
                      value={form.notes}
                      onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/45 focus:ring-2 focus:ring-blue-400/15"
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
                      <p className="text-xs text-slate-400">Drag and drop or browse a file</p>
                    </div>
                    <Badge variant={selectedFile ? 'success' : 'neutral'}>{selectedFile ? 'Ready' : 'No file selected'}</Badge>
                  </div>

                  <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 to-slate-900 p-4">
                    {previewUrl ? (
                      <motion.img
                        key={previewUrl}
                        src={previewUrl}
                        alt="Chest X-ray preview"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35 }}
                        className="h-[320px] w-full rounded-[1.5rem] object-contain"
                      />
                    ) : (
                      <div className="flex h-[320px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-white/4 px-6 text-center">
                        <div className="rounded-full bg-blue-500/12 p-4 text-blue-200 ring-1 ring-blue-400/15">
                          <ScanSearch className="h-7 w-7" />
                        </div>
                        <p className="mt-4 text-lg font-semibold text-white">Preview will appear here</p>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                          Drop a chest X-ray image to inspect it before sending it to the selected inference model.
                        </p>
                      </div>
                    )}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {analysisHighlights.map((highlight) => (
                        <div key={highlight.label} className="min-w-0 rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{highlight.label}</p>
                          <p className="mt-1 break-words text-xs font-semibold leading-5 text-white sm:text-sm">{highlight.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button type="button" className="w-full py-3" disabled={analyzing || !selectedFile} onClick={() => void handleAnalyze()}>
                    {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                    {analyzing ? 'Analyzing image' : 'Analyze chest X-ray'}
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Saved scans</p>
                <h3 className="mt-2 text-xl font-bold text-white">History-backed study list</h3>
              </div>
              <Badge variant="info">Database synced</Badge>
            </div>

            <div className="mt-5 space-y-3">
              {loadingHistory ? (
                <div className="grid gap-3">
                  <SkeletonBlock className="h-20" />
                  <SkeletonBlock className="h-20" />
                  <SkeletonBlock className="h-20" />
                </div>
              ) : historyRecords.length > 0 ? (
                historyRecords.slice(0, 4).map((record) => (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => void openHistoryRecord(record.id)}
                    className="group flex w-full items-center justify-between rounded-3xl border border-white/8 bg-white/5 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-white/14 hover:bg-white/8"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{record.study_type}</p>
                      <p className="mt-1 text-xs text-slate-400">{record.patient_ref}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                      <span className="rounded-full border border-white/8 bg-slate-900/70 px-3 py-1.5">{formatHistoryPreview(record)}</span>
                      <ChevronRight className="h-4 w-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
                    </div>
                  </button>
                ))
              ) : (
                <EmptyState
                  title="No saved scans yet"
                  description="Successful predictions will appear here after they are stored in the database."
                  icon={ShieldCheck}
                />
              )}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Prediction result</p>
                <h3 className="mt-2 text-xl font-bold text-white">{activeModelLabel} output</h3>
              </div>
              <Badge variant={analysisResult ? noteTone : 'neutral'}>
                {analysisResult ? analysisResult.prediction : 'Waiting for analysis'}
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
                  <div className="grid gap-5 2xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[1.8rem] border border-white/8 bg-white/5 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-white">{analysisResult.prediction}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">Class index {analysisResult.class_index}</p>
                        </div>
                        <div className="rounded-2xl bg-blue-500/12 p-3 text-blue-200 ring-1 ring-blue-400/15">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-slate-300">
                            <span>Confidence</span>
                            <span>{Number(analysisResult.confidence).toFixed(2)}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-800/80 ring-1 ring-white/8">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Number(analysisResult.confidence)}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-400"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-slate-300">
                            <span>Probability</span>
                            <span>{Number(analysisResult.probability).toFixed(4)}</span>
                          </div>
                          <div className="text-sm leading-6 text-slate-400">Probability threshold: {Number(analysisResult.threshold).toFixed(2)}</div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="min-w-0 rounded-2xl border border-white/8 bg-slate-950/60 p-4">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Model</p>
                            <p className="mt-1 break-words text-xs font-semibold leading-5 text-white sm:text-sm">
                              {analysisResult.model_name ?? analysisResult.model}
                            </p>
                          </div>
                          <div className="min-w-0 rounded-2xl border border-white/8 bg-slate-950/60 p-4">
                            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Inference time</p>
                            <p className="mt-1 break-words text-xs font-semibold leading-5 text-white sm:text-sm">
                              {analysisResult.inference_time_seconds != null
                                ? `${Number(analysisResult.inference_time_seconds).toFixed(2)} sec`
                                : analysisResult.inference_time}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.8rem] border border-white/8 bg-slate-950/60 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">Circular confidence</p>
                          <p className="text-xs text-slate-400">Animated score visualization</p>
                        </div>
                        <Badge className="shrink-0" variant={analysisResult.prediction === 'Pneumonia' ? 'danger' : 'success'}>
                          {analysisResult.prediction}
                        </Badge>
                      </div>

                      <div className="mt-5 flex items-center justify-center">
                        <div className="relative h-40 w-40 sm:h-44 sm:w-44">
                          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                            <circle cx="60" cy="60" r="52" className="fill-none stroke-white/8" strokeWidth="10" />
                            <motion.circle
                              cx="60"
                              cy="60"
                              r="52"
                              className="fill-none stroke-blue-400"
                              strokeWidth="10"
                              strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 52}
                              initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                              animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - circularProgress / 100) }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 sm:text-xs">Confidence</p>
                            <p className="mt-1 text-3xl font-bold text-white sm:mt-2 sm:text-4xl">{Number(analysisResult.confidence).toFixed(1)}%</p>
                            <p className="mt-1 max-w-[7.5rem] text-[10px] leading-4 text-slate-400 sm:mt-2 sm:max-w-[8.5rem] sm:text-xs sm:leading-5">
                              {analysisResult.prediction === 'Pneumonia'
                                ? 'Review recommended. Confirm findings with a radiologist.'
                                : 'No pneumonia pattern detected in the current prediction.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 rounded-3xl border border-white/8 bg-white/5 p-4 text-sm leading-6 text-slate-300">
                        <p className="font-semibold text-white">Medical recommendation</p>
                        <p className="mt-2 text-slate-400">{analysisResult.medical_note}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {analysisHighlights.map((highlight) => (
                      <div key={highlight.label} className="min-w-0 rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{highlight.label}</p>
                        <p className="mt-1 break-words text-xs font-semibold leading-5 text-white sm:text-sm">{highlight.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : analyzing ? (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-5 space-y-4"
                >
                  <SkeletonBlock className="h-40" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SkeletonBlock className="h-24" />
                    <SkeletonBlock className="h-24" />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5">
                  <EmptyState
                    title="No analysis yet"
                    description="Upload a chest X-ray and run the selected model to see the result here."
                    icon={ArrowUpRight}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-500/12 p-3 text-blue-200 ring-1 ring-blue-400/15">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Selected scan</p>
                <p className="text-xs text-slate-400">Loaded from the history endpoint</p>
              </div>
            </div>

            {selectedHistory ? (
              <div className="mt-5 space-y-3 rounded-3xl border border-white/8 bg-white/5 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">{selectedHistory.study_type}</p>
                <p className="text-slate-400">Patient ref: {selectedHistory.patient_ref}</p>
                <p className="text-slate-400">Prediction: {selectedHistory.prediction ?? 'N/A'}</p>
                <p className="text-slate-400">Confidence: {Number(selectedHistory.confidence).toFixed(2)}%</p>
                <p className="text-slate-400">Model: {selectedHistory.model_name ?? 'EfficientNetB0'}</p>
                <p className="text-slate-400">
                  Inference time: {selectedHistory.inference_time_seconds ? `${Number(selectedHistory.inference_time_seconds).toFixed(2)} sec` : 'N/A'}
                </p>
                <p className="text-slate-400">Created: {selectedHistory.created_at ?? 'N/A'}</p>
              </div>
            ) : (
              <EmptyState
                title="Select a saved scan"
                description="Choose one of the saved predictions to inspect its history details."
                icon={ShieldCheck}
              />
            )}
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
