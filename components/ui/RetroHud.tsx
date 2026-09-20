'use client';

import React from 'react';
import { Video, Volume2, VolumeX } from 'lucide-react';
import { sound } from '@/lib/audio';

interface RetroHudProps {
  onOpenAbout: () => void;
  onOpenVideo: () => void;
  onOpenWho: () => void;
  onOpenPrivacy: () => void;
  onOpenStatus: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function RetroHud({
  onOpenAbout,
  onOpenVideo,
  onOpenWho,
  onOpenPrivacy,
  onOpenStatus,
  isMuted,
  onToggleMute,
}: RetroHudProps) {
  return (
    <div className="pointer-events-none fixed inset-0 flex flex-col justify-between p-4 md:p-6 z-20 font-mono select-none">
      {/* 1. TOP NEON PINK BAR */}
      <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#ff2a8d] via-[#ff77cc] to-[#ff2a8d] shadow-[0_0_15px_#ff2a8d]" />

      {/* 2. TOP HEADER NAVIGATION */}
      <header className="flex items-center justify-between w-full pt-2">
        {/* Logo: #AUSIFY with 90s glitch chromatic effect */}
        <div
          onClick={() => {
            sound.playGlitch();
          }}
          className="pointer-events-auto cursor-pointer group flex items-center gap-2"
        >
          <div className="relative font-black text-2xl md:text-3xl tracking-tighter uppercase text-[#ff4bb6] drop-shadow-[0_0_10px_#ff2a8d]">
            <span className="relative z-10">#AUSIFY</span>
            {/* Cyan glitch shadow layer */}
            <span className="absolute -top-[1px] -left-[2px] text-[#00f5d4] opacity-80 blur-[0.5px] group-hover:-translate-x-1 group-hover:translate-y-0.5 transition-transform">
              #AUSIFY
            </span>
          </div>
        </div>

        {/* Right Nav: WHAT IS AUSIFY? & Sound Toggle */}
        <div className="pointer-events-auto flex items-center gap-4">
          <button
            onClick={() => {
              sound.playClick();
              onToggleMute();
            }}
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
            className="p-2 rounded bg-black/40 border border-gray-800 hover:border-[#00f5d4] text-gray-400 hover:text-[#00f5d4] transition-all"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#00f5d4]" />}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenAbout();
            }}
            className="text-xs md:text-sm font-bold uppercase tracking-widest text-[#ffbe0b] hover:text-[#ff2a8d] drop-shadow-[0_0_8px_rgba(255,190,11,0.6)] transition-colors"
          >
            WHAT IS AUSIFY?
          </button>
        </div>
      </header>

      {/* 3. BOTTOM FOOTER CONTROLS */}
      <footer className="flex flex-col items-center gap-4 w-full pb-2">
        {/* VHS Button: WATCH AUSIFY VIDEO */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenVideo();
          }}
          className="pointer-events-auto flex items-center gap-2 px-5 py-2 rounded border border-[#00f5d4] bg-black/60 hover:bg-[#00f5d4]/15 text-[#00f5d4] hover:text-white font-bold text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(0,245,212,0.3)] hover:shadow-[0_0_25px_#00f5d4] transition-all hover:scale-105"
        >
          <Video className="w-4 h-4 text-[#ff2a8d]" />
          <span>WATCH AUSIFY VIDEO</span>
        </button>

        {/* Bottom Links */}
        <div className="pointer-events-auto flex items-center gap-4 md:gap-8 text-[11px] text-gray-500 uppercase tracking-widest">
          <button
            onClick={() => {
              sound.playClick();
              onOpenWho();
            }}
            className="hover:text-white hover:underline underline-offset-4 transition-colors"
          >
            WHO MADE THIS?
          </button>
          <span>●</span>
          <button
            onClick={() => {
              sound.playClick();
              onOpenPrivacy();
            }}
            className="hover:text-white hover:underline underline-offset-4 transition-colors"
          >
            PRIVACY
          </button>
          <span>●</span>
          <button
            onClick={() => {
              sound.playClick();
              onOpenStatus();
            }}
            className="hover:text-[#00f5d4] hover:underline underline-offset-4 transition-colors"
          >
            STATUS
          </button>
        </div>
      </footer>
    </div>
  );
}
