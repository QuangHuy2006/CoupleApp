import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { Pairing } from '../pages/pairing/Pairing';
import { Home } from '../pages/dashboard/Home';
import { Chat } from '../pages/chat/Chat';
import { DiaryList } from '../pages/diary/DiaryList';
import { AddDiary } from '../pages/diary/AddDiary';
import { DiaryDetail } from '../pages/diary/DiaryDetail';
import UserProfilePage from '../pages/UserProfilePage';
import LocationSharePage from '../pages/LocationSharePage';

import { CallModal } from '../components/chat/CallModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePairing?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requirePairing = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requirePairing && !user.is_paired) {
    return <Navigate to="/pairing" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <CallModal />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/pairing"
          element={
            <ProtectedRoute>
              <Pairing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute requirePairing>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/diary" element={<ProtectedRoute requirePairing><DiaryList /></ProtectedRoute>} />
        <Route path="/diary/add" element={<ProtectedRoute requirePairing><AddDiary /></ProtectedRoute>} />
        <Route path="/diary/:diaryId" element={<ProtectedRoute requirePairing><DiaryDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute requirePairing><UserProfilePage /></ProtectedRoute>} />
        <Route path="/location" element={<ProtectedRoute requirePairing><LocationSharePage /></ProtectedRoute>} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute requirePairing>
              <Chat />
            </ProtectedRoute>
          }
        />
        {/* <Route path="/profile" element={<ProtectedRoute requirePairing><Profile /></ProtectedRoute>} /> */}
        {/* <Route path="/wishlist" element={<ProtectedRoute requirePairing><Wishlist /></ProtectedRoute>} /> */}
      </Routes>
    </BrowserRouter>
  );
};