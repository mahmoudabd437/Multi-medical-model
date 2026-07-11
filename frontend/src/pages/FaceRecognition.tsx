import { FormEvent, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2, Search, ShieldCheck, Upload, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { enrollFace, listFaceRecognitionRecords, matchFace, type FaceRecognitionRecord } from '@/services/api/faceRecognition';

export default function FaceRecognition() {
  const [records, setRecords] = useState<FaceRecognitionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [matchWorking, setMatchWorking] = useState(false);
  const [enrollWorking, setEnrollWorking] = useState(false);
  const [matchFileKey, setMatchFileKey] = useState(0);
  const [enrollFileKey, setEnrollFileKey] = useState(0);
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

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await listFaceRecognitionRecords();
      setRecords(response.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords();
  }, []);

  const resetEnrollForm = () => {
    setEnrollForm({ person_name: '', person_id: '', notes: '', image: null });
    setEnrollFileKey((current) => current + 1);
  };

  const resetMatchForm = () => {
    setMatchForm({ person_id: '', threshold: '0.45', image: null });
    setMatchFileKey((current) => current + 1);
  };

  const handleMatch = async (event: FormEvent<HTMLFormElement>) => {
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
      resetMatchForm();
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : 'Match request failed.');
    } finally {
      setMatchWorking(false);
    }
  };

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
      setMessage(requestError instanceof Error ? requestError.message : 'Enrollment request failed.');
    } finally {
      setEnrollWorking(false);
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

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassCard className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-medical-300">Records</p>
          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="rounded-3xl border border-white/8 bg-white/6 p-4 text-sm text-slate-400">Loading enrolled faces...</div>
            ) : records.length > 0 ? (
              records.map((record) => (
                <div key={record.id} className="rounded-3xl border border-white/8 bg-white/6 p-4 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{record.person_name}</p>
                      <p className="text-xs text-slate-400">{record.person_id}</p>
                    </div>
                    <Badge variant="info">{record.embedding_size} dims</Badge>
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
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-medical-500/12 p-3 text-medical-200 ring-1 ring-medical-400/15">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Match face</p>
                <p className="text-xs text-slate-400">POST /api/v1/face-recognition/match/</p>
              </div>
            </div>
            <form className="mt-5 space-y-4" onSubmit={handleMatch}>
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
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-200 ring-1 ring-emerald-400/15">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Recognition notes</p>
                <p className="text-xs text-slate-400">InsightFace embeddings run on the server, so this form works from any browser.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/8 bg-white/6 p-4">Upload an image to create or verify a face embedding.</div>
              <div className="rounded-2xl border border-white/8 bg-white/6 p-4">The backend keeps enrollments in SQLite and compares cosine similarity for matching.</div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
