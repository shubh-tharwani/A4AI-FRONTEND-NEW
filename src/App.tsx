import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Import pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import Assessment from './pages/assessment/Assessment';
import Activities from './pages/activities/Activities';
import Planning from './pages/planning/Planning';
import VoiceAssistant from './pages/voice-assistant/VoiceAssistant';
import VisualAids from './pages/visual-aids/VisualAids';
import ARScene from './pages/ar-scene/ARScene';

// Create a client
const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
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
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
          <Toaster position="top-right" />
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
