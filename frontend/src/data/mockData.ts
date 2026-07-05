import {
  Activity,
  Brain,
  Camera,
  Clock3,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Zap,
} from 'lucide-react';
import type { HistoryRecord, MetricCard, ProfileMetric, SettingOption, StudyRecord } from '@/types/dashboard';

export const dashboardMetrics: MetricCard[] = [
  {
    label: 'Studies reviewed',
    value: '1,248',
    delta: '+12.4%',
    note: 'Last 30 days across all active workflows',
    icon: Activity,
    tone: 'teal',
  },
  {
    label: 'Average turnaround',
    value: '2.8 min',
    delta: '-18.2%',
    note: 'From upload to report-ready summary',
    icon: Clock3,
    tone: 'sky',
  },
  {
    label: 'AI confidence',
    value: '97.9%',
    delta: '+2.1%',
    note: 'Calibration quality across approved models',
    icon: ShieldCheck,
    tone: 'violet',
  },
  {
    label: 'High-priority cases',
    value: '14',
    delta: '-6',
    note: 'Flagged for expedited human review',
    icon: HeartPulse,
    tone: 'amber',
  },
];

export const dashboardStudies: StudyRecord[] = [
  {
    name: 'Chest X-ray - PA View',
    modality: 'Radiology',
    status: 'Ready for review',
    timestamp: '4 min ago',
    confidence: '98.8%',
    color: 'teal',
  },
  {
    name: 'Chest X-ray - Portable',
    modality: 'Emergency',
    status: 'Pending sign-off',
    timestamp: '11 min ago',
    confidence: '94.1%',
    color: 'blue',
  },
  {
    name: 'Brain MRI - T1 Sequence',
    modality: 'Neurology',
    status: 'Queued',
    timestamp: '24 min ago',
    confidence: 'Coming soon',
    color: 'violet',
  },
  {
    name: 'Dermatoscope Capture',
    modality: 'Dermatology',
    status: 'Awaiting model activation',
    timestamp: '37 min ago',
    confidence: 'Coming soon',
    color: 'amber',
  },
];

export const dashboardHighlights = [
  {
    title: 'Multi-model orchestration',
    description: 'Designed to host separate AI pipelines per imaging modality without coupling them together.',
    icon: Sparkles,
  },
  {
    title: 'Clinical safety first',
    description: 'Interfaces emphasize human-in-the-loop workflows, audit visibility, and conservative decision support.',
    icon: Stethoscope,
  },
  {
    title: 'Fast interpretation',
    description: 'Premium motion, density, and color treatment keep the workspace clear while still feeling advanced.',
    icon: Zap,
  },
];

export const chestXrayFindings = [
  'No acute cardiopulmonary abnormality detected in the mock study.',
  'Mild peri-hilar prominence is highlighted for continued review.',
  'The confidence model remains in demonstration mode until backend integration is added.',
];

export const modalityMarkers = [
  { label: 'AI assist', value: 'On', icon: Brain },
  { label: 'Upload queue', value: '12', icon: Camera },
  { label: 'Audit trail', value: 'Enabled', icon: ShieldCheck },
];

export const historyRecords: HistoryRecord[] = [
  {
    study: 'Chest X-ray - PA View',
    category: 'Radiology',
    date: '2026-07-04',
    status: 'Approved',
    owner: 'Dr. Amelia Carter',
  },
  {
    study: 'Chest X-ray - Portable',
    category: 'Emergency',
    date: '2026-07-03',
    status: 'Needs review',
    owner: 'Dr. Marcus Lee',
  },
  {
    study: 'Brain MRI - Screening',
    category: 'Neurology',
    date: '2026-07-02',
    status: 'Queued',
    owner: 'Dr. Sara Ahmed',
  },
  {
    study: 'Skin Lesion Capture',
    category: 'Dermatology',
    date: '2026-07-01',
    status: 'Coming soon',
    owner: 'Platform',
  },
];

export const profileMetrics: ProfileMetric[] = [
  { label: 'Specialty', value: 'Radiology', description: 'Primary workflow alignment' },
  { label: 'Location', value: 'Clinical Imaging Center', description: 'Main service hub' },
  { label: 'Shift pattern', value: 'Day + On-call', description: 'Configurable coverage' },
];

export const profileCapabilities = [
  'Access to all approved imaging dashboards',
  'Review and sign-off trails for every study',
  'Role-aware visibility and audit scaffolding',
];

export const settingsGroups: Array<{ title: string; options: SettingOption[] }> = [
  {
    title: 'Notifications',
    options: [
      { label: 'Critical findings', description: 'Notify immediately when a study is escalated.', enabled: true },
      { label: 'Daily summary', description: 'Receive a condensed workflow digest once per day.', enabled: true },
      { label: 'Model updates', description: 'Track changes to supported analysis pipelines.', enabled: false },
    ],
  },
  {
    title: 'Data handling',
    options: [
      { label: 'Store local previews', description: 'Retain temporary study previews on the device.', enabled: true },
      { label: 'Share anonymized analytics', description: 'Contribute non-identifying usage insights.', enabled: false },
      { label: 'Auto-archive completed cases', description: 'Move finished items into history automatically.', enabled: true },
    ],
  },
];

export const aboutSections = [
  {
    title: 'Purpose-built architecture',
    description: 'The dashboard is structured to accept dedicated medical models without rewriting the shell.',
  },
  {
    title: 'Company-grade presentation',
    description: 'Glass panels, careful spacing, and strong contrast are tuned for executive and clinical teams.',
  },
  {
    title: 'Future ready',
    description: 'Every major section is routed and isolated so new modalities can be added with minimal surface area.',
  },
];
