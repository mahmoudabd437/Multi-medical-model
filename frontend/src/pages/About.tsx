import { motion } from 'framer-motion';
import { CircleHelp, Layers3, ShieldCheck, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Badge } from '@/components/ui/Badge';
import { aboutSections } from '@/data/mockData';

const principles = [
  { title: 'Modular routes', description: 'Each clinical domain gets its own route and visual treatment.', icon: Layers3 },
  { title: 'Visible trust', description: 'The interface keeps context, badges, and status clear at all times.', icon: ShieldCheck },
  { title: 'Future scale', description: 'The shell is ready for backend wiring, auth, and additional model families later.', icon: Sparkles },
];

export default function About() {
  return (
    <div className="space-y-8 pb-4">
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
        <SectionHeader
          eyebrow="About"
          title="Platform mission and design rationale"
          description="This dashboard is a premium front-end foundation for a future multi-model medical AI product. The diagnosis and API layers are intentionally absent at this step."
          action={<Badge variant="info">Architecture only</Badge>}
        />
      </motion.section>

      <div className="grid gap-4 md:grid-cols-3">
        {principles.map((principle) => {
          const Icon = principle.icon;
          return (
            <GlassCard key={principle.title} className="p-5">
              <div className="space-y-4">
                <div className="w-fit rounded-2xl bg-medical-500/12 p-3 text-medical-200 ring-1 ring-medical-400/15">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{principle.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{principle.description}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {aboutSections.map((section) => (
          <GlassCard key={section.title} className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-medical-500/12 p-3 text-medical-200 ring-1 ring-medical-400/15">
                <CircleHelp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{section.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{section.description}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
