import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import TailwindSafelist from './lib/tailwind-safelist';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import FilesPage from './pages/FilesPage';
import ProfilePage from './pages/ProfilePage';
import PublicFilePage from './pages/PublicFilePage';
import AnalyticsPage from './pages/AnalyticsPage';
import FolderViewPage from './pages/FolderViewPage';
import LandingPage from './pages/LandingPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TailwindSafelist />
        <BrowserRouter>

            {/* Public Routes */}
          <Routes>
            <Route path="/landing" element={<LandingPage />} /> 
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:resettoken" element={<ResetPasswordPage />} />
            <Route path="/folders/:id" element={<FolderViewPage />} />


            {/* Private Routes */}
            <Route path="/dashboard" element={
              <PrivateRoute><DashboardPage /></PrivateRoute>
            } />

            <Route path="/files" element={
              <PrivateRoute><FilesPage /></PrivateRoute>
            } />
            
            <Route path="/profile" element={
              <PrivateRoute><ProfilePage /></PrivateRoute>
            } />

            <Route path="/public/:id" element={<PublicFilePage />} />

            <Route path="*" element={<Navigate to="/" />} />

            {/* Analytics Page Route */}
            <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
          </Routes>
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;




