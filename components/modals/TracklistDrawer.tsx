'use client';

import React, { useState } from 'react';
import { X, Play, Music, Search, Heart } from 'lucide-react';
import { TrackData } from '@/lib/playlistPlayerRenderer';
import { sound } from '@/lib/audio';

interface TracklistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  playlistName: string;
  tracks: TrackData[];
  currentTrackIndex: number;
  onSelectTrack: (index: number) => void;
  likedTracks: Set<string>;
}

export default function TracklistDrawer({
  isOpen,
  onClose,
  playlistName,
  tracks,
  currentTrackIndex,
  onSelectTrack,
  likedTracks,
}: TracklistDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredTracks = tracks
    .map((track, originalIndex) => ({ track, originalIndex }))
    .filter(({ track }) => {
      const q = searchQuery.toLowerCase();
      return (
        track.name.toLowerCase().includes(q) ||
        (track.artist?.name && track.artist.name.toLowerCase().includes(q)) ||
        (track.album && track.album.toLowerCase().includes(q))
      );
    });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col bg-[#0c0812] border-t-2 sm:border-2 border-[#FF7FEC] shadow-[0_0_40px_rgba(255,127,236,0.3)] sm:rounded-lg text-white font-mono overflow-hidden">
        {/* CRT Scanline effect */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-40" />

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#FF7FEC]/30 bg-black/50 shrink-0">
          <div>
            <div className="text-[10px] text-[#00f5d4] uppercase tracking-widest">
              OFFICIAL AUSIFY ARCHIVE
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-wider text-[#FF7FEC]">
              PLAYLIST ‘{playlistName}’ ({tracks.length} TRACKS)
            </h2>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 text-[#FF7FEC] hover:text-white hover:rotate-90 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-3 border-b border-[#FF7FEC]/20 bg-[#120a1b]/60 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-[#FF7FEC]/60 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracks, artists, albums..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-black/70 border border-[#FF7FEC]/40 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#00f5d4] focus:ring-1 focus:ring-[#00f5d4] transition-all font-mono"
            />
          </div>
        </div>

        {/* Tracks List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 divide-y divide-[#FF7FEC]/10">
          {filteredTracks.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-xs uppercase tracking-wider">
              No tracks found matching "{searchQuery}"
            </div>
          ) : (
            filteredTracks.map(({ track, originalIndex }) => {
              const isCurrent = originalIndex === currentTrackIndex;
              const isLiked = likedTracks.has(track.id);
              const mins = Math.floor((track.duration || 0) / 60);
              const secs = ((track.duration || 0) % 60).toString().padStart(2, '0');

              return (
                <div
                  key={track.id || originalIndex}
                  onClick={() => {
                    sound.playClick();
                    onSelectTrack(originalIndex);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-2.5 rounded cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-[#FF7FEC]/20 border border-[#FF7FEC] text-[#FF7FEC]'
                      : 'hover:bg-[#1a0e28] border border-transparent text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate min-w-0 pr-2">
                    {/* Track Number */}
                    <span className="text-[11px] font-mono text-gray-500 w-6 text-right shrink-0">
                      {originalIndex + 1}.
                    </span>

                    {/* Artwork Thumbnail */}
                    {track.artworkUrl ? (
                      <img
                        src={track.artworkUrl}
                        alt={track.name}
                        className="w-10 h-10 rounded object-cover border border-[#FF7FEC]/30 shrink-0 bg-black"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-[#1c1326] border border-[#FF7FEC]/30 flex items-center justify-center shrink-0">
                        <Music className="w-4 h-4 text-[#FF7FEC]" />
                      </div>
                    )}

                    {/* Titles */}
                    <div className="truncate min-w-0">
                      <div className="font-bold text-sm truncate text-white">
                        {track.name}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {track.artist?.name || 'Aussie Artist'}
                        {track.album ? ` • ${track.album}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Duration */}
                  <div className="flex items-center gap-3 shrink-0 text-xs font-mono">
                    {isLiked && (
                      <Heart className="w-3.5 h-3.5 fill-[#FF7FEC] text-[#FF7FEC]" />
                    )}
                    <span className="text-gray-400 text-[11px] hidden sm:inline">
                      {mins}:{secs}
                    </span>
                    {isCurrent ? (
                      <div className="flex items-center gap-1 text-[#00f5d4] text-[11px] font-bold">
                        <Music className="w-3.5 h-3.5 animate-bounce" />
                        <span className="hidden sm:inline">PLAYING</span>
                      </div>
                    ) : (
                      <button className="p-1 text-[#FF7FEC] hover:text-white transition-colors">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#FF7FEC]/20 bg-black/60 text-center text-[10px] text-gray-400 uppercase tracking-widest shrink-0">
          Showing {filteredTracks.length} of {tracks.length} Tracks • Click any track to play
        </div>
      </div>
    </div>
  );
}
