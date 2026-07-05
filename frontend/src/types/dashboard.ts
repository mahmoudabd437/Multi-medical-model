import type { LucideIcon } from 'lucide-react';

export type ThemeMode = 'dark' | 'light';

export type NavigationItem = {
  label: string;
  path: string;
  description: string;
  icon: LucideIcon;
  comingSoon?: boolean;
};

export type MetricCard = {
  label: string;
  value: string;
  delta: string;
  note: string;
  icon: LucideIcon;
  tone: 'teal' | 'sky' | 'violet' | 'amber';
};

export type StudyRecord = {
  name: string;
  modality: string;
  status: string;
  timestamp: string;
  confidence: string;
  color: 'teal' | 'blue' | 'violet' | 'amber';
};

export type HistoryRecord = {
  study: string;
  category: string;
  date: string;
  status: string;
  owner: string;
};

export type ProfileMetric = {
  label: string;
  value: string;
  description: string;
};

export type SettingOption = {
  label: string;
  description: string;
  enabled: boolean;
};
