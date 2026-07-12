import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from '@/components/navigation/Footer';
import { Navbar } from '@/components/navigation/Navbar';
import { Sidebar } from '@/components/navigation/Sidebar';

const dashboardTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Clinical command center' },
  '/chest-xray': { title: 'Chest X-ray', subtitle: 'Radiology workspace' },
  '/brain-mri': { title: 'Brain MRI', subtitle: 'Neurology workspace' },
  '/diabetic-retinopathy': { title: 'Diabetic Retinopathy', subtitle: 'Retina analysis workspace' },
  '/skin-disease': { title: 'Diabetic Retinopathy', subtitle: 'Retina analysis workspace' },
  '/face-recognition': { title: 'Face Recognition', subtitle: 'Identity workflow' },
  '/history': { title: 'History', subtitle: 'Audit trail and review history' },
  '/profile': { title: 'Profile', subtitle: 'Clinician profile' },
  '/settings': { title: 'Settings', subtitle: 'Preferences and governance' },
  '/about': { title: 'About', subtitle: 'Product vision and architecture' },
};

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const currentRoute = dashboardTitles[location.pathname] ?? dashboardTitles['/dashboard'];

  return (
    <div className="relative min-h-screen overflow-hidden lg:flex">
      <div className="absolute inset-0 -z-10 bg-medical-radial opacity-80" />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <Navbar
          mode="dashboard"
          onMenuClick={() => setSidebarOpen(true)}
          title={currentRoute.title}
          subtitle={currentRoute.subtitle}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.32, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        <Footer compact />
      </div>
    </div>
  );
}
