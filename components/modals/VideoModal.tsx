'use client';

import React from 'react';
import { X, Film } from 'lucide-react';
import { sound } from '@/lib/audio';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoModal({ isOpen, onClose }: VideoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
      <div className="relative w-full max-w-4xl bg-[#08040d] border-2 border-[#ff2a8d] shadow-[0_0_40px_rgba(255,42,141,0.4)] rounded-lg overflow-hidden font-mono text-white">
        {/* VHS Scanline Overlay */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-40" />

        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#130721] border-b border-[#ff2a8d]/40">
          <div className="flex items-center gap-2 text-[#ff4bb6]">
            <Film className="w-5 h-5" />
            <span className="text-sm font-bold tracking-widest uppercase">
              AUSIFY VHS // CAMPAIGN FILM (2025)
            </span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 hover:text-[#00f5d4] hover:rotate-90 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 16:9 Video Player Embed */}
        <div className="relative w-full aspect-video bg-black">
          <iframe
            className="w-full h-full"
            src="https://www.youtube-nocookie.com/embed/WpzuiQYAKCQ?autoplay=1&rel=0&modestbranding=1"
            title="Ausify Your Algo Film"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#0d0517] flex items-center justify-between text-xs text-gray-400">
          <div>REC ● SP [01:24:08]</div>
          <div className="text-[#00f5d4]">STEREO HI-FI SOUNDTRACK</div>
        </div>
      </div>
    </div>
  );
}
