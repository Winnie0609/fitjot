'use client';

import Image from 'next/image';

export function FullScreenLoader() {
  return (
    <div className="flex items-center justify-center h-[100svh]">
      <div className="flex flex-col items-center justify-center w-40 md:w-60 h-auto">
        <Image
          src="/images/logo_black.png"
          alt="FitJot Logo"
          width={300}
          height={300}
          priority
        />
      </div>
    </div>
  );
}
