import { Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';

type ComingSoonStateProps = {
  title: string;
  description: string;
  note?: string;
};

export function ComingSoonState({ title, description, note = 'This section is scaffolded and ready for model integration.' }: ComingSoonStateProps) {
  return (
    <GlassCard className="mx-auto max-w-3xl p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-medical-500/14 text-medical-200 ring-1 ring-medical-400/20">
        <Sparkles className="h-8 w-8" />
      </div>
      <div className="mt-5 space-y-3">
        <Badge variant="info">Coming soon</Badge>
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-400">{note}</p>
      </div>
    </GlassCard>
  );
}
