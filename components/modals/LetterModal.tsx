'use client';

import React, { useState } from 'react';
import { X, Play, Music, Sparkles } from 'lucide-react';
import { sound } from '@/lib/audio';

import dailyPlaylistsData from '@/public/data/dailyPlaylists.json';

interface LetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLetter?: string;
}

export const PLAYLIST_KEYS = [
  '123',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'PQR',
  'S',
  'T',
  'U',
  'V',
  'W',
  'XYZ',
];

const ARTIST_MAP: Record<string, { artist: string; track: string; genre: string }> = {
  '123': { artist: '1927 / e4444e', track: "That's When I Think Of You", genre: 'Aussie Heritage / Indie' },
  PQR: { artist: 'Pond / Queen P', track: 'Paint Me Silver', genre: 'Psychedelic Rock / Hip Hop' },
  XYZ: { artist: 'Xavier Rudd / Yothu Yindi', track: 'Treaty (Revisited)', genre: 'Roots / Indigenous' },
  A: { artist: 'Amyl and the Sniffers', track: 'U Should Not Be Doing That', genre: 'Punk Rock' },
  B: { artist: 'Ben Lee', track: 'Catch My Disease (Ausify Mix)', genre: 'Indie Pop' },
  C: { artist: 'Camp Cope', track: 'The Opener', genre: 'Alt Rock' },
  D: { artist: 'Darcie Haven', track: 'I Wanna Be Like You', genre: 'Indie Pop' },
  E: { artist: 'Emma Donovan', track: 'Hold On', genre: 'Soul / Indigenous' },
  F: { artist: 'Flume', track: 'Never Be Like You', genre: 'Electronic' },
  G: { artist: 'Genesis Owusu', track: "Don't Need You", genre: 'Neo-Soul / Rap' },
  H: { artist: 'Hatchie', track: 'Quicksand', genre: 'Dream Pop' },
  I: { artist: 'In Hearts Wake', track: 'Worldwide Suicide', genre: 'Metalcore' },
  J: { artist: 'Jamaica Moana', track: 'CYA', genre: 'Hip Hop / Club' },
  K: { artist: 'Keli Holiday', track: 'Where You Been', genre: 'Disco Rock' },
  L: { artist: 'Lime Cordiale', track: 'Robbery', genre: 'Surf Rock' },
  M: { artist: 'Mindy Meng Wang', track: 'Underwater Melodies', genre: 'Avant-Garde' },
  N: { artist: 'Ninajirachi', track: 'Slytherin', genre: 'Hyperpop / Dance' },
  O: { artist: 'Ocean Alley', track: 'Confidence', genre: 'Psychedelic Reggae' },
  P: { artist: 'Pond', track: 'Paint Me Silver', genre: 'Psychedelic' },
  Q: { artist: 'Queen P', track: 'Crown Me', genre: 'Aussie Hip Hop' },
  R: { artist: 'Rachael Fahim', track: 'Middle Ground', genre: 'Country Pop' },
  S: { artist: 'Shannon Noll', track: 'What About Me (Revisited)', genre: 'Aussie Rock' },
  T: { artist: 'Thelma Plum', track: 'Better in Blak', genre: 'Indie Folk' },
  U: { artist: 'Unknown Mortal Orchestra', track: 'Multi-Love', genre: 'Lo-Fi Psyche' },
  V: { artist: 'Vance Joy', track: 'Riptide', genre: 'Folk' },
  W: { artist: 'Wafia', track: 'Heartburn', genre: 'Electro R&B' },
  X: { artist: 'Xavier Rudd', track: 'Follow the Sun', genre: 'Roots' },
  Y: { artist: 'Yothu Yindi', track: 'Treaty', genre: 'Indigenous Rock' },
  Z: { artist: 'Ziggy Alberts', track: 'Laps Around The Sun', genre: 'Acoustic Folk' },
};

