import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { setFavicon } from './lib/favicon';
import { isStageCompleted, STAGES } from './lib/storage';
import PinPage from './pages/pin/PinPage';
import Camera from './pages/camera/CameraPage';
import DashPage from './pages/dash/DashPage';
import WordHuntPage from './pages/wordhunt/WordHuntPage';
import ButtonPage from './pages/stage2/ButtonPage';
import Stage3Page from './pages/stage3/Stage3Page';
import Stage4Page from './pages/stage4/Stage4Page';
import TroubleshootPage from './pages/troubleshoot/TroubleshootPage';
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === '/dash') {
      let count = 0;
      if (isStageCompleted(STAGES.WORDHUNT)) count++;
      if (isStageCompleted(STAGES.STAGE2)) count++;
      if (isStageCompleted(STAGES.STAGE3)) count++;
      setFavicon(Math.min(3, Math.max(1, count + 1)) as 1 | 2 | 3);
    } else if (pathname === '/stage1') setFavicon(1);
    else if (pathname === '/stage2') setFavicon(2);
    else if (pathname === '/stage3' || pathname === '/stage4') setFavicon(3);
    else setFavicon(1);
  }, [pathname]);

  return (
    <Routes>
      <Route path="/" element={<PinPage />} />
      <Route path="/camera" element={<Camera />} />
      <Route path="/dash" element={<ProtectedRoute><DashPage /></ProtectedRoute>} />
      <Route path="/stage1" element={<ProtectedRoute><WordHuntPage /></ProtectedRoute>} />
      <Route path="/stage2" element={<ProtectedRoute requireStageCompleted={STAGES.WORDHUNT}><ButtonPage /></ProtectedRoute>} />
      <Route path="/stage3" element={<ProtectedRoute requireStageCompleted={STAGES.STAGE2}><Stage3Page /></ProtectedRoute>} />
      <Route path="/stage4" element={<ProtectedRoute requireStageCompleted={STAGES.STAGE3}><Stage4Page /></ProtectedRoute>} />
      <Route path="/troubleshoot" element={<ProtectedRoute><TroubleshootPage /></ProtectedRoute>} />
    </Routes>
  );
}

export default AppRoutes;