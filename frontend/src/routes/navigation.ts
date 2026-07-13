import {
  BellRing,
  Brain,
  Camera,
  ChartNoAxesCombined,
  CircleHelp,
  FileClock,
  Eye,
  ScanSearch,
  Sparkles,
  Stethoscope,
  FileText,
} from 'lucide-react';
import type { NavigationItem } from '@/types/dashboard';

export const publicNavigation: NavigationItem[] = [
  { label: 'Home', path: '/', description: 'Platform overview', icon: Sparkles },
  { label: 'Dashboard', path: '/dashboard', description: 'Clinical command center', icon: ChartNoAxesCombined },
  { label: 'About', path: '/about', description: 'Platform mission and roadmap', icon: CircleHelp },
];

export const sidebarNavigation: NavigationItem[] = [
  { label: 'Home', path: '/', description: 'Platform overview', icon: Sparkles },
  { label: 'About', path: '/about', description: 'Platform mission and roadmap', icon: CircleHelp },
  { label: 'Chest X-ray', path: '/chest-xray', description: 'Radiology workstation', icon: Stethoscope },
  { label: 'Brain MRI', path: '/brain-mri', description: 'Neurology pipeline', icon: Brain },
  { label: 'Diabetic Retinopathy', path: '/diabetic-retinopathy', description: 'Retina analysis pipeline', icon: Eye },
  { label: 'Face Recognition', path: '/face-recognition', description: 'Identity workflows', icon: Camera },
  { label: 'History', path: '/history', description: 'Past sessions and audits', icon: FileClock },
  { label: 'Reports', path: '/reports', description: "Today's medical reports", icon: FileText },
];

export const dashboardQuickLinks = [
  { label: 'Pending reviews', value: '18', icon: BellRing },
  { label: 'Confidence drift', value: '0.8%', icon: ChartNoAxesCombined },
  { label: 'New uploads', value: '42', icon: ScanSearch },
];
