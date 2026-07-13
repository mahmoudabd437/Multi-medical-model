import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';

export function PublicLayout() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-medical-radial opacity-90" />
      <Navbar mode="public" />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div key={location.pathname}>
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
