import {
  BellRing,
  Brain,
  Camera,
  ChartNoAxesCombined,
  CircleHelp,
  FileClock,
  LayoutDashboard,
  Eye,
  ScanSearch,
  Settings2,
  Sparkles,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import type { NavigationItem } from '@/types/dashboard';

export const publicNavigation: NavigationItem[] = [
  { label: 'Home', path: '/', description: 'Platform overview', icon: Sparkles },
  { label: 'Dashboard', path: '/dashboard', description: 'Operational command center', icon: LayoutDashboard },
  { label: 'About', path: '/about', description: 'Platform mission and roadmap', icon: CircleHelp },
];

export const sidebarNavigation: NavigationItem[] = [
  { label: 'Dashboard', path: '/dashboard', description: 'Clinical overview', icon: LayoutDashboard },
  { label: 'Chest X-ray', path: '/chest-xray', description: 'Radiology workstation', icon: Stethoscope },
  { label: 'Brain MRI', path: '/brain-mri', description: 'Neurology pipeline', icon: Brain },
  { label: 'Diabetic Retinopathy', path: '/diabetic-retinopathy', description: 'Retina analysis pipeline', icon: Eye },
  { label: 'Face Recognition', path: '/face-recognition', description: 'Identity workflows', icon: Camera },
  { label: 'History', path: '/history', description: 'Past sessions and audits', icon: FileClock },
  { label: 'Profile', path: '/profile', description: 'Clinician profile', icon: UserRound },
  { label: 'Settings', path: '/settings', description: 'App and security settings', icon: Settings2 },
  { label: 'About', path: '/about', description: 'Mission and architecture', icon: CircleHelp },
];

export const dashboardQuickLinks = [
  { label: 'Pending reviews', value: '18', icon: BellRing },
  { label: 'Confidence drift', value: '0.8%', icon: ChartNoAxesCombined },
  { label: 'New uploads', value: '42', icon: ScanSearch },
];
