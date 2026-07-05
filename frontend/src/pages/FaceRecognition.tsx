import { FormEvent, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Search, UserPlus, Loader2 } from 'lucide-react';
import { ComingSoonState } from '@/components/ui/ComingSoonState';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { enrollFace, listFaceRecognitionRecords, matchFace, type FaceRecognitionRecord } from '@/services/api/faceRecognition';

export default function FaceRecognition() {
  const [records, setRecords] = useState<FaceRecognitionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [matchForm, setMatchForm] = useState({ image_id: 'face_img_001', person_id: 'person_001' });
  const [enrollForm, setEnrollForm] = useState({ person_name: 'Test Subject', image_id: 'face_img_002' });

  useEffect(() => {
    const loadRecords = async () => {
      try {
        setLoading(true);
        const response = await listFaceRecognitionRecords();
        setRecords(response.items);
      } finally {
        setLoading(false);
      }
    };

    void loadRecords();
  }, []);

  const handleMatch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setWorking(true);
      setMessage(null);
      const response = await matchFace(matchForm);
      setMessage(response.message);
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : 'Match request failed.');
    } finally {
      setWorking(false);
    }
  };

  const handleEnroll = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setWorking(true);
      setMessage(null);
      const response = await enrollFace(enrollForm);
      setMessage(response.message);
    } catch (requestError) {
      setMessage(requestError instanceof Error ? requestError.message : 'Enrollment request failed.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-8 pb-4">
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
        <SectionHeader
          eyebrow="Face Recognition"
          title="Identity workflow placeholder"
          description="The backend already exposes a face-recognition route, and this page exercises it with mock responses so the UI is ready for future enrollment and matching logic."
          action={<Badge variant="warning">Placeholder API</Badge>}
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
              <div className="rounded-3xl border border-white/8 bg-white/6 p-4 text-sm text-slate-400">Loading placeholder records...</div>
            ) : records.length > 0 ? (
              records.map((record) => (
                <div key={record.id} className="rounded-3xl border border-white/8 bg-white/6 p-4 text-sm text-slate-300">
                  <p className="font-semibold text-white">{record.status}</p>
                  <p className="mt-2 text-slate-400">{record.message}</p>
                </div>
              ))
            ) : (
              <EmptyState
                title="No placeholder records"
                description="The face recognition endpoint returned an empty list."
                icon={Camera}
              />
            )}
          </div>
        </GlassCard>

        <div className="space-y-4">
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
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Image ID</span>
                <input
                  value={matchForm.image_id}
                  onChange={(event) => setMatchForm((current) => ({ ...current, image_id: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Person ID</span>
                <input
                  value={matchForm.person_id}
                  onChange={(event) => setMatchForm((current) => ({ ...current, person_id: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
                />
              </label>
              <button
                type="submit"
                disabled={working}
                className="inline-flex items-center gap-2 rounded-full bg-medical-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-glow transition hover:bg-medical-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {working ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Match face
              </button>
            </form>
          </GlassCard>

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
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Image ID</span>
                <input
                  value={enrollForm.image_id}
                  onChange={(event) => setEnrollForm((current) => ({ ...current, image_id: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none transition focus:border-medical-400/40 focus:ring-2 focus:ring-medical-400/15"
                />
              </label>
              <button
                type="submit"
                disabled={working}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {working ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enroll face
              </button>
            </form>
          </GlassCard>

          <ComingSoonState
            title="Face Recognition"
            description="The matching and enrollment flows already hit the backend and return mock JSON, so the future ML implementation only needs to replace the placeholder logic on the server."
            note="This route now functions like a real feature surface rather than a dead-end placeholder."
          />
        </div>
      </div>
    </div>
  );
}
