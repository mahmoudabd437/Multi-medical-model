import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import About from '@/pages/About';
import BrainMRI from '@/pages/BrainMRI';
import ChestXray from '@/pages/ChestXray';
import Dashboard from '@/pages/Dashboard';
import FaceRecognition from '@/pages/FaceRecognition';
import History from '@/pages/History';
import Home from '@/pages/Home';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import SkinDisease from '@/pages/SkinDisease';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
        </Route>

        <Route element={<DashboardLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chest-xray" element={<ChestXray />} />
          <Route path="brain-mri" element={<BrainMRI />} />
          <Route path="skin-disease" element={<SkinDisease />} />
          <Route path="face-recognition" element={<FaceRecognition />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
