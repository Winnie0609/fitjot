'use client';

import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export function FullScreenLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center justify-center">
        <div className="text-2xl font-bold">Loading your gains...</div>
        <DotLottieReact
          src="https://lottie.host/c95405a5-6ace-4b29-aa6e-171138228704/HKy79TFTMo.lottie"
          loop
          autoplay
          className="md:w-130 w-100"
        />
      </div>
    </div>
  );
}
