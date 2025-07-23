import { Fragment, useState } from 'react';
import { Dialog, Menu, Transition } from '@headlessui/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  PuzzlePieceIcon,
  CalendarDaysIcon,
  MicrophoneIcon,
  PhotoIcon,
  CubeIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { cn, getInitials } from '../../lib/utils';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description?: string;
  requiredRoles?: ('student' | 'teacher' | 'admin')[];
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    description: 'Overview and progress',
  },
  {
    name: 'Assessment',
    href: '/assessment',
    icon: ClipboardDocumentListIcon,
    description: 'Quizzes and tests',
  },
  {
    name: 'Activities',
    href: '/activities',
    icon: PuzzlePieceIcon,
    description: 'Interactive learning',
  },
  {
    name: 'Planning',
    href: '/planning',
    icon: CalendarDaysIcon,
    description: 'Lesson plans',
    requiredRoles: ['teacher', 'admin'],
  },
  {
    name: 'Voice Assistant',
    href: '/voice',
    icon: MicrophoneIcon,
    description: 'AI voice chat',
  },
  {
    name: 'Visual Aids',
    href: '/visual-aids',
    icon: PhotoIcon,
    description: 'Educational visuals',
  },
  {
    name: 'AR Experience',
    href: '/ar',
    icon: CubeIcon,
    description: 'Augmented reality',
  },
];

interface NavigationProps {
  children: React.ReactNode;
}

export default function Navigation({ children }: NavigationProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const filteredNavigation = navigation.filter(item => 
    !item.requiredRoles || item.requiredRoles.includes(user?.role || 'student')
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/95 backdrop-blur-xl border-r border-neutral-200/50 px-6 pb-2 shadow-xl">
                  <div className="flex h-16 shrink-0 items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
                      <AcademicCapIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="ml-3 text-xl font-display font-bold bg-gradient-to-r from-primary-700 to-accent-700 bg-clip-text text-transparent">A4AI</span>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {filteredNavigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                  location.pathname === item.href
                                    ? 'bg-gradient-to-r from-primary-50 to-accent-50 text-primary-700 shadow-soft border border-primary-200/50'
                                    : 'text-neutral-700 hover:text-primary-700 hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-accent-50/50',
                                  'group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-medium transition-all duration-200'
                                )}
                              >
                                <item.icon
                                  className={cn(
                                    location.pathname === item.href
                                      ? 'text-primary-700'
                                      : 'text-neutral-400 group-hover:text-primary-700',
                                    'h-5 w-5 shrink-0 transition-colors duration-200'
                                  )}
                                  aria-hidden="true"
                                />
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  {item.description && (
                                    <div className="text-xs text-neutral-500 mt-0.5">{item.description}</div>
                                  )}
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-neutral-200/50 bg-white/95 backdrop-blur-xl px-6 shadow-strong">
          <div className="flex h-16 shrink-0 items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-white/20">
              <AcademicCapIcon className="w-6 h-6 text-white" />
            </div>
            <span className="ml-3 text-2xl font-display font-bold bg-gradient-to-r from-primary-700 to-accent-700 bg-clip-text text-transparent">A4AI</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-2">
                  {filteredNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={cn(
                          location.pathname === item.href
                            ? 'bg-gradient-to-r from-primary-50 to-accent-50 text-primary-700 shadow-soft border border-primary-200/50 scale-[1.02]'
                            : 'text-neutral-700 hover:text-primary-700 hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-accent-50/50 hover:scale-[1.01]',
                          'group flex gap-x-4 rounded-xl p-4 text-sm leading-6 font-medium transition-all duration-200 hover:shadow-soft'
                        )}
                      >
                        <item.icon
                          className={cn(
                            location.pathname === item.href
                              ? 'text-primary-700'
                              : 'text-neutral-400 group-hover:text-primary-700',
                            'h-6 w-6 shrink-0 transition-colors duration-200'
                          )}
                          aria-hidden="true"
                        />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-neutral-500 mt-0.5">{item.description}</div>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="-mx-6 mt-auto">
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center gap-x-4 px-6 py-4 text-sm font-medium leading-6 text-neutral-900 hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-accent-50/30 w-full transition-all duration-200">
                    <div className="w-10 h-10 bg-gradient-to-r from-accent-500 to-secondary-500 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-medium ring-2 ring-white/20">
                      {user?.display_name ? getInitials(user.display_name) : 'U'}
                    </div>
                    <span className="sr-only">Open user menu</span>
                    <div className="text-left">
                      <div className="font-medium text-neutral-900">{user?.display_name || 'User'}</div>
                      <div className="text-xs text-neutral-500 capitalize flex items-center gap-1">
                        <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                        {user?.role}
                      </div>
                    </div>
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute bottom-full left-0 z-10 mb-2 w-64 origin-bottom-left rounded-xl bg-white/90 backdrop-blur-md py-3 shadow-strong ring-1 ring-primary-100/30 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={cn(
                              'flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200',
                              active 
                                ? 'bg-gradient-to-r from-error-50 to-warning-50 text-error-700' 
                                : 'text-neutral-700 hover:bg-gradient-to-r hover:from-error-50/30 hover:to-warning-50/30'
                            )}
                          >
                            <ArrowRightOnRectangleIcon className="h-4 w-4 text-error-600" />
                            Sign out
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white/80 backdrop-blur-md px-4 py-4 shadow-soft border-b border-primary-100/30 sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-neutral-700 hover:text-primary-700 hover:bg-primary-50/50 rounded-lg transition-all duration-200 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-neutral-900">
          <span className="bg-gradient-to-r from-primary-700 to-accent-700 bg-clip-text text-transparent">
            A4AI Learning Platform
          </span>
        </div>
        <Menu as="div" className="relative">
          <Menu.Button className="-m-1.5 flex items-center p-1.5 hover:bg-primary-50/50 rounded-lg transition-all duration-200">
            <span className="sr-only">Open user menu</span>
            <div className="w-8 h-8 bg-gradient-to-r from-accent-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-medium ring-2 ring-white/20">
              {user?.display_name ? getInitials(user.display_name) : 'U'}
            </div>
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-xl bg-white/90 backdrop-blur-md py-3 shadow-strong ring-1 ring-primary-100/30 focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleLogout}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200',
                      active 
                        ? 'bg-gradient-to-r from-error-50 to-warning-50 text-error-700' 
                        : 'text-neutral-700 hover:bg-gradient-to-r hover:from-error-50/30 hover:to-warning-50/30'
                    )}
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 text-error-600" />
                    Sign out
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <main className="bg-gradient-to-br from-neutral-50 to-primary-50/30 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
