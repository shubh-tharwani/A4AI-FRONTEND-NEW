import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpenIcon, 
  TrophyIcon, 
  ChartBarIcon,
  PlayIcon,
  MicrophoneIcon,
  CubeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Navigation from '../../components/layout/Navigation';
import { useAuthStore } from '../../store/authStore';
import { cn, formatDate, getGradeLabel } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface DashboardCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  change?: string;
  href?: string;
}

interface RecentActivity {
  id: string;
  type: 'quiz' | 'activity' | 'lesson' | 'voice';
  title: string;
  score?: number;
  timestamp: Date;
  grade?: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalLessons: 0,
    completedQuizzes: 0,
    averageScore: 0,
    studyTime: 0,
    badges: [] as Badge[],
    recentActivities: [] as RecentActivity[],
  });

  useEffect(() => {
    // Simulate loading dashboard data
    setTimeout(() => {
      setDashboardData({
        totalLessons: 24,
        completedQuizzes: 18,
        averageScore: 87,
        studyTime: 145,
        badges: [
          {
            id: '1',
            name: 'Quick Learner',
            description: 'Completed 5 lessons in one day',
            icon: '⚡',
            earned_at: new Date(),
            rarity: 'rare',
          },
          {
            id: '2',
            name: 'Quiz Master',
            description: 'Scored 90% or higher on 10 quizzes',
            icon: '🏆',
            earned_at: new Date(Date.now() - 86400000),
            rarity: 'epic',
          },
        ],
        recentActivities: [
          {
            id: '1',
            type: 'quiz',
            title: 'Mathematics Quiz: Algebra Basics',
            score: 92,
            timestamp: new Date(Date.now() - 3600000),
            grade: 9,
          },
          {
            id: '2',
            type: 'activity',
            title: 'Interactive Story: Space Exploration',
            timestamp: new Date(Date.now() - 7200000),
            grade: 9,
          },
          {
            id: '3',
            type: 'voice',
            title: 'Voice Chat: History Questions',
            timestamp: new Date(Date.now() - 10800000),
          },
        ],
      });
      setLoading(false);
    }, 1000);
  }, []);

  const dashboardCards: DashboardCard[] = [
    {
      title: 'Lessons Completed',
      value: dashboardData.totalLessons,
      icon: BookOpenIcon,
      color: 'from-primary-500 to-primary-600',
      change: '+3 this week',
      href: '/activities',
    },
    {
      title: 'Quizzes Taken',
      value: dashboardData.completedQuizzes,
      icon: ChartBarIcon,
      color: 'from-secondary-500 to-secondary-600',
      change: '+2 this week',
      href: '/assessment',
    },
    {
      title: 'Average Score',
      value: `${dashboardData.averageScore}%`,
      icon: TrophyIcon,
      color: 'from-warning-500 to-warning-600',
      change: '+5% this month',
    },
    {
      title: 'Study Time',
      value: `${dashboardData.studyTime}min`,
      icon: ClockIcon,
      color: 'from-accent-500 to-accent-600',
      change: '+30min this week',
    },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-warning-400 to-warning-600';
      case 'epic':
        return 'from-accent-400 to-accent-600';
      case 'rare':
        return 'from-primary-400 to-primary-600';
      default:
        return 'from-neutral-400 to-neutral-600';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return ChartBarIcon;
      case 'activity':
        return PlayIcon;
      case 'voice':
        return MicrophoneIcon;
      case 'lesson':
        return BookOpenIcon;
      default:
        return BookOpenIcon;
    }
  };

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
              Welcome back, {user?.display_name?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p className="text-neutral-600 mt-2">
              Ready to continue your learning journey? Let's see what's new today.
            </p>
          </motion.div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className={cn(
                "bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-primary-100/30 p-6 hover:shadow-medium transition-all duration-300 group",
                card.href && "cursor-pointer hover:border-primary-200"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">{card.title}</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-2">{card.value}</p>
                    {card.change && (
                      <p className="text-sm text-secondary-600 mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-secondary-500 rounded-full"></span>
                        {card.change}
                      </p>
                    )}
                  </div>
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-r flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-medium ring-2 ring-white/20",
                    card.color
                  )}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-primary-100/30 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                Recent Activities
              </h3>
              <div className="space-y-4">
                {dashboardData.recentActivities.map((activity, index) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                      className="flex items-center space-x-4 p-4 bg-gradient-to-r from-primary-50/30 to-accent-50/30 backdrop-blur-sm rounded-xl hover:from-primary-50/50 hover:to-accent-50/50 transition-all duration-300 border border-primary-100/20"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-100 to-primary-200 rounded-xl flex items-center justify-center shadow-soft">
                        <ActivityIcon className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-neutral-900">{activity.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-neutral-500">
                          <span>{formatDate(activity.timestamp, 'time')}</span>
                          {activity.grade && (
                            <span className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-info-500 rounded-full"></div>
                              {getGradeLabel(activity.grade)}
                            </span>
                          )}
                          {activity.score && (
                            <span className="text-secondary-600 font-medium flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-secondary-500 rounded-full"></div>
                              Score: {activity.score}%
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-primary-100/30 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                Latest Badges
              </h3>
              <div className="space-y-4">
                {dashboardData.badges.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                    className="flex items-center space-x-3 p-3 bg-gradient-to-r from-primary-50/30 to-accent-50/30 backdrop-blur-sm rounded-xl border border-primary-100/20"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-r flex items-center justify-center text-2xl shadow-medium ring-2 ring-white/20",
                      getRarityColor(badge.rarity)
                    )}>
                      {badge.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-neutral-900">{badge.name}</h4>
                      <p className="text-sm text-neutral-500">{badge.description}</p>
                      <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-accent-500 rounded-full"></div>
                        {formatDate(badge.earned_at)}
                      </p>
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
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-300 group shadow-soft hover:shadow-medium">
              <div className="flex items-center space-x-3">
                <MicrophoneIcon className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-left">
                  <h4 className="font-semibold">Start Voice Chat</h4>
                  <p className="text-sm opacity-90">Ask AI assistant questions</p>
                </div>
              </div>
            </button>

            <button className="bg-gradient-to-r from-accent-500 to-accent-600 text-white p-6 rounded-xl hover:from-accent-600 hover:to-accent-700 transition-all duration-300 group shadow-soft hover:shadow-medium">
              <div className="flex items-center space-x-3">
                <CubeIcon className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-left">
                  <h4 className="font-semibold">AR Experience</h4>
                  <p className="text-sm opacity-90">Explore in 3D space</p>
                </div>
              </div>
            </button>

            <button className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white p-6 rounded-xl hover:from-secondary-600 hover:to-secondary-700 transition-all duration-300 group shadow-soft hover:shadow-medium">
              <div className="flex items-center space-x-3">
                <ChartBarIcon className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-left">
                  <h4 className="font-semibold">Take Quiz</h4>
                  <p className="text-sm opacity-90">Test your knowledge</p>
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </Navigation>
  );
}
