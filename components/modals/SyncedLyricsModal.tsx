'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { parseLRC, getActiveLyricIndex, formatLrcTimestamp } from '@/lib/lyrics';
import { sound } from '@/lib/audio';
import { X, Play, Pause, RotateCcw, RotateCw, Music2, Sparkles } from 'lucide-react';

interface SyncedLyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackTitle: string;
  artistName: string;
  artworkUrl?: string;
  lyricsText?: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  onTogglePlay: () => void;
}

export default function SyncedLyricsModal({
  isOpen,
  onClose,
  trackTitle,
  artistName,
  artworkUrl,
  lyricsText,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  onTogglePlay,
}: SyncedLyricsModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Parse LRC lyrics
  const { isSynced, lines } = useMemo(() => {
    return parseLRC(lyricsText || '');
  }, [lyricsText]);

  // Current active line index
  const activeIndex = useMemo(() => {
    if (!isSynced) return -1;
    return getActiveLyricIndex(lines, currentTime);
  }, [isSynced, lines, currentTime]);

  // Auto-scroll to center active lyric line
  useEffect(() => {
    if (!isOpen || activeIndex < 0 || !activeLineRef.current || !containerRef.current) return;

    activeLineRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [activeIndex, isOpen]);

  if (!isOpen) return null;

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/85 backdrop-blur-md font-mono select-none">
      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none crt-lines opacity-30 z-10" />

      <div className="relative w-full max-w-2xl bg-black border-2 border-[#FF7FEC] shadow-[0_0_35px_rgba(255,127,236,0.35)] flex flex-col h-[92vh] max-h-[750px] z-20 overflow-hidden">
        {/* ========================================================== */}
        {/* HEADER: Track Title, Artist, and Close */}
        {/* ========================================================== */}
        <div className="p-4 md:p-5 border-b border-[#FF7FEC] bg-black/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            {artworkUrl ? (
              <div className="w-12 h-12 border border-[#FF7FEC] shrink-0 overflow-hidden bg-neutral-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={artworkUrl} alt={trackTitle} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 border border-[#FF7FEC] shrink-0 flex items-center justify-center text-[#00f5d4]">
                <Music2 className="w-6 h-6" />
              </div>
            )}
            <div className="truncate">
              <div className="text-sm md:text-base font-bold text-[#FF7FEC] tracking-wider truncate flex items-center gap-2">
                <span>{trackTitle || 'Unknown Title'}</span>
                {isSynced && (
                  <span className="text-[10px] px-1.5 py-0.5 border border-[#00f5d4] text-[#00f5d4] font-normal tracking-normal flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> SYNCED LRC
                  </span>
                )}
              </div>
              <div className="text-xs text-[#00f5d4] tracking-wide truncate mt-0.5">
                {artistName || 'Unknown Artist'}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-3 py-1.5 border border-[#FF7FEC] text-xs font-bold text-[#FF7FEC] hover:bg-[#FF7FEC] hover:text-black transition-colors"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* ========================================================== */}
        {/* LYRICS SCROLL AREA */}
        {/* ========================================================== */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto px-4 py-8 space-y-4 md:space-y-6 text-center scrollbar-none"
        >
          {lines.length === 0 ? (
            <div className="py-24 text-gray-500 text-xs tracking-widest uppercase">
              (( NO LYRICS AVAILABLE FOR THIS TRACK ))
            </div>
          ) : (
            lines.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPast = activeIndex !== -1 && idx < activeIndex;

              return (
                <div
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => {
                    if (isSynced && line.time >= 0) {
                      sound.playClick();
                      onSeek(line.time);
                    }
                  }}
                  className={`transition-all duration-300 cursor-pointer py-1.5 px-3 rounded ${
                    isActive
                      ? 'text-[#00f5d4] scale-105 md:scale-110 font-bold text-base md:text-xl drop-shadow-[0_0_12px_rgba(0,245,212,0.85)]'
                      : isPast
                      ? 'text-[#FF7FEC]/40 text-xs md:text-sm hover:text-[#FF7FEC]/80'
                      : 'text-white/40 text-xs md:text-sm hover:text-white/80'
                  }`}
                >
                  <p className="leading-relaxed">{line.text || '♪ ♪ ♪'}</p>
                </div>
              );
            })
          )}
        </div>

        {/* ========================================================== */}
        {/* FOOTER: Playback Scrubber & Mini Controls */}
        {/* ========================================================== */}
        <div className="p-4 border-t border-[#FF7FEC] bg-black shrink-0 space-y-3">
          {/* Scrubber Bar */}
          <div className="space-y-1">
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                if (duration > 0) {
                  sound.playClick();
                  onSeek(ratio * duration);
                }
              }}
              className="w-full h-2.5 bg-neutral-900 border border-[#FF7FEC]/50 cursor-pointer relative"
            >
              <div
                className="h-full bg-[#00f5d4] transition-all duration-100"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>{formatSeconds(currentTime)}</span>
              <span>{formatSeconds(duration)}</span>
            </div>
          </div>

          {/* Mini Play / Pause Buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => {
                sound.playClick();
                onSeek(Math.max(0, currentTime - 5));
              }}
              className="p-1.5 border border-[#FF7FEC]/60 text-[#FF7FEC] hover:bg-[#FF7FEC] hover:text-black transition-colors"
              title="Rewind 5s"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onTogglePlay();
              }}
              className="px-4 py-1.5 border border-[#00f5d4] bg-[#00f5d4] text-black font-bold text-xs hover:bg-black hover:text-[#00f5d4] transition-colors flex items-center gap-1.5"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onSeek(Math.min(duration, currentTime + 5));
              }}
              className="p-1.5 border border-[#FF7FEC]/60 text-[#FF7FEC] hover:bg-[#FF7FEC] hover:text-black transition-colors"
              title="Forward 5s"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
