import {
  HomeIcon,
  BookOpenIcon,
  MicrophoneIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export const navigationItems = [
  {
    name: 'Dashboard',
    description: 'Overview and analytics',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Courses',
    description: 'Browse learning material',
    href: '/courses',
    icon: BookOpenIcon,
    requiredRoles: ['student', 'teacher', 'admin'],
  },
  {
    name: 'Voice Practice',
    description: 'Practice pronunciation',
    href: '/voice',
    icon: MicrophoneIcon,
    requiredRoles: ['student'],
  },
  {
    name: 'Chat Practice',
    description: 'Practice conversations',
    href: '/chat',
    icon: ChatBubbleLeftRightIcon,
    requiredRoles: ['student'],
  },
  {
    name: 'Assignments',
    description: 'View and submit work',
    href: '/assignments',
    icon: DocumentTextIcon,
    requiredRoles: ['student', 'teacher'],
  },
  {
    name: 'Students',
    description: 'Manage students',
    href: '/students',
    icon: UserGroupIcon,
    requiredRoles: ['teacher', 'admin'],
  },
  {
    name: 'Analytics',
    description: 'Performance insights',
    href: '/analytics',
    icon: ChartBarIcon,
    requiredRoles: ['teacher', 'admin'],
  },
];