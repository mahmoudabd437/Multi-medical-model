import { FormEvent, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2, Search, ShieldCheck, Trash2, Upload, UserPlus, Video } from 'lucide-react';
import axios from 'axios';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import {
  deleteFaceEnrollment,
  enrollFace,
  listFaceRecognitionRecords,
  matchFace,
  type FaceRecognitionRecord,
} from '@/services/api/faceRecognition';

type MatchMode = 'upload' | 'realtime';
type EnrollMode = 'upload' | 'realtime';

function getRequestErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message;
    if (typeof responseMessage === 'string' && responseMessage.trim()) {
      return responseMessage;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export default function FaceRecognition() {
  const [records, setRecords] = useState<FaceRecognitionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [matchWorking, setMatchWorking] = useState(false);
  const [enrollWorking, setEnrollWorking] = useState(false);
  const [matchMode, setMatchMode] = useState<MatchMode>('upload');
  const [enrollMode, setEnrollMode] = useState<EnrollMode>('upload');
  const [matchFileKey, setMatchFileKey] = useState(0);
  const [enrollFileKey, setEnrollFileKey] = useState(0);
  const [realtimeStatus, setRealtimeStatus] = useState<'idle' | 'running' | 'matched' | 'stopped'>('idle');
  const [enrollRealtimeStatus, setEnrollRealtimeStatus] = useState<'idle' | 'running' | 'stopped'>('idle');
  const [matchForm, setMatchForm] = useState<{ person_id: string; threshold: string; image: File | null }>({
    person_id: '',
    threshold: '0.45',
    image: null,
  });
  const [enrollForm, setEnrollForm] = useState<{ person_name: string; person_id: string; notes: string; image: File | null }>({
    person_name: '',
    person_id: '',
    notes: '',
    image: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const enrollVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const enrollCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const enrollStreamRef = useRef<MediaStream | null>(null);
  const matchIntervalRef = useRef<number | null>(null);
  const matchTimeoutRef = useRef<number | null>(null);
  const matchInFlightRef = useRef(false);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await listFaceRecognitionRecords();
      setRecords(response.items);
    } finally {
      setLoading(false);
    }
  };

  const stopRealtimeMatch = () => {
    if (matchIntervalRef.current !== null) {
      window.clearInterval(matchIntervalRef.current);
      matchIntervalRef.current = null;
    }

    if (matchTimeoutRef.current !== null) {
      window.clearTimeout(matchTimeoutRef.current);
      matchTimeoutRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.pause();
      videoElement.srcObject = null;
    }

    matchInFlightRef.current = false;
  };

  const stopEnrollRealtime = () => {
    if (enrollStreamRef.current) {
      enrollStreamRef.current.getTracks().forEach((track) => track.stop());
      enrollStreamRef.current = null;
    }

    const videoElement = enrollVideoRef.current;
    if (videoElement) {
      videoElement.pause();
      videoElement.srcObject = null;
    }
  };

  const resetEnrollForm = () => {
    setEnrollForm({ person_name: '', person_id: '', notes: '', image: null });
    setEnrollFileKey((current) => current + 1);
  };

  const resetMatchUploadForm = () => {
    setMatchForm({ person_id: '', threshold: '0.45', image: null });
    setMatchFileKey((current) => current + 1);
  };

  const captureEnrollFrame = async () => {
    const videoElement = enrollVideoRef.current;
    const canvasElement = enrollCanvasRef.current;

    if (!videoElement || !canvasElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      throw new Error('Camera preview is not ready yet.');
    }

    const context = canvasElement.getContext('2d');
    if (!context) {
      throw new Error('Unable to access the camera capture canvas.');
    }

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    const blob = await new Promise<Blob | null>((resolve) => canvasElement.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) {
      throw new Error('Unable to capture an image from the camera.');
    }

    return new File([blob], `enroll-${Date.now()}.jpg`, { type: 'image/jpeg' });
  };

  const captureRealtimeFrame = async () => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    if (!videoElement || !canvasElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      return;
    }

    if (matchInFlightRef.current) {
      return;
    }

    const context = canvasElement.getContext('2d');
    if (!context) {
      return;
    }

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

    const blob = await new Promise<Blob | null>((resolve) => canvasElement.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) {
      return;
    }

    matchInFlightRef.current = true;
    try {
      const frameFile = new File([blob], `realtime-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const response = await matchFace({
        image: frameFile,
        person_id: matchForm.person_id.trim() || undefined,
        threshold: Number(matchForm.threshold) || 0.45,
      });

      if (response.match_found) {
        setRealtimeStatus('matched');
        setMessage(
          `Match found: ${response.match?.person_name ?? 'Unknown'} (${response.confidence.toFixed(2)}%) in ${response.inference_time}.`,
        );
        stopRealtimeMatch();
        await loadRecords();
      }
    } catch (requestError) {
      setRealtimeStatus('stopped');
      setMessage(getRequestErrorMessage(requestError, 'Realtime match request failed.'));
      stopRealtimeMatch();
    } finally {
      matchInFlightRef.current = false;
    }
  };

  const startRealtimeMatch = async () => {
    try {
      setMessage(null);
      setRealtimeStatus('running');

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Your browser does not support camera access.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      const videoElement = videoRef.current;
      if (!videoElement) {
        throw new Error('Camera preview is not ready yet.');
      }

      videoElement.srcObject = stream;
      await videoElement.play();

      matchIntervalRef.current = window.setInterval(() => {
        void captureRealtimeFrame();
      }, 700);

      matchTimeoutRef.current = window.setTimeout(() => {
        setRealtimeStatus('stopped');
        setMessage('No match found within 6 seconds. Camera stopped.');
        stopRealtimeMatch();
      }, 6000);
    } catch (requestError) {
      setRealtimeStatus('stopped');
      setMessage(requestError instanceof Error ? requestError.message : 'Unable to start the camera.');
      stopRealtimeMatch();
    }
  };

  const handleStopRealtime = () => {
    setRealtimeStatus('stopped');
    setMessage('Camera stopped.');
    stopRealtimeMatch();
  };

  useEffect(() => {
    void loadRecords();

    return () => {
      stopRealtimeMatch();
      stopEnrollRealtime();
    };
  }, []);

  const handleEnroll = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!enrollForm.image) {
      setMessage('Please choose a face image for enrollment.');
      return;
    }

    try {
      setEnrollWorking(true);
      setMessage(null);
      const response = await enrollFace({
        person_name: enrollForm.person_name,
        person_id: enrollForm.person_id.trim() || undefined,
        notes: enrollForm.notes.trim() || undefined,
        image: enrollForm.image,
      });
      setMessage(`Enrolled ${response.person_name} as ${response.person_id}.`);
      await loadRecords();
      resetEnrollForm();
    } catch (requestError) {
      setMessage(getRequestErrorMessage(requestError, 'Enrollment request failed.'));
    } finally {
      setEnrollWorking(false);
    }
  };

  const startEnrollRealtime = async () => {
    try {
      setMessage(null);
      setEnrollRealtimeStatus('running');

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Your browser does not support camera access.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      enrollStreamRef.current = stream;
      const videoElement = enrollVideoRef.current;
      if (!videoElement) {
        throw new Error('Camera preview is not ready yet.');
      }

      videoElement.srcObject = stream;
      await videoElement.play();
    } catch (requestError) {
      setEnrollRealtimeStatus('stopped');
      setMessage(getRequestErrorMessage(requestError, 'Unable to start the camera.'));
      stopEnrollRealtime();
    }
  };

  const handleEnrollFromCamera = async () => {
    try {
      setEnrollWorking(true);
      setMessage(null);

      if (!enrollForm.person_name.trim()) {
        throw new Error('Please enter a person name before enrolling.');
      }

      const frameImage = await captureEnrollFrame();
      const response = await enrollFace({
        person_name: enrollForm.person_name,
        person_id: enrollForm.person_id.trim() || undefined,
        notes: enrollForm.notes.trim() || undefined,
        image: frameImage,
      });

      setMessage(`Enrolled ${response.person_name} as ${response.person_id}.`);
      await loadRecords();
      resetEnrollForm();
      setEnrollMode('upload');
      setEnrollRealtimeStatus('stopped');
      stopEnrollRealtime();
    } catch (requestError) {
      setMessage(getRequestErrorMessage(requestError, 'Enrollment request failed.'));
    } finally {
      setEnrollWorking(false);
    }
  };

  const handleStopEnrollRealtime = () => {
    setEnrollRealtimeStatus('stopped');
    setMessage('Camera stopped.');
    stopEnrollRealtime();
  };

  const handleDeleteEnrollment = async (record: FaceRecognitionRecord) => {
    const confirmed = window.confirm(`Remove ${record.person_name} from the face registry?`);
    if (!confirmed) {
      return;
    }

    try {
      setMessage(null);
      await deleteFaceEnrollment(record.id);
      setMessage(`Removed ${record.person_name} from the face registry.`);
      await loadRecords();
    } catch (requestError) {
      setMessage(getRequestErrorMessage(requestError, 'Failed to delete face enrollment.'));
    }
  };

  const handleMatchUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!matchForm.image) {
      setMessage('Please choose a face image for matching.');
      return;
    }

    try {
      setMatchWorking(true);
      setMessage(null);
      const response = await matchFace({
        image: matchForm.image,
        person_id: matchForm.person_id.trim() || undefined,
        threshold: Number(matchForm.threshold) || 0.45,
      });
      setMessage(
        response.match_found
          ? `Match found: ${response.match?.person_name ?? 'Unknown'} (${response.confidence.toFixed(2)}%) in ${response.inference_time}.`
          : `${response.message} Similarity: ${(response.similarity * 100).toFixed(2)}%.`,
      );
      await loadRecords();
      resetMatchUploadForm();
    } catch (requestError) {
      setMessage(getRequestErrorMessage(requestError, 'Match request failed.'));
    } finally {
      setMatchWorking(false);
    }
  };

  return (
    <div className="space-y-8 pb-4">
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
        <SectionHeader
          eyebrow="Face Recognition"
          title="Identity workflow"
          description="Enroll faces and verify them against the server-side InsightFace embedding store."
          action={<Badge variant="success">Live API</Badge>}
        />
      </motion.section>

      {message ? (
        <div className="rounded-3xl border border-medical-400/20 bg-medical-500/10 px-4 py-3 text-sm text-medical-100">
          {message}
        </div>
      ) : null}

      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={enrollCanvasRef} className="hidden" />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassCard className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">Records</p>
          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="rounded-3xl border border-white/8 bg-white/6 p-4 text-sm text-slate-400">Loading enrolled faces...</div>
            ) : records.length > 0 ? (
              records.map((record) => (
                <div key={record.id} className="rounded-3xl border border-white/8 bg-white/6 p-4 text-sm text-slate-300">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{record.person_name}</p>
                      <p className="text-xs text-slate-400">{record.person_id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{record.embedding_size} dims</Badge>
                      <button
                        type="button"
                        onClick={() => void handleDeleteEnrollment(record)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-400/20 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/20"
                        aria-label={`Delete enrollment for ${record.person_name}`}
                        title="Delete enrollment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                    <p>Matches: {record.match_count}</p>
                    <p>Similarity: {record.last_similarity !== null ? record.last_similarity.toFixed(3) : 'n/a'}</p>
                    <p className="sm:col-span-2">Source: {record.source_image_name || 'Uploaded image'}</p>
                    {record.notes ? <p className="sm:col-span-2">Notes: {record.notes}</p> : null}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No enrolled faces yet"
                description="Enroll your first face image to populate the identity registry."
                icon={Camera}
              />
            )}
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-medical-500/12 p-3 text-medical-200 ring-1 ring-medical-400/15">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Enroll face</p>
                <p className="text-xs text-slate-400">POST /api/v1/face-recognition/enroll/</p>
              </div>
            </div>
            <div className="mt-5 flex rounded-2xl border border-white/10 bg-slate-950/45 p-1">
              <button
                type="button"
                onClick={() => {
                  setEnrollMode('upload');
                  setEnrollRealtimeStatus('stopped');
                  stopEnrollRealtime();
                }}
                className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  enrollMode === 'upload' ? 'bg-medical-500 text-slate-950' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => {
                  setEnrollMode('realtime');
                  setMessage(null);
                }}
                className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  enrollMode === 'realtime' ? 'bg-medical-500 text-slate-950' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                Realtime
              </button>
            </div>

            {enrollMode === 'upload' ? (
              <form className="mt-5 space-y-4" onSubmit={handleEnroll}>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Person name</span>
                  <input
                    value={enrollForm.person_name}
                    onChange={(event) => setEnrollForm((current) => ({ ...current, person_name: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
                    placeholder="Enter a display name"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Person ID</span>
                  <input
                    value={enrollForm.person_id}
                    onChange={(event) => setEnrollForm((current) => ({ ...current, person_id: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
                    placeholder="Optional stable ID"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Notes</span>
                  <input
                    value={enrollForm.notes}
                    onChange={(event) => setEnrollForm((current) => ({ ...current, notes: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
                    placeholder="Optional context"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Face image</span>
                  <input
                    key={enrollFileKey}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(event) => setEnrollForm((current) => ({ ...current, image: event.target.files?.[0] ?? null }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-slate-300 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-medical-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
                  />
                </label>
                <button
                  type="submit"
                  disabled={enrollWorking}
                  className="inline-flex items-center gap-2 rounded-full bg-medical-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-medical-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enrollWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Enroll face
                </button>
              </form>
            ) : (
              <div className="mt-5 space-y-4">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Person name</span>
                  <input
                    value={enrollForm.person_name}
                    onChange={(event) => setEnrollForm((current) => ({ ...current, person_name: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
                    placeholder="Enter a display name"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Person ID</span>
                  <input
                    value={enrollForm.person_id}
                    onChange={(event) => setEnrollForm((current) => ({ ...current, person_id: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
                    placeholder="Optional stable ID"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Notes</span>
                  <input
                    value={enrollForm.notes}
                    onChange={(event) => setEnrollForm((current) => ({ ...current, notes: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
                    placeholder="Optional context"
                  />
                </label>
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55">
                  <video ref={enrollVideoRef} autoPlay playsInline muted className="h-[320px] w-full object-cover" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void startEnrollRealtime()}
                    disabled={enrollWorking || enrollRealtimeStatus === 'running'}
                    className="inline-flex items-center gap-2 rounded-full bg-medical-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-medical-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {enrollRealtimeStatus === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                    Start camera
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleEnrollFromCamera()}
                    disabled={enrollWorking || enrollRealtimeStatus !== 'running'}
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {enrollWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    Enroll from camera
                  </button>
                  <button
                    type="button"
                    onClick={handleStopEnrollRealtime}
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Stop camera
                  </button>
                </div>
                <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                  <p>Mode: realtime camera</p>
                  <p>Status: {enrollRealtimeStatus}</p>
                </div>
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-medical-500/12 p-3 text-medical-200 ring-1 ring-medical-400/15">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Match face</p>
                <p className="text-xs text-slate-400">Choose upload or realtime camera mode</p>
              </div>
            </div>

            <div className="mt-5 flex rounded-2xl border border-white/10 bg-slate-950/45 p-1">
              <button
                type="button"
                onClick={() => {
                  setMatchMode('upload');
                  setMessage(null);
                  setRealtimeStatus('stopped');
                  stopRealtimeMatch();
                }}
                className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  matchMode === 'upload' ? 'bg-medical-500 text-slate-950' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => {
                  setMatchMode('realtime');
                  setMessage(null);
                }}
                className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  matchMode === 'realtime' ? 'bg-medical-500 text-slate-950' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                Realtime
              </button>
            </div>

            {matchMode === 'upload' ? (
              <form className="mt-5 space-y-4" onSubmit={handleMatchUpload}>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Face image</span>
                  <input
                    key={matchFileKey}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(event) => setMatchForm((current) => ({ ...current, image: event.target.files?.[0] ?? null }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-slate-300 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-medical-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Person ID</span>
                  <input
                    value={matchForm.person_id}
                    onChange={(event) => setMatchForm((current) => ({ ...current, person_id: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
                    placeholder="Optional filter"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Threshold</span>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={matchForm.threshold}
                    onChange={(event) => setMatchForm((current) => ({ ...current, threshold: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
                  />
                </label>
                <button
                  type="submit"
                  disabled={matchWorking}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {matchWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Match face
                </button>
              </form>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55">
                  <video ref={videoRef} autoPlay playsInline muted className="h-[320px] w-full object-cover" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void startRealtimeMatch()}
                    disabled={matchWorking || realtimeStatus === 'running'}
                    className="inline-flex items-center gap-2 rounded-full bg-medical-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-medical-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {realtimeStatus === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                    Start camera
                  </button>
                  <button
                    type="button"
                    onClick={handleStopRealtime}
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Stop camera
                  </button>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/6 p-4 text-sm text-slate-300">
                  The camera scans for up to 6 seconds and stops automatically if no match is found.
                </div>
                <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
                  <p>Mode: realtime camera</p>
                  <p>Status: {realtimeStatus}</p>
                </div>
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-200 ring-1 ring-emerald-400/15">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Recognition notes</p>
                <p className="text-xs text-slate-400">InsightFace embeddings run on the server, so both upload and camera modes use the same match engine.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Upload mode is best for stored photos or documents.</div>
              <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Realtime mode is best for access control and live verification flows.</div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
