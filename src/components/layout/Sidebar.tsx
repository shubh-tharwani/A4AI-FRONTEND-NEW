import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  AcademicCapIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';
import { navigationItems } from '../../data/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export default function Sidebar({ isOpen, onClose, userRole = 'student' }: SidebarProps) {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Filter navigation items based on user role
  const filteredNavigation = navigationItems.filter(item => 
    !item.requiredRoles || item.requiredRoles.includes(userRole as any)
  );

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    // Exact match for routes to prevent overlap (e.g., /voice and /voice-lite)
    return location.pathname === href;
  };

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      x: '-100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const menuItemVariants = {
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.98,
    },
  };

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        animate={isOpen ? 'open' : 'closed'}
        className={cn(
          'fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 shadow-large z-50 lg:translate-x-0 lg:static lg:z-auto',
          'flex flex-col'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <AcademicCapIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-gray-900">A4AI</h1>
              <p className="text-sm text-gray-600">Education Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = isActiveRoute(item.href);
            const IconComponent = item.icon;
            const isHovered = hoveredItem === item.name;

            return (
              <motion.div
                key={item.name}
                variants={menuItemVariants}
                whileHover="hover"
                whileTap="tap"
                onHoverStart={() => setHoveredItem(item.name)}
                onHoverEnd={() => setHoveredItem(null)}
              >
                <Link
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'group relative flex items-center px-4 py-3 rounded-xl transition-all duration-200',
                    'hover:shadow-soft',
                    isActive
                      ? 'bg-gradient-primary text-white shadow-glow'
                      : 'text-gray-700 hover:bg-surface-2 hover:text-gray-900'
                  )}
                >
                  {/* Background glow effect */}
                  {isActive && (
                    <motion.div
                      layoutId="activeBackground"
                      className="absolute inset-0 bg-gradient-primary rounded-xl opacity-100"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}

                  <div className="relative flex items-center space-x-3 w-full">
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600'
                    )}>
                      <IconComponent className={cn(
                        'w-5 h-5 transition-all duration-200',
                        isActive && 'drop-shadow-sm',
                        isHovered && !isActive && 'scale-110'
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          'font-medium text-sm transition-colors',
                          isActive ? 'text-white' : 'text-gray-900'
                        )}>
                          {item.name}
                        </p>
                      </div>
                      <p className={cn(
                        'text-xs transition-colors mt-0.5',
                        isActive ? 'text-white/80' : 'text-gray-500'
                      )}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Link
            to="/settings"
            className={cn(
              'group flex items-center px-4 py-3 rounded-xl transition-all duration-200',
              'text-gray-700 hover:bg-surface-2 hover:text-gray-900 hover:shadow-soft',
              isActiveRoute('/settings') && 'bg-gradient-primary text-white shadow-glow'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
              isActiveRoute('/settings') 
                ? 'bg-white/20 text-white' 
                : 'bg-gray-100 text-gray-600 group-hover:bg-primary-100 group-hover:text-primary-600'
            )}>
              <CogIcon className="w-5 h-5" />
            </div>
            <div className="ml-3">
              <p className={cn(
                'font-medium text-sm',
                isActiveRoute('/settings') ? 'text-white' : 'text-gray-900'
              )}>
                Settings
              </p>
              <p className={cn(
                'text-xs',
                isActiveRoute('/settings') ? 'text-white/80' : 'text-gray-500'
              )}>
                Preferences and config
              </p>
            </div>
          </Link>
        </div>
      </motion.div>
    </>
  );
}
