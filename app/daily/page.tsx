'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// Load DailyCanvas client-side only (WebGL requires window and document)
const DailyCanvas = dynamic(() => import('@/components/canvas/DailyCanvas'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-[#FF7FEC] font-mono select-none">
      <div className="relative text-xl md:text-2xl font-bold tracking-widest animate-pulse">
        (( LOADING DAILY ))
      </div>
      <div className="mt-3 text-xs text-[#00f5d4] tracking-wider">
        INITIALIZING A-Z CRT ENGINE...
      </div>
    </div>
  ),
});

export default function DailyPage() {
  const router = useRouter();

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      <DailyCanvas onSelectPlaylist={(letter) => router.push(`/daily/${letter.toLowerCase()}`)} />
    </main>
  );
}
