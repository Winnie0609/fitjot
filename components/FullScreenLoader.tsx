'use client';

import { Loader } from 'lucide-react';

export function FullScreenLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader className="w-8 h-8 animate-spin" />
    </div>
  );
}
