'use client';

import React from 'react';
import { X, Sparkles, Disc, Radio, Heart } from 'lucide-react';
import { sound } from '@/lib/audio';

interface HowToDefyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowToDefyModal({ isOpen, onClose }: HowToDefyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0e0717] border-2 border-[#FF7FEC] shadow-[0_0_50px_rgba(255,127,236,0.35)] rounded-lg p-6 text-white font-mono overflow-hidden">
        {/* CRT Scanline */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-40 rounded-lg" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#FF7FEC]/30">
          <div className="flex items-center gap-2 text-[#00f5d4]">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span className="text-xs uppercase tracking-widest font-bold">HOW TO DEFY</span>
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

        {/* Steps */}
        <div className="my-6 space-y-4">
          <div className="p-3.5 rounded bg-black/60 border border-[#FF7FEC]/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-[#FF7FEC]/20 text-[#FF7FEC] flex items-center justify-center font-bold shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#FF7FEC] mb-1">SEARCH AUSSIE ARTISTS</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Break out of global algorithms by exploring local independent music across Australia from A to Z.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded bg-black/60 border border-[#FF7FEC]/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-[#FF7FEC]/20 text-[#FF7FEC] flex items-center justify-center font-bold shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#FF7FEC] mb-1">LISTEN & STREAM DIRECTLY</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Spin any CD disc or use the streaming links (Spotify, Apple Music, Bandcamp) to add homegrown tracks to your daily rotation.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded bg-black/60 border border-[#FF7FEC]/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-[#FF7FEC]/20 text-[#FF7FEC] flex items-center justify-center font-bold shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#FF7FEC] mb-1">DEFY YOUR FEED</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Every stream and search retrains the recommendation engines to celebrate diverse Australian musical culture.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="w-full py-2.5 rounded bg-[#FF7FEC] text-black font-bold uppercase text-xs tracking-widest shadow-[0_0_15px_#FF7FEC] hover:bg-white transition-all cursor-pointer"
        >
          START DEFYING
        </button>
      </div>
    </div>
  );
}
