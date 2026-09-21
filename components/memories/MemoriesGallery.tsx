'use client';

import dynamic from 'next/dynamic';

const MemoriesCanvas = dynamic(() => import('@/components/canvas/MemoriesCanvas'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 grid place-items-center bg-black text-[#FF7FEC]">(( LOADING MEMORIES ))</div>,
});

export default function MemoriesGallery() {
  return <main className="fixed inset-0 h-[100dvh] overflow-hidden bg-black"><MemoriesCanvas /></main>;
}