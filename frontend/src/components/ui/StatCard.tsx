import { motion } from 'framer-motion';
import type { MetricCard } from '@/types/dashboard';
import { cn } from '@/lib/cn';

type StatCardProps = {
  metric: MetricCard;
  delay?: number;
};

const toneMap: Record<MetricCard['tone'], string> = {
  teal: 'from-teal-400/20 to-teal-400/5 text-teal-100',
  sky: 'from-sky-400/20 to-sky-400/5 text-sky-100',
  violet: 'from-violet-400/20 to-violet-400/5 text-violet-100',
  amber: 'from-amber-400/20 to-amber-400/5 text-amber-100',
};

export function StatCard({ metric, delay = 0 }: StatCardProps) {
  const Icon = metric.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="glass-panel rounded-3xl p-5"
    >
      <div className={cn('rounded-2xl bg-gradient-to-br p-3', toneMap[metric.tone])}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">{metric.label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-white">{metric.value}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 text-white/90 ring-1 ring-white/10">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-white/85">
          <span>{metric.delta}</span>
          <span className="text-right text-white/65">{metric.note}</span>
        </div>
      </div>
    </motion.article>
  );
}
