import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';

// Import pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPageNew';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import Assessment from './pages/assessment/Assessment';
import Activities from './pages/activities/Activities';
import Planning from './pages/planning/Planning';
import VoiceAssistant from './pages/voice-assistant/EnhancedVoiceAssistant';
import VoiceLite from './pages/voice-lite/VoiceLite';
import VisualAids from './pages/visual-aids/VisualAids';
import ARScene from './pages/ar-scene/ARScene';
import AgenticDashboard from './pages/agentic/AgenticDashboard';

// Create a client
const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  
  // Check if user is authenticated and has valid session
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  
  // If user is authenticated and has valid session, redirect to dashboard
  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  
  // Initialize authentication on app start
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Routes>
              {/* Public routes - No authentication required */}
              <Route path="/" element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              } />
              <Route path="/login" element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } />
              
              {/* Additional public routes */}
              <Route path="/privacy" element={<div className="p-8">Privacy Policy Page</div>} />
              <Route path="/terms" element={<div className="p-8">Terms of Service Page</div>} />
              <Route path="/support" element={<div className="p-8">Support Page</div>} />
              <Route path="/forgot-password" element={<div className="p-8">Forgot Password Page</div>} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/assessment" element={
                <ProtectedRoute>
                  <Assessment />
                </ProtectedRoute>
              } />
              
              <Route path="/activities" element={
                <ProtectedRoute>
                  <Activities />
                </ProtectedRoute>
              } />
              
              <Route path="/planning" element={
                <ProtectedRoute>
                  <Planning />
                </ProtectedRoute>
              } />
              
              <Route path="/voice" element={
                <ProtectedRoute>
                  <VoiceAssistant />
                </ProtectedRoute>
              } />
              
              <Route path="/voice-lite" element={
                <ProtectedRoute>
                  <VoiceLite />
                </ProtectedRoute>
              } />
              
              <Route path="/visual-aids" element={
                <ProtectedRoute>
                  <VisualAids />
                </ProtectedRoute>
              } />
              
              <Route path="/ar-scene" element={
                <ProtectedRoute>
                  <ARScene />
                </ProtectedRoute>
              } />
              
              <Route path="/agentic" element={
                <ProtectedRoute>
                  <AgenticDashboard />
                </ProtectedRoute>
              } />
              
              {/* Default redirect for unknown routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          
          <Toaster position="top-right" />
        </Router>
      </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
