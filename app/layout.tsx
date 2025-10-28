import './globals.css';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { Toaster } from '@/components/ui/sonner';

import { Providers } from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FitJot',
  description: 'Track your fitness journey',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to Firebase domains for faster connection */}
        <link rel="dns-prefetch" href="https://www.googleapis.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link
          rel="preconnect"
          href="https://workout-log-5615d.firebaseapp.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://firestore.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://apis.google.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://www.googleapis.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-[100svh] overflow-x-hidden`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
