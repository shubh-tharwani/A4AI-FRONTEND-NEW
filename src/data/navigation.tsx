import {
  HomeIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export interface NavigationItem {
  name: string;
  description: string;
  href: string;
  icon: any; // Using 'any' for HeroIcon components
  requiredRoles?: ('student' | 'teacher' | 'admin')[];
}

//Added new file

export const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    description: 'Overview and analytics',
    href: '/dashboard',
    icon: HomeIcon,
    requiredRoles: ['student', 'teacher', 'admin'],
  },
  {
    name: 'Courses',
    description: 'Your learning materials',
    href: '/courses',
    icon: BookOpenIcon,
    requiredRoles: ['student', 'teacher'],
  },
  {
    name: 'Chat Assistant',
    description: 'AI-powered help',
    href: '/chat',
    icon: ChatBubbleLeftRightIcon,
    requiredRoles: ['student', 'teacher'],
  },
  {
    name: 'Assignments',
    description: 'Tasks and homework',
    href: '/assignments',
    icon: ClipboardDocumentListIcon,
    requiredRoles: ['student', 'teacher'],
  },
  {
    name: 'Users',
    description: 'Manage users',
    href: '/users',
    icon: UserGroupIcon,
    requiredRoles: ['admin'],
  },
];