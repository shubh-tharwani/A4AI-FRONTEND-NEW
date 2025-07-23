import { ReactNode } from 'react';
import MainLayout from './MainLayout';
import { useAuthStore } from '../../store/authStore';

interface NavigationProps {
  children: ReactNode;
}

export default function Navigation({ children }: NavigationProps) {
  const { user } = useAuthStore();

  // Transform user data to match MainLayout expectations
  const layoutUser = user ? {
    name: user.display_name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    role: user.role || 'student',
    avatar: undefined, // Add avatar support if needed
  } : undefined;

  return (
    <MainLayout user={layoutUser}>
      {children}
    </MainLayout>
  );
}
