import type { ReactNode } from 'react';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeader({ eyebrow, title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 max-w-2xl space-y-2">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.32em] text-medical-300">{eyebrow}</p> : null}
        <h2 className="text-pretty break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
        {description ? <p className="max-w-3xl break-words text-sm leading-6 text-slate-300">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0 max-w-full sm:pt-1">{action}</div> : null}
    </div>
  );
}
