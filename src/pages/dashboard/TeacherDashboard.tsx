import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UsersIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import Navigation from '../../components/layout/Navigation';
import { useAuthStore } from '../../store/authStore';
import { cn, formatDate } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface ClassData {
  id: string;
  name: string;
  studentCount: number;
  averageScore: number;
  recentActivity: Date;
}

interface DashboardStats {
  totalStudents: number;
  activeClasses: number;
  averageClassScore: number;
  totalLessons: number;
}

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalStudents: 0,
      activeClasses: 0,
      averageClassScore: 0,
      totalLessons: 0,
    } as DashboardStats,
    classes: [] as ClassData[],
    recentActivities: [] as any[],
  });

  useEffect(() => {
    // Simulate loading dashboard data
    setTimeout(() => {
      setDashboardData({
        stats: {
          totalStudents: 127,
          activeClasses: 5,
          averageClassScore: 84,
          totalLessons: 45,
        },
        classes: [
          {
            id: '1',
            name: 'Mathematics Grade 9',
            studentCount: 28,
            averageScore: 87,
            recentActivity: new Date(Date.now() - 3600000),
          },
          {
            id: '2',
            name: 'Science Grade 8',
            studentCount: 25,
            averageScore: 82,
            recentActivity: new Date(Date.now() - 7200000),
          },
          {
            id: '3',
            name: 'English Grade 10',
            studentCount: 30,
            averageScore: 89,
            recentActivity: new Date(Date.now() - 10800000),
          },
        ],
        recentActivities: [
          {
            id: '1',
            type: 'quiz',
            title: 'New quiz created: Algebra Basics',
            timestamp: new Date(Date.now() - 3600000),
            class: 'Mathematics Grade 9',
          },
          {
            id: '2',
            type: 'lesson',
            title: 'Lesson plan updated: Photosynthesis',
            timestamp: new Date(Date.now() - 7200000),
            class: 'Science Grade 8',
          },
        ],
      });
      setLoading(false);
    }, 1000);
  }, []);

  const statsCards = [
    {
      title: 'Total Students',
      value: dashboardData.stats.totalStudents,
      icon: UsersIcon,
      color: 'from-primary-500 to-primary-600',
      change: '+12 this month',
    },
    {
      title: 'Active Classes',
      value: dashboardData.stats.activeClasses,
      icon: AcademicCapIcon,
      color: 'from-secondary-500 to-secondary-600',
      change: '+1 this semester',
    },
    {
      title: 'Average Score',
      value: `${dashboardData.stats.averageClassScore}%`,
      icon: TrophyIcon,
      color: 'from-warning-500 to-warning-600',
      change: '+3% this month',
    },
    {
      title: 'Total Lessons',
      value: dashboardData.stats.totalLessons,
      icon: CalendarDaysIcon,
      color: 'from-accent-500 to-accent-600',
      change: '+8 this week',
    },
  ];

  if (loading) {
    return (
      <Navigation>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-800 to-accent-800 bg-clip-text text-transparent">
              Teacher Dashboard 📚
            </h1>
            <p className="text-neutral-600 mt-2">
              Welcome, {user?.display_name}! Manage your classes and track student progress.
            </p>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-primary-100/30 p-6 hover:shadow-medium transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">{card.title}</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-2">{card.value}</p>
                    <p className="text-sm text-secondary-600 mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-secondary-500 rounded-full"></span>
                      {card.change}
                    </p>
                  </div>
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-r flex items-center justify-center shadow-medium ring-2 ring-white/20",
                    card.color
                  )}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Classes Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-primary-100/30 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                My Classes
              </h3>
              <div className="space-y-4">
                {dashboardData.classes.map((classItem, index) => (
                  <motion.div
                    key={classItem.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50/30 to-accent-50/30 backdrop-blur-sm rounded-xl hover:from-primary-50/50 hover:to-accent-50/50 transition-all duration-300 cursor-pointer border border-primary-100/20"
                  >
                    <div>
                      <h4 className="font-medium text-neutral-900">{classItem.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-info-500 rounded-full"></div>
                          {classItem.studentCount} students
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-secondary-500 rounded-full"></div>
                          Avg: {classItem.averageScore}%
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-accent-500 rounded-full"></div>
                          Active {formatDate(classItem.recentActivity)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        "w-3 h-3 rounded-full shadow-soft",
                        classItem.averageScore >= 85 ? "bg-secondary-500" :
                        classItem.averageScore >= 70 ? "bg-warning-500" : "bg-error-500"
                      )}></div>
                      <ChartBarIcon className="w-5 h-5 text-primary-600" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-primary-100/30 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                Recent Activities
              </h3>
              <div className="space-y-4">
                {dashboardData.recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ClipboardDocumentListIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatDate(activity.timestamp, 'time')}</span>
                        <span>{activity.class}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 group">
              <div className="flex items-center space-x-3">
                <CalendarDaysIcon className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" />
                <div className="text-left">
                  <h4 className="font-semibold">Create Lesson Plan</h4>
                  <p className="text-sm opacity-90">Plan your next class</p>
                </div>
              </div>
            </button>

            <button className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 group">
              <div className="flex items-center space-x-3">
                <ClipboardDocumentListIcon className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" />
                <div className="text-left">
                  <h4 className="font-semibold">Create Quiz</h4>
                  <p className="text-sm opacity-90">Test student knowledge</p>
                </div>
              </div>
            </button>

            <button className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 group">
              <div className="flex items-center space-x-3">
                <ChartBarIcon className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" />
                <div className="text-left">
                  <h4 className="font-semibold">View Analytics</h4>
                  <p className="text-sm opacity-90">Track student progress</p>
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </Navigation>
  );
}
