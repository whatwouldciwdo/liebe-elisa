'use client';

import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { sound } from '@/lib/audio';

interface LetterSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLetter: string;
}

export const DAILY_LETTERS_LIST = [
  '123', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
  'L', 'M', 'N', 'O', 'PQR', 'S', 'T', 'U', 'V', 'W', 'XYZ',
];

export default function LetterSelectorModal({
  isOpen,
  onClose,
  currentLetter,
}: LetterSelectorModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0c0715] border-2 border-[#FF7FEC] shadow-[0_0_40px_rgba(255,127,236,0.3)] rounded-lg p-5 text-white font-mono overflow-hidden">
        {/* CRT Scanline */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-40 rounded-lg" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#FF7FEC]/30">
          <div className="flex items-center gap-2 text-[#FF7FEC]">
            <Sparkles className="w-4 h-4 animate-spin" />
            <h3 className="text-sm font-bold uppercase tracking-widest">
              CHOOSE A DAILY PLAYLIST
            </h3>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 text-[#FF7FEC] hover:text-white hover:rotate-90 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 23 Letters Grid */}
        <div className="my-5">
          <p className="text-[11px] text-gray-400 mb-3 uppercase tracking-wider">
            Select an alphabet playlist:
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {DAILY_LETTERS_LIST.map((char) => {
              const isSelected = currentLetter.toUpperCase() === char.toUpperCase();
              return (
                <button
                  key={char}
                  onClick={() => {
                    sound.playClick();
                    onClose();
                    router.push(`/daily/${char.toLowerCase()}`);
                  }}
                  className={`h-11 px-2 text-xs font-bold rounded flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FF7FEC] text-black shadow-[0_0_15px_#FF7FEC] scale-105'
                      : 'bg-black/60 text-[#FF7FEC] hover:bg-[#FF7FEC]/20 border border-[#FF7FEC]/40'
                  }`}
                >
                  {char}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-gray-400 uppercase tracking-widest border-t border-[#FF7FEC]/20 pt-3">
          23 Playlists to discover Australian music from A to Z
        </div>
      </div>
    </div>
  );
}
