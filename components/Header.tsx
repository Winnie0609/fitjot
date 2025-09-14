'use client';

import { signOut } from 'firebase/auth';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/firebase';

import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';

interface HeaderProps {
  handleAddNew: () => void;
}

const getInitials = (name?: string | null) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');
};

function Header({ handleAddNew }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
      toast.success('You have successfully logged out!');
    } catch (error) {
      console.error('Error signing out: ', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4 w-full">
        <h1 className="text-2xl font-bold">Workout Log</h1>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" /> Add New Session
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer">
              <Avatar>
                {/* <AvatarImage src={user?.photoURL || ''} /> */}
                <AvatarFallback>
                  {getInitials(user?.displayName)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="mt-2">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <div className="text-sm text-gray-500">
                    {user?.displayName}
                  </div>
                  <div className="text-xs text-gray-400">{user?.email}</div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleLogout}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}

export default Header;
