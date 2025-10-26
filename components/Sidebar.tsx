'use client';

import {
  BarChart3,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelRightClose,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppData } from '@/lib/AppDataContext';
import { useAuth } from '@/lib/AuthContext';
import { addInBodyData, addWorkoutSession } from '@/lib/db';
import { auth } from '@/lib/firebase';
import {
  getSampleInBodyDataFor,
  getSampleWorkoutSessionsFor,
} from '@/lib/sample-data';
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
  const [isSeeding, setIsSeeding] = useState(false);
  const { userProfile, workoutSessions, inBodyRecords, refresh, loading } =
    useAppData();

  const shouldShowSeed =
    !loading &&
    !userProfile?.isOnboard &&
    workoutSessions.length === 0 &&
    inBodyRecords.length === 0;

  const handleSeedData = async () => {
    if (!user) return;
    setIsSeeding(true);
    const id = toast.loading('Generating sample data...');
    try {
      const workouts = getSampleWorkoutSessionsFor(user.uid);
      const inbodies = getSampleInBodyDataFor(user.uid);

      for (const w of workouts) {
        await addWorkoutSession({ uid: user.uid, sessionData: w });
      }

      for (const r of inbodies) {
        await addInBodyData({ uid: user.uid, inBodyData: r });
      }

      toast.success('Sample data generated successfully!');
      await refresh();
    } catch (error) {
      console.error('Failed to seed data:', error);
      toast.error('Failed to generate sample data.');
    } finally {
      setIsSeeding(false);
      toast.dismiss(id);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success('You have successfully logged out!');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('There was an error logging out. Please try again.');
    }
  };

  const handleSettings = () => {
    toast.info('Settings page is coming soon!');
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
          'flex h-[100svh] flex-col border-r bg-background transition-all duration-300',
          // Desktop: always visible, width changes based on collapsed state
          'hidden md:flex md:relative',
          isCollapsed ? 'md:w-16' : 'md:w-64',
          // Mobile: only visible when menu is open, always full width (w-64)
          isMobileMenuOpen && 'fixed inset-y-0 left-0 z-50 w-64 flex md:hidden',
          className
        )}
      >
        {/* Header */}
        <div
          className="flex h-12 items-center px-4 mt-2"
          onClick={() => router.push('/')}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isCollapsed && !isMobileMenuOpen && (
              <div className="w-6 relative flex-shrink-0 ml-1">
                <Image
                  src="/images/logo-single.png"
                  alt="FitJot Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {(!isCollapsed || isMobileMenuOpen) && (
              <div className="w-24 h-10 relative flex-shrink-0">
                <Image
                  src="/images/logo_black.png"
                  alt="FitJot Logo"
                  width={96}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          <div className="flex justify-center items-center flex-shrink-0">
            <div
              className="cursor-pointer"
              onClick={() => setIsCollapsed(!isCollapsed)}
              hidden={isCollapsed || isMobileMenuOpen}
            >
              <PanelLeftClose className="h-4 w-4" />
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden flex-shrink-0"
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
                    'w-full justify-start mb-1 p-2',
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
          {/* Seed Data Section */}
          {shouldShowSeed && (
            <div
              className={cn(
                'mt-10',
                isCollapsed && !isMobileMenuOpen && 'px-2'
              )}
            >
              <Button
                variant="ghost"
                onClick={handleSeedData}
                disabled={isSeeding}
                className={cn(
                  'w-full justify-start mb-1 p-2 text-black hover:bg-transparent relative',
                  isCollapsed &&
                    !isMobileMenuOpen &&
                    'md:justify-center md:px-2 h-8 w-8'
                )}
                style={{
                  borderRadius: '20px',
                  background:
                    'linear-gradient(white, white) padding-box, linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899) border-box',
                  border: '2px solid transparent',
                }}
              >
                <Sparkles className="h-4 w-4 text-black" />
                {(!isCollapsed || isMobileMenuOpen) && (
                  <span className="ml-1 text-black">
                    Start with sample data
                  </span>
                )}
              </Button>
            </div>
          )}
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

            <DropdownMenuContent
              align="end"
              side={isCollapsed ? 'left' : 'top'}
              className="w-56"
            >
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
