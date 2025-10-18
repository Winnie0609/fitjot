'use client';

import {
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { addUserToDb } from '@/lib/db';
import { auth } from '@/lib/firebase';

import { Button } from './ui/button';

export function GoogleLoginButton({ isLogin }: { isLogin: boolean }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const user = result.user;

      if (!credential) {
        throw new Error('Failed to get credential from result');
      }

      await updateProfile(user, {
        displayName: `${user.displayName}`,
      });

      try {
        await addUserToDb({
          uid: user.uid,
          userData: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            isOnboard: false,
          },
        });
      } catch (error) {
        console.error(error);
      }

      router.push('/');
      toast.success('You have successfully logged in with Google!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path
            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
            fill="currentColor"
          />
        </svg>
        {isLogin ? 'Login' : 'Sign up'} with Google{' '}
        {isLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
      </Button>

      <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t ">
        <span className="bg-card text-muted-foreground relative z-10 px-2">
          Or continue with
        </span>
      </div>
    </div>
  );
}
