import { Brain, Camera, CircleHelp, Database, Layers3, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

const modelCards = [
  { title: 'Chest X-ray', description: 'Radiology triage and pulmonary analysis workflow.', icon: Stethoscope },
  { title: 'Brain MRI', description: 'Neuroimaging review and tumor classification support.', icon: Brain },
  { title: 'Diabetic Retinopathy', description: 'Retinal screening with clinically oriented confidence values.', icon: ShieldCheck },
  { title: 'Face Recognition', description: 'Identity workflows for enrollment and verification.', icon: Camera },
];

const featureCards = [
  { title: 'AI Diagnosis', description: 'Inference-driven imaging support with persistent record keeping.', icon: Sparkles },
  { title: 'Prediction History', description: 'Audit-ready historical records for every stored prediction.', icon: Database },
  { title: 'Reports', description: "Today's model-scoped reports with export-ready views.", icon: Layers3 },
  { title: 'Medical Dashboard', description: 'Dark-theme command center for clinical operations.', icon: CircleHelp },
];

const stackCards = [
  { title: 'React', description: 'Responsive frontend and reusable UI composition.' },
  { title: 'Django REST Framework', description: 'Backend APIs for predictions, history, reports, and stats.' },
  { title: 'TensorFlow', description: 'Model execution for the supported AI pipelines.' },
  { title: 'Docker', description: 'Deployment-ready runtime packaging and repeatable environments.' },
];

export default function About() {
  return (
    <div className="space-y-8 pb-4">
      <section>
        <SectionHeader
          eyebrow="About"
          title="Medical AI Platform overview"
          description="A production-oriented medical intelligence workspace built for multi-model imaging workflows, auditability, and a consistent dark clinical shell."
          action={<Badge variant="info">Platform overview</Badge>}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {featureCards.map((item) => {
          const Icon = item.icon;
          return (
            <GlassCard key={item.title} className="p-5">
              <div className="space-y-4">
                <div className="w-fit rounded-2xl bg-medical-500/12 p-3 text-medical-200 ring-1 ring-medical-400/15">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stackCards.map((item) => (
          <GlassCard key={item.title} className="p-5">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-medical-300">{item.title}</p>
              <p className="text-sm leading-6 text-slate-300">{item.description}</p>
            </div>
          </GlassCard>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {modelCards.map((item) => {
          const Icon = item.icon;
          return (
            <GlassCard key={item.title} className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-medical-500/12 p-3 text-medical-200 ring-1 ring-medical-400/15">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </section>
    </div>
  );
}
