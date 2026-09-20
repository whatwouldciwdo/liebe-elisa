'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import dynamic from 'next/dynamic';
import { notFound, useRouter } from 'next/navigation';
import dailyPlaylistsData from '@/public/data/dailyPlaylists.json';
import { PlaylistData, TrackData, DAILY_LETTER_MAP } from '@/lib/playlistPlayerRenderer';
import HowToDefyModal from '@/components/modals/HowToDefyModal';
import MyLikesDrawer from '@/components/modals/MyLikesDrawer';
import LetterSelectorModal from '@/components/modals/LetterSelectorModal';
import InfoModal from '@/components/modals/InfoModal';

// Load PlaylistPlayerCanvas client-side only (WebGL requires window/document)
const PlaylistPlayerCanvas = dynamic(
  () => import('@/components/canvas/PlaylistPlayerCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-[#FF7FEC] font-mono select-none">
        <div className="text-xl md:text-2xl font-bold tracking-widest animate-pulse">
          (( LOADING PLAYLIST ))
        </div>
        <div className="mt-3 text-xs text-[#00f5d4] tracking-wider">
          INITIALIZING CD DISCS & CRT SHADER...
        </div>
      </div>
    ),
  }
);

interface DailyPlaylistPageProps {
  params: Promise<{ letter: string }>;
}

export default function DailyPlaylistPage({ params }: DailyPlaylistPageProps) {
  const router = useRouter();
  const { letter } = use(params);
  const normalizedKey = decodeURIComponent(letter).toUpperCase();

  // Find playlist matching key
  const allPlaylists = dailyPlaylistsData as Record<string, any>;
  
  // Resolve key and aliases (e.g. '031', '31', '23' -> '123')
  let targetKey = normalizedKey;
  if (targetKey === '031' || targetKey === '31' || targetKey === '23') {
    targetKey = '123';
  } else if (!allPlaylists[targetKey]) {
    const num = parseInt(targetKey, 10);
    if (!isNaN(num)) {
      const match = Object.entries(DAILY_LETTER_MAP).find(([, day]) => day === num);
      if (match) {
        targetKey = match[0];
      }
    }
  }

  const rawPlaylist = allPlaylists[targetKey] || allPlaylists['123'] || allPlaylists['T'];

  if (!rawPlaylist) {
    notFound();
  }

  const playlist: PlaylistData = {
    id: rawPlaylist.id || `ausify25az-${targetKey.toLowerCase()}`,
    name: rawPlaylist.name || targetKey,
    type: rawPlaylist.type || 'AZ',
    tracks: rawPlaylist.tracks || [],
  };

  // Build global tracks map across all playlists so tracks from any letter are preserved
  const allGlobalTracksMap = useMemo(() => {
    const map = new Map<string, TrackData>();
    Object.values(allPlaylists).forEach((p: any) => {
      if (Array.isArray(p?.tracks)) {
        p.tracks.forEach((t: TrackData) => {
          if (t && t.id && !map.has(String(t.id))) {
            map.set(String(t.id), t);
          }
        });
      }
    });
    return map;
  }, [allPlaylists]);

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isHowToDefyOpen, setIsHowToDefyOpen] = useState(false);
  const [isMyLikesOpen, setIsMyLikesOpen] = useState(false);
  const [isLetterDropdownOpen, setIsLetterDropdownOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Ordered list of liked track IDs (newest liked added below previous ones)
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>([]);

  // Load liked tracks from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ausify_liked_tracks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setLikedTrackIds(parsed.map(String));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleToggleLike = (trackId: string | number) => {
    const idStr = String(trackId);
    setLikedTrackIds((prev) => {
      let next: string[];
      if (prev.includes(idStr)) {
        next = prev.filter((id) => id !== idStr);
      } else {
        // Appends sequentially BELOW previous ones
        next = [...prev, idStr];
      }
      try {
        localStorage.setItem('ausify_liked_tracks', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const likedTracksSet = useMemo(() => new Set(likedTrackIds), [likedTrackIds]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 
        3D CD DISC PLAYER & CRT SHADER CANVAS
        Features:
        - 1:1 replica of official Ausify player (ausify.com.au/daily/t)
        - Horizontal circular CD discs carousel with official artwork from Firebase
        - Spinning center disc with concentric rings & spindle hole
        - Top Neon Pink Bar, #AUSIFY logo sprite, WHAT IS AUSIFY?
        - Track Title, Artist Name & 6 Streaming platform icons above discs
        - [ ♥ ] [ ▶ ] [ ►► ] control boxes
        - Bottom bar: [ 🎫 HOW TO DEFY ], [ DAILY 19 - T ▼ ], [ MY LIKES ] tilted sticker card
      */}
      <PlaylistPlayerCanvas
        playlist={playlist}
        initialTrackIndex={currentTrackIndex}
        likedTracks={likedTracksSet}
        onToggleLike={handleToggleLike}
        onOpenHowToDefy={() => setIsHowToDefyOpen(true)}
        onOpenLetterDropdown={() => router.push('/daily')}
        onOpenMyLikes={() => setIsMyLikesOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onTrackChange={(idx) => setCurrentTrackIndex(idx)}
      />

      {/* How To Defy Modal */}
      <HowToDefyModal
        isOpen={isHowToDefyOpen}
        onClose={() => setIsHowToDefyOpen(false)}
      />

      {/* My Likes Card & Modal */}
      <MyLikesDrawer
        isOpen={isMyLikesOpen}
        onOpen={() => setIsMyLikesOpen(true)}
        onClose={() => setIsMyLikesOpen(false)}
        likedTrackIds={likedTrackIds}
        likedTracksSet={likedTracksSet}
        allTracks={playlist.tracks}
        globalTracksMap={allGlobalTracksMap}
        currentTrackIndex={currentTrackIndex}
        onSelectTrack={(idx) => setCurrentTrackIndex(idx)}
        onToggleLike={handleToggleLike}
      />

      {/* Letter Dropdown / Quick Switcher */}
      <LetterSelectorModal
        isOpen={isLetterDropdownOpen}
        onClose={() => setIsLetterDropdownOpen(false)}
        currentLetter={playlist.name}
      />

      {/* About Modal */}
      <InfoModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        type="about"
      />

      {/* CRT Scanline Overlay across entire page */}
      <div className="pointer-events-none fixed inset-0 z-[60] crt-lines opacity-30" />
    </main>
  );
}
