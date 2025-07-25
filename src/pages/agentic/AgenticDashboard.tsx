import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AgenticService from '../../services/agenticService';
import type { AgenticPipelineStatus } from '../../types/agentic';
import LessonPlanForm from './LessonPlanForm';
import ContentGenerator from './ContentGenerator';
import AssessmentCreator from './AssessmentCreator';
import VisualAidsGenerator from './VisualAidsGenerator';
import StatusPanel from './StatusPanel';

const tabs = [
  { id: 'lesson-planning', label: 'Lesson Planning', icon: '📚' },
  { id: 'content', label: 'Content Generation', icon: '✍️' },
  { id: 'assessment', label: 'Assessments', icon: '📝' },
  { id: 'visual-aids', label: 'Visual Aids', icon: '🎨' },
];

import MainLayout from '../../components/layout/MainLayout';
import { useAuthStore } from '../../store/authStore';

export default function AgenticDashboard() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState('lesson-planning');
  const [isAgenticSidebarOpen, setIsAgenticSidebarOpen] = useState(true);
  const [pipelineStatus, setPipelineStatus] = useState<AgenticPipelineStatus>({
    status: 'idle',
    timestamp: new Date().toISOString(),
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await AgenticService.getPipelineStatus();
        setPipelineStatus(status);
      } catch (error) {
        console.error('Error fetching pipeline status:', error);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 10 seconds
    const interval = setInterval(fetchStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'lesson-planning':
        return <LessonPlanForm />;
      case 'content':
        return <ContentGenerator />;
      case 'assessment':
        return <AssessmentCreator />;
      case 'visual-aids':
        return <VisualAidsGenerator />;
      default:
        return null;
    }
  };

  return (
    <MainLayout 
      user={user ? {
        name: user.display_name || user.email,
        email: user.email,
        role: user.role,
      } : undefined}
      nestedNavigation={true}
      onSidebarStateChange={setIsAgenticSidebarOpen}
    >
      <div className="h-full">
        <div className="flex h-full">
          {/* Agentic Sidebar */}
          <motion.div
            className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform lg:relative lg:translate-x-0 transition-transform duration-200 ease-in-out ${
              isAgenticSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            initial={false}
          >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">AgenticAI</h2>
              <p className="text-sm text-gray-500">AI-Powered Education Tools</p>
            </div>

            <nav className="flex-1 overflow-y-auto p-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsAgenticSidebarOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <StatusPanel status={pipelineStatus} />
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <main className="p-4 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              {renderActiveTab()}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
    </MainLayout>
  );
}
