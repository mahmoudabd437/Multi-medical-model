import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from '@/components/navigation/Footer';
import { Navbar } from '@/components/navigation/Navbar';
import { Sidebar } from '@/components/navigation/Sidebar';

const dashboardTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Command center overview' },
  '/chest-xray': { title: 'Chest X-ray', subtitle: 'Radiology workspace' },
  '/brain-mri': { title: 'Brain MRI', subtitle: 'Neurology workspace' },
  '/diabetic-retinopathy': { title: 'Diabetic Retinopathy', subtitle: 'Retina analysis workspace' },
  '/skin-disease': { title: 'Diabetic Retinopathy', subtitle: 'Retina analysis workspace' },
  '/face-recognition': { title: 'Face Recognition', subtitle: 'Identity workflow' },
  '/history': { title: 'History', subtitle: 'Audit trail and review history' },
  '/reports': { title: 'Reports', subtitle: "Today's report workspace" },
  '/profile': { title: 'Home', subtitle: 'Platform overview' },
  '/settings': { title: 'Home', subtitle: 'Platform overview' },
  '/about': { title: 'About', subtitle: 'Product vision and architecture' },
};

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const currentRoute = dashboardTitles[location.pathname] ?? dashboardTitles['/dashboard'];

  return (
    <div className="relative min-h-screen overflow-hidden lg:flex">
      <div className="absolute inset-0 -z-10 bg-medical-radial opacity-80" />
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
      />

      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <Navbar
          mode="dashboard"
          onMenuClick={() => setSidebarOpen(true)}
          title={currentRoute.title}
          subtitle={currentRoute.subtitle}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
            <div key={location.pathname}>
              <Outlet />
            </div>
          </div>
        </main>
        <Footer compact />
      </div>
    </div>
  );
}
