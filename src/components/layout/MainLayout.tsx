import { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface MainLayoutProps {
  children: ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  nestedNavigation?: boolean;
  onSidebarStateChange?: (isCollapsed: boolean) => void;
}

export default function MainLayout({ 
  children, 
  user,
  nestedNavigation = false,
  onSidebarStateChange 
}: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    if (onSidebarStateChange) {
      onSidebarStateChange(newState);
    }
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    if (onSidebarStateChange) {
      onSidebarStateChange(false);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div className={`${
        nestedNavigation && isSidebarOpen ? 'lg:w-20' : 'lg:w-80'
      } hidden lg:block flex-shrink-0 transition-all duration-300`}>
        <Sidebar 
          isOpen={!nestedNavigation || !isSidebarOpen} 
          onClose={closeSidebar} 
          userRole={user?.role} 
        />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} userRole={user?.role} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <TopBar onMenuClick={toggleSidebar} user={user} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
