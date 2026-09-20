'use client';

import React from 'react';
import { X, ExternalLink, Heart, Sparkles, Disc } from 'lucide-react';
import { TrackData, STREAMING_SERVICES } from '@/lib/playlistPlayerRenderer';
import { sound } from '@/lib/audio';

interface SupportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: TrackData | null;
  isLiked?: boolean;
  onToggleLike?: () => void;
}

export default function SupportCardModal({
  isOpen,
  onClose,
  track,
  isLiked = false,
  onToggleLike,
}: SupportCardModalProps) {
  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0e0717] border-2 border-[#FF7FEC] shadow-[0_0_50px_rgba(255,127,236,0.35)] rounded-lg p-6 text-white font-mono overflow-hidden">
        {/* CRT Scanline */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-40 rounded-lg" />

        {/* Close Button */}
        <div className="flex items-center justify-between pb-3 border-b border-[#FF7FEC]/30">
          <div className="flex items-center gap-2 text-[#00f5d4]">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span className="text-xs uppercase tracking-widest font-bold">SUPPORT LOCAL ARTISTS</span>
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

        {/* Artwork & Album Details */}
        <div className="my-5 flex flex-col items-center text-center">
          <div className="relative group mb-4">
            {track.artworkUrl ? (
              <img
                src={track.artworkUrl}
                alt={track.name}
                className="w-44 h-44 rounded-md object-cover border-2 border-[#FF7FEC] shadow-[0_0_25px_rgba(255,127,236,0.4)]"
              />
            ) : (
              <div className="w-44 h-44 rounded-md bg-[#1d102e] border-2 border-[#FF7FEC] flex items-center justify-center">
                <Disc className="w-16 h-16 text-[#FF7FEC] animate-spin" />
              </div>
            )}
            <div className="absolute inset-0 rounded-md bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
          </div>

          <h3 className="text-xl font-bold text-white tracking-wide mb-1 font-serif italic">
            {track.name}
          </h3>
          <p className="text-sm text-[#00f5d4] font-bold tracking-wider mb-1">
            {track.artist?.name}
          </p>
          {track.album && (
            <p className="text-xs text-gray-400">
              Album: {track.album} {track.year ? `(${track.year})` : ''}
            </p>
          )}
        </div>

        {/* Streaming & Support Links */}
        <div className="space-y-2 mb-5">
          <p className="text-[11px] text-gray-400 uppercase tracking-widest text-center mb-2">
            Stream or support on official platforms:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {STREAMING_SERVICES.map((svc) => {
              const query = encodeURIComponent(`${track.name} ${track.artist?.name}`);
              return (
                <a
                  key={svc.id}
                  href={`${svc.url}${query}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sound.playClick()}
                  className="flex items-center gap-2 p-2 rounded bg-black/60 hover:bg-[#FF7FEC] text-[#FF7FEC] hover:text-black border border-[#FF7FEC]/40 hover:border-[#FF7FEC] text-xs font-bold transition-all"
                >
                  <img src={svc.icon} alt={svc.name} className="w-4 h-4 invert" />
                  <span className="truncate">{svc.name}</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Like Button */}
        {onToggleLike && (
          <button
            onClick={() => {
              onToggleLike();
              sound.playChime();
            }}
            className={`w-full py-2.5 rounded font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isLiked
                ? 'bg-[#FF7FEC] text-black shadow-[0_0_15px_#FF7FEC]'
                : 'bg-black/60 text-[#FF7FEC] hover:bg-[#FF7FEC]/20 border border-[#FF7FEC]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-black text-black' : 'text-[#FF7FEC]'}`} />
            {isLiked ? 'SAVED TO YOUR FAVORITES' : 'ADD TO FAVORITES'}
          </button>
        )}
      </div>
    </div>
  );
}
