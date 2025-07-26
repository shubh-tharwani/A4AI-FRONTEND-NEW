import {
  HomeIcon,
  BookOpenIcon,
  MicrophoneIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export const navigationItems = [
  {
    name: 'Dashboard',
    description: 'Overview and analytics',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Voice Assistant',
    description: 'AI-powered voice chat',
    href: '/voice',
    icon: MicrophoneIcon,
    requiredRoles: ['student', 'teacher', 'admin'],
  },
  {
    name: 'Voice Lite',
    description: 'Simplified voice practice',
    href: '/voice-lite',
    icon: ChatBubbleLeftRightIcon,
    requiredRoles: ['student'],
  },
  {
    name: 'Assessment',
    description: 'Take quizzes and tests',
    href: '/assessment',
    icon: DocumentTextIcon,
    requiredRoles: ['student', 'teacher'],
  },
  {
    name: 'Activities',
    description: 'Interactive learning activities',
    href: '/activities',
    icon: BookOpenIcon,
    requiredRoles: ['student', 'teacher', 'admin'],
  },
  {
    name: 'Planning',
    description: 'Lesson and curriculum planning',
    href: '/planning',
    icon: UserGroupIcon,
    requiredRoles: ['teacher', 'admin'],
  },
  {
    name: 'Visual Aids',
    description: 'Educational visual content',
    href: '/visual-aids',
    icon: ChartBarIcon,
    requiredRoles: ['teacher', 'admin'],
  },
  {
    name: 'Agentic AI',
    description: 'Advanced AI-powered features',
    href: '/agentic',
    icon: SparklesIcon,
    requiredRoles: ['teacher', 'admin'],
  }
];