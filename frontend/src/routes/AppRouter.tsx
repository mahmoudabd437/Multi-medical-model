import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import About from '@/pages/About';
import BrainMRI from '@/pages/BrainMRI';
import ChestXray from '@/pages/ChestXray';
import FaceRecognition from '@/pages/FaceRecognition';
import History from '@/pages/History';
import Home from '@/pages/Home';
import Reports from '@/pages/Reports';
import DiabeticRetinopathy from '@/pages/DiabeticRetinopathy';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
        </Route>

        <Route element={<DashboardLayout />}>
          <Route path="dashboard" element={<Home />} />
          <Route path="chest-xray" element={<ChestXray />} />
          <Route path="brain-mri" element={<BrainMRI />} />
          <Route path="diabetic-retinopathy" element={<DiabeticRetinopathy />} />
          <Route path="skin-disease" element={<Navigate to="/diabetic-retinopathy" replace />} />
          <Route path="face-recognition" element={<FaceRecognition />} />
          <Route path="history" element={<History />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Navigate to="/" replace />} />
          <Route path="settings" element={<Navigate to="/" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