export default function LetterModal({ isOpen, onClose, initialLetter = '123' }: LetterModalProps) {
  const [selectedLetter, setSelectedLetter] = useState(initialLetter);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialLetter) {
      setSelectedLetter(initialLetter);
    }
  }, [initialLetter]);

  if (!isOpen) return null;

  const currentPlaylist = (dailyPlaylistsData as any)[selectedLetter];
  const tracks: any[] = currentPlaylist?.tracks || [];

  const currentArtist = ARTIST_MAP[selectedLetter] || {
    artist: tracks[0]?.artist?.name || 'Australian Indie Artist',
    track: tracks[0]?.name || 'Homegrown Sound',
    genre: 'Aus Music',
  };

  const handleSelect = (char: string) => {
    sound.playClick();
    setSelectedLetter(char);
    const code = char.charCodeAt(0) - 65;
    const baseFreq = 220 + (code >= 0 ? code * 25 : 150);
    sound.playChime([baseFreq, baseFreq * 1.25, baseFreq * 1.5]);
    setIsPlaying(false);
    setPlayingTrackId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0d0714] border-2 border-[#00f5d4] shadow-[0_0_30px_rgba(0,245,212,0.3)] rounded-lg p-6 text-white font-mono">
        {/* CRT Scanline overlay inside modal */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-60 rounded-lg" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#00f5d4]/40">
          <div className="flex items-center gap-2 text-[#00f5d4]">
            <Sparkles className="w-5 h-5 animate-spin" />
            <h2 className="text-xl font-bold tracking-widest uppercase">Select by Alphabet Letter</h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 hover:text-[#ff2a8d] hover:rotate-90 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Alphabet Grid (23 Playlists) */}
        <div className="my-5">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">
            Choose a playlist to discover Aussie artists:
          </p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {PLAYLIST_KEYS.map((char) => {
              const isSelected = selectedLetter === char;
              return (
                <button
                  key={char}
                  onClick={() => handleSelect(char)}
                  className={`h-9 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm font-bold rounded flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[#FF7FEC] text-black shadow-[0_0_15px_#FF7FEC] scale-105'
                      : 'bg-[#1b1029] text-[#00f5d4] hover:bg-[#2d1a45] hover:border-[#ff4bb6] border border-[#3b235c]'
                  }`}
                >
                  {char}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Playlist Header Card */}
        <div className="p-4 rounded-lg bg-[#140a21] border border-[#ff4bb6]/40 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded bg-gradient-to-br from-[#ff2a8d] to-[#00f5d4] flex items-center justify-center text-black font-black text-xl shadow-[0_0_15px_rgba(255,42,141,0.5)] shrink-0">
              {selectedLetter}
            </div>
            <div>
              <div className="text-xs text-[#ff4bb6] uppercase tracking-wider">
                {tracks.length > 0 ? `${tracks.length} Official Tracks` : currentArtist.genre}
              </div>
              <h3 className="text-lg font-bold text-white tracking-wide">{currentArtist.artist}</h3>
              <p className="text-sm text-gray-400 italic">"{currentArtist.track}"</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playChime([440, 554, 659, 880]);
              setIsPlaying(!isPlaying);
              setPlayingTrackId(null);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded bg-[#ff2a8d] hover:bg-[#ff4bb6] text-black font-bold uppercase text-sm tracking-wider shadow-[0_0_15px_#ff2a8d] transition-all hover:scale-105 shrink-0"
          >
            {isPlaying && !playingTrackId ? (
              <>
                <Music className="w-4 h-4 animate-bounce" /> Playing
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Listen All
              </>
            )}
          </button>
        </div>

        {/* Tracks List */}
        {tracks.length > 0 && (
          <div className="max-h-56 overflow-y-auto pr-1 space-y-1.5 border-t border-[#3b235c] pt-3">
            {tracks.map((t: any, idx: number) => {
              const isCurrentTrack = playingTrackId === t.id;
              const mins = Math.floor((t.duration || 0) / 60);
              const secs = ((t.duration || 0) % 60).toString().padStart(2, '0');

              return (
                <div
                  key={t.id || idx}
                  onClick={() => {
                    sound.playClick();
                    setPlayingTrackId(t.id);
                    sound.playChime([330 + (idx % 8) * 35, 440 + (idx % 8) * 45]);
                  }}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all text-xs ${
                    isCurrentTrack
                      ? 'bg-[#FF7FEC]/20 border border-[#FF7FEC] text-[#FF7FEC]'
                      : 'bg-[#140a21]/60 hover:bg-[#201035] border border-transparent text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-gray-500 w-5 text-right font-mono text-[10px]">{idx + 1}.</span>
                    <div className="truncate">
                      <div className="font-bold truncate text-white">{t.name}</div>
                      <div className="text-[11px] text-gray-400 truncate">
                        {t.artist?.name || 'Aussie Artist'} {t.album ? `• ${t.album}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-gray-400 font-mono text-[11px]">
                    {t.duration > 0 && <span>{mins}:{secs}</span>}
                    {isCurrentTrack ? (
                      <Music className="w-3.5 h-3.5 text-[#FF7FEC] animate-bounce" />
                    ) : (
                      <Play className="w-3.5 h-3.5 hover:text-[#00f5d4]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-4 text-center text-xs text-gray-400">
          Press any letter to defy the algorithmic echo chamber.
        </div>
      </div>
    </div>
  );
}
