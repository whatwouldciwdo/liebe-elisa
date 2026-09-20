'use client';

import React, { useState } from 'react';
import { X, Sparkles, Volume2, Heart } from 'lucide-react';
import { sound } from '@/lib/audio';

interface VibeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VIBES = [
  {
    id: 'sun-coastal',
    title: 'SUN-DRENCHED SURF',
    desc: 'Breezy guitars, warm coastal indie rock, and salt in the air.',
    color: '#ff2a8d',
    artists: ['Ocean Alley', 'Lime Cordiale', 'Spacey Jane'],
  },
  {
    id: 'midnight-drive',
    title: 'MIDNIGHT HIGHWAY',
    desc: 'Lush synthesizers, neon reflections, and late-night solitude.',
    color: '#00f5d4',
    artists: ['Flume', 'Ninajirachi', 'Flight Facilities'],
  },
  {
    id: 'inner-city',
    title: 'INNER-CITY GRUNGE',
    desc: 'Raw distortion, sweaty basement pub rock, and unapologetic attitude.',
    color: '#ffbe0b',
    artists: ['Amyl & the Sniffers', 'King Gizzard', 'The Chats'],
  },
  {
    id: 'dream-folk',
    title: 'ETHEREAL DREAMSCAPE',
    desc: 'Poetic storytelling, acoustic warmth, and heartfelt reflections.',
    color: '#b5179e',
    artists: ['Thelma Plum', 'Vance Joy', 'Emma Donovan'],
  },
];

export default function VibeModal({ isOpen, onClose }: VibeModalProps) {
  const [activeVibe, setActiveVibe] = useState(VIBES[0].id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0e071a] border-2 border-[#ff77cc] shadow-[0_0_35px_rgba(255,119,204,0.35)] rounded-lg p-6 text-white font-mono">
        {/* CRT Scanline */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-60 rounded-lg" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ff77cc]/40">
          <div className="flex items-center gap-2 text-[#ff77cc]">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <h2 className="text-xl font-bold tracking-widest uppercase">Tune by Mood / Vibe</h2>
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

        {/* Vibe Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          {VIBES.map((vibe) => {
            const isSelected = activeVibe === vibe.id;
            return (
              <div
                key={vibe.id}
                onClick={() => {
                  sound.playClick();
                  sound.playChime([329.63, 440.0, 523.25, 659.25]);
                  setActiveVibe(vibe.id);
                }}
                className={`p-4 rounded-lg cursor-pointer border transition-all duration-300 ${
                  isSelected
                    ? 'bg-[#220d33] border-[#ff2a8d] shadow-[0_0_20px_rgba(255,42,141,0.4)] scale-[1.02]'
                    : 'bg-[#12081f] border-[#3a1d59] hover:border-[#00f5d4]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${vibe.color}22`, color: vibe.color }}
                  >
                    {vibe.title}
                  </span>
                  {isSelected && <Heart className="w-4 h-4 fill-[#ff2a8d] text-[#ff2a8d] animate-pulse" />}
                </div>
                <p className="text-xs text-gray-300 mb-3">{vibe.desc}</p>
                <div className="text-[11px] text-[#00f5d4]">
                  Key Artists: {vibe.artists.join(', ')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Vibe Control */}
        <div className="p-4 rounded bg-[#180c2b] border border-[#00f5d4]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-[#00f5d4] animate-bounce" />
            <div>
              <div className="text-xs text-gray-400 uppercase">Current Vibe Frequency:</div>
              <div className="text-sm font-bold text-white uppercase tracking-wider">
                {VIBES.find((v) => v.id === activeVibe)?.title}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playChime([523.25, 659.25, 783.99, 1046.5]);
              alert('Now streaming selected vibe playlist via Ausify!');
            }}
            className="px-4 py-2 rounded bg-[#00f5d4] hover:bg-[#20ffe3] text-black font-bold text-xs uppercase tracking-widest shadow-[0_0_15px_#00f5d4] transition-all"
          >
            Stream Vibe
          </button>
        </div>
      </div>
    </div>
  );
}
