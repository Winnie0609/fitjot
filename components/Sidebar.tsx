'use client';

import {
  Activity,
  BarChart3,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelRightClose,
  Settings,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/firebase';
import { useSidebar } from '@/lib/SidebarContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Workout Sessions',
    href: '/workout',
    icon: Dumbbell,
  },
  {
    title: 'InBody Records',
    href: '/inbody',
    icon: BarChart3,
  },
];

export function Sidebar({ className }: SidebarProps) {
  const { isCollapsed, setIsCollapsed, isMobileMenuOpen, setIsMobileMenuOpen } =
    useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleSettings = () => {
    toast.info('Settings page coming soon');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div
        className={cn(
          // Base styles
          'flex h-screen flex-col border-r bg-background transition-all duration-300',
          // Desktop: always visible, width changes based on collapsed state
          'hidden md:flex md:relative',
          isCollapsed ? 'md:w-16' : 'md:w-64',
          // Mobile: only visible when menu is open, always full width (w-64)
          isMobileMenuOpen && 'fixed inset-y-0 left-0 z-50 w-64 flex md:hidden',
          className
        )}
      >
        {/* Header */}
        <div className="flex h-12 items-center justify-between px-4 mt-8">
          <div className="flex items-center gap-2 p-2">
            <Activity className="h-5 w-5 text-primary" />
            {(!isCollapsed || isMobileMenuOpen) && (
              <span className="font-semibold text-lg">Workout Log</span>
            )}
          </div>

          <div className="flex justify-center items-center">
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start',
                (isCollapsed || isMobileMenuOpen) && 'hidden'
              )}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isCollapsed && (
          <div className="flex justify-center items-center p-2">
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start',
                isCollapsed &&
                  !isMobileMenuOpen &&
                  'md:justify-center md:px-2 h-8 w-8'
              )}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav
          className={cn(
            'flex-1 flex flex-col space-y-1 px-4 py-2',
            isCollapsed && 'px-2 py-0'
          )}
        >
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                className="flex justify-center items-center"
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)} // Close mobile menu on navigation
              >
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start mb-2 p-2',
                    isCollapsed &&
                      !isMobileMenuOpen &&
                      'md:justify-center md:px-2 h-8 w-8'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {(!isCollapsed || isMobileMenuOpen) && (
                    <span className="ml-2">{item.title}</span>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start cursor-pointer flex items-center px-4 py-6 ',
                  isCollapsed &&
                    !isMobileMenuOpen &&
                    'md:justify-center md:px-2'
                )}
              >
                <div className="text-sm font-medium bg-primary text-primary-foreground rounded-sm px-2.5 py-1.5 text-center">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                {(!isCollapsed || isMobileMenuOpen) && (
                  <div className="ml-2 flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {user?.displayName || 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <DropdownMenuItem onClick={handleSettings}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}
