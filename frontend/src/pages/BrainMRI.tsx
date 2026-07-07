import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { AlertTriangle, Brain, CheckCircle2, CloudUpload, Loader2, ScanSearch, UploadCloud, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getHistory, listHistory, type HistoryRecord } from '@/services/api/history';
import { analyzeBrainMRI, type BrainMRIAnalyzeResponse, type BrainMRIModelKey } from '@/services/api/predictions';

const modelOptions = [
  {
    value: 'efficientnetb0_mri',
    label: 'EfficientNetB0 MRI',
    description: 'CNN feature extractor trained for four-class MRI tumor classification',
  },
  {
    value: 'vit_mri',
    label: 'ViT MRI',
    description: 'Vision Transformer classifier for the same MRI class set',
  },
] as const;

const initialForm = {
  study_id: 'mri_1001',
  notes: 'Axial Brain MRI image for tumor classification.',
};

function toNumber(value: unknown, fallback = 0) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getResultVariant(prediction?: string) {
  if (!prediction) {
    return 'neutral';
  }

  return prediction.toLowerCase().includes('no tumor') ? 'success' : 'warning';
}

export default function BrainMRI() {
  const [form, setForm] = useState(initialForm);
  const [selectedModel, setSelectedModel] = useState<BrainMRIModelKey>('efficientnetb0_mri');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<BrainMRIAnalyzeResponse | null>(null);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<HistoryRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedModelOption = useMemo(
    () => modelOptions.find((model) => model.value === selectedModel) ?? modelOptions[0],
    [selectedModel],
  );
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
        const response = await listHistory({ status: 'completed', modality: 'brain_mri' });
        setHistoryRecords(response.items);
        setSelectedHistory(response.items[0] ?? null);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Failed to load Brain MRI history.');
      } finally {
        setLoadingHistory(false);
      }
    };

    void loadHistory();
  }, []);

  const refreshHistory = async (highlightId?: string) => {
    try {
      const response = await listHistory({ status: 'completed', modality: 'brain_mri' });
      setHistoryRecords(response.items);
      setSelectedHistory(response.items.find((item) => item.id === highlightId) ?? response.items[0] ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to refresh Brain MRI history.');
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

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
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
      setError('Please upload a Brain MRI image before analyzing.');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      const response = await analyzeBrainMRI({
        image: selectedFile,
        study_id: form.study_id,
        notes: form.notes,
        model: selectedModel,
      });
      setAnalysisResult(response);
      await refreshHistory(response.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Brain MRI analysis failed.');
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
      setError(requestError instanceof Error ? requestError.message : 'Unable to load the saved MRI scan.');
    }
  };

  return (
    <div className="space-y-8 pb-6">
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
        <SectionHeader
          eyebrow="Brain MRI"
          title="Brain MRI analysis"
          description="Upload an MRI image, choose the trained EfficientNetB0 or ViT model, and review four-class tumor probabilities."
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
                <h3 className="mt-2 text-2xl font-bold text-white">Drop a Brain MRI to analyze</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">224 x 224 RGB</Badge>
                <Badge variant="info">4 classes</Badge>
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
                isDragging ? 'border-sky-400/60 bg-sky-500/10' : 'border-white/12 bg-slate-950/55'
              }`}
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />

              <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-sky-500/12 p-3 text-sky-200 ring-1 ring-sky-400/15">
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
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/45 focus:ring-2 focus:ring-sky-400/15"
                      placeholder="mri_1001"
                    />

                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Model</p>
                    <select
                      value={selectedModel}
                      onChange={(event) => setSelectedModel(event.target.value as BrainMRIModelKey)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400/45 focus:ring-2 focus:ring-sky-400/15"
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
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/45 focus:ring-2 focus:ring-sky-400/15"
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
                      <p className="text-xs text-slate-400">Review the uploaded MRI slice before inference</p>
                    </div>
                    <Badge variant={selectedFile ? 'success' : 'neutral'}>{selectedFile ? 'Ready' : 'No file selected'}</Badge>
                  </div>

                  <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 p-4">
                    {previewUrl ? (
                      <motion.img
                        key={previewUrl}
                        src={previewUrl}
                        alt="Brain MRI preview"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35 }}
                        className="h-[320px] w-full rounded-[1.5rem] object-contain"
                      />
                    ) : (
                      <div className="flex h-[320px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-white/4 px-6 text-center">
                        <div className="rounded-full bg-sky-500/12 p-4 text-sky-200 ring-1 ring-sky-400/15">
                          <ScanSearch className="h-7 w-7" />
                        </div>
                        <p className="mt-4 text-lg font-semibold text-white">Preview will appear here</p>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                          Upload a Brain MRI image and run the selected model to classify tumor type.
                        </p>
                      </div>
                    )}
                  </div>

                  <Button type="button" className="w-full py-3" disabled={analyzing || !selectedFile} onClick={() => void handleAnalyze()}>
                    {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                    {analyzing ? 'Analyzing image' : 'Analyze Brain MRI'}
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Saved MRI scans</p>
                <h3 className="mt-2 text-xl font-bold text-white">Brain MRI history</h3>
              </div>
              <Badge variant="info">Filtered</Badge>
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
                <EmptyState title="No Brain MRI scans yet" description="Successful MRI predictions will appear here." icon={CheckCircle2} />
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
              <Badge variant={getResultVariant(analysisResult?.prediction)}>
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
                  <div className="rounded-[1.8rem] border border-white/8 bg-white/5 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{analysisResult.prediction}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">Class index {analysisResult.class_index}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-white">{analysisResult.confidence.toFixed(1)}%</p>
                        <p className="mt-1 text-xs text-slate-400">{analysisResult.inference_time}</p>
                      </div>
                    </div>

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
                          <span className="font-semibold text-white">{(score * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-800/80 ring-1 ring-white/8">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(0, Math.min(100, score * 100))}%` }}
                            transition={{ duration: 0.65, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
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
                  <EmptyState title="No analysis yet" description="Upload a Brain MRI and run the selected model to see probabilities." icon={Brain} />
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-500/12 p-3 text-sky-200 ring-1 ring-sky-400/15">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Selected MRI scan</p>
                <p className="text-xs text-slate-400">Loaded from the history endpoint</p>
              </div>
            </div>

            {selectedHistory ? (
              <div className="mt-5 space-y-3 rounded-3xl border border-white/8 bg-white/5 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">{selectedHistory.study_type}</p>
                <p className="text-slate-400">Patient ref: {selectedHistory.patient_ref}</p>
                <p className="text-slate-400">Prediction: {selectedHistory.prediction ?? 'N/A'}</p>
                <p className="text-slate-400">Confidence: {toNumber(selectedHistory.confidence).toFixed(2)}%</p>
                <p className="text-slate-400">Model: {selectedHistory.model_name ?? 'N/A'}</p>
                <p className="text-slate-400">
                  Inference time: {selectedHistory.inference_time_seconds ? `${toNumber(selectedHistory.inference_time_seconds).toFixed(2)} sec` : 'N/A'}
                </p>
                <p className="text-slate-400">Created: {selectedHistory.created_at ?? 'N/A'}</p>
              </div>
            ) : (
              <EmptyState title="Select a saved MRI scan" description="Choose a saved prediction to inspect its history details." icon={CheckCircle2} />
            )}
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
