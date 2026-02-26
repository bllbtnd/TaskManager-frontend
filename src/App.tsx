import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Register from './pages/Register';
import Projects from './pages/Projects';
import TaskBoard from './pages/TaskBoard';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import BugReport from './pages/BugReport';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { authService } from './services/authService';

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          colorBgContainer: '#1f1f1f',
          colorBgElevated: '#262626',
        },
      }}
    >
      <Toaster theme="dark" position="top-right" richColors closeButton />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/projects" replace />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:projectId" element={<TaskBoard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="bug-report" element={<BugReport />} />
            <Route
              path="admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;
