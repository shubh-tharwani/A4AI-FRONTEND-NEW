import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import TeacherDashboard from './pages/dashboard/TeacherDashboard';
import Assessment from './pages/assessment/Assessment';
import Activities from './pages/activities/Activities';
import Planning from './pages/planning/Planning';
import VoiceAssistant from './pages/voice-assistant/VoiceAssistant';
import VisualAids from './pages/visual-aids/VisualAids';
import ARScene from './pages/ar-scene/ARScene';

// Components
import LoadingSpinner from './components/ui/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const { user, loading, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
            />
            
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  {user?.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />}
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/assessment"
              element={
                <ProtectedRoute>
                  <Assessment />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/activities"
              element={
                <ProtectedRoute>
                  <Activities />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/planning"
              element={
                <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                  <Planning />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/voice"
              element={
                <ProtectedRoute>
                  <VoiceAssistant />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/visual-aids"
              element={
                <ProtectedRoute>
                  <VisualAids />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/ar"
              element={
                <ProtectedRoute>
                  <ARScene />
                </ProtectedRoute>
              }
            />
            
            {/* Default Route */}
            <Route
              path="/"
              element={
                user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
              }
            />
          </Routes>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
