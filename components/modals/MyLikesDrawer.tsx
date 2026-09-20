'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TrackData } from '@/lib/playlistPlayerRenderer';
import { sound } from '@/lib/audio';

interface MyLikesDrawerProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  likedTrackIds: string[];
  likedTracksSet?: Set<string>;
  allTracks: TrackData[];
  globalTracksMap?: Map<string, TrackData>;
  currentTrackIndex: number;
  onSelectTrack: (index: number) => void;
  onToggleLike: (trackId: string) => void;
}

const LIKE_PATTERN_UNIT = 'LIKE   LIKE   LIKE   LIKE   LIKE   LIKE   LIKE   LIKE   LIKE   LIKE   ';

export default function MyLikesDrawer({
  isOpen,
  onOpen,
  onClose,
  likedTrackIds,
  allTracks,
  globalTracksMap,
  currentTrackIndex,
  onSelectTrack,
  onToggleLike,
}: MyLikesDrawerProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<'likes' | 'support'>('likes');
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);
  const [isShareHovered, setIsShareHovered] = useState(false);
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Order in which tracks were liked (adds sequentially below previous ones)
  const favoriteTracks = useMemo(() => {
    return likedTrackIds
      .map((trackId) => {
        const idStr = String(trackId);
        const originalIndex = allTracks.findIndex((t) => String(t.id) === idStr);
        if (originalIndex !== -1) {
          return {
            track: allTracks[originalIndex],
            originalIndex,
            isInCurrentPlaylist: true,
          };
        }
        if (globalTracksMap) {
          const globalTrack = globalTracksMap.get(idStr);
          if (globalTrack) {
            return {
              track: globalTrack,
              originalIndex: -1,
              isInCurrentPlaylist: false,
            };
          }
        }
        return null;
      })
      .filter((item): item is { track: TrackData; originalIndex: number; isInCurrentPlaylist: boolean } => item !== null);
  }, [likedTrackIds, allTracks, globalTracksMap]);

  // Auto-sync selectedTrackId when opening or when tracks change
  useEffect(() => {
    if (isOpen) {
      const currentTrack = allTracks[currentTrackIndex];
      const isCurrentInFavorites = currentTrack && favoriteTracks.some((f) => String(f.track.id) === String(currentTrack.id));

      if (isCurrentInFavorites) {
        setSelectedTrackId(String(currentTrack.id));
      } else if (favoriteTracks.length > 0) {
        if (!selectedTrackId || !favoriteTracks.some((f) => String(f.track.id) === String(selectedTrackId))) {
          setSelectedTrackId(String(favoriteTracks[0].track.id));
        }
      } else if (currentTrack) {
        setSelectedTrackId(String(currentTrack.id));
      }
    }
  }, [isOpen, currentTrackIndex, favoriteTracks]);

  // Active track dynamically displayed in the green SHOW YOUR SUPPORT card
  const activeTrack = useMemo(() => {
    if (selectedTrackId) {
      const found = favoriteTracks.find((f) => String(f.track.id) === String(selectedTrackId));
      if (found) return found.track;
      if (globalTracksMap?.has(selectedTrackId)) return globalTracksMap.get(selectedTrackId)!;
    }
    return allTracks[currentTrackIndex] || favoriteTracks[0]?.track || allTracks[0];
  }, [selectedTrackId, favoriteTracks, allTracks, currentTrackIndex, globalTracksMap]);

  const handleTrackClick = (item: { track: TrackData; originalIndex: number; isInCurrentPlaylist: boolean }) => {
    sound.playClick();
    setSelectedTrackId(String(item.track.id));
    if (item.isInCurrentPlaylist && item.originalIndex >= 0) {
      onSelectTrack(item.originalIndex);
    }
  };

  const handleUnlike = (trackId: string) => {
    sound.playClick();
    onToggleLike(trackId);
    if (selectedTrackId === trackId) {
      const remaining = favoriteTracks.filter((f) => String(f.track.id) !== trackId);
      if (remaining.length > 0) {
        setSelectedTrackId(String(remaining[0].track.id));
        if (remaining[0].isInCurrentPlaylist && remaining[0].originalIndex >= 0) {
          onSelectTrack(remaining[0].originalIndex);
        }
      } else {
        setSelectedTrackId(null);
      }
    }
  };

  const handleShareTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        showToast('TRACK LINK COPIED TO CLIPBOARD 📋');
      }
    }
  };

  const handleShareList = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        showToast('PLAYLIST LINK COPIED 📋');
      }
    }
  };

  const handleSaveList = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    if (favoriteTracks.length === 0) {
      showToast('NO TRACKS LIKED YET!');
      return;
    }
    const listText = favoriteTracks
      .map(({ track }, i) => `${i + 1}. ${track.artist?.name} - ${track.name}`)
      .join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(listText);
      showToast('SAVED TRACKS COPIED TO CLIPBOARD 💾');
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[80] px-4 py-2 bg-black border-2 border-[#FF7FEC] text-[#FF7FEC] font-mono text-xs font-bold tracking-widest shadow-[0_0_25px_#FF7FEC] animate-in fade-in zoom-in-95">
          {toastMessage}
        </div>
      )}

      {/* Backdrop Dimmer when Open */}
      <div
        onClick={() => {
          sound.playClick();
          onClose();
        }}
        className={`fixed inset-0 z-40 bg-black/75 backdrop-blur-[2px] transition-opacity duration-500 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Mobile Tab Switcher when Open */}
      {isOpen && isMobile && (
        <div className="fixed top-[4.5rem] left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/90 p-1 rounded border border-white/40 shadow-lg animate-in fade-in">
          <button
            onClick={() => {
              sound.playClick();
              setMobileTab('likes');
            }}
            className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
              mobileTab === 'likes' ? 'bg-[#FF7FEC] text-black' : 'text-white hover:bg-white/10'
            }`}
          >
            MY LIKES ({favoriteTracks.length})
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setMobileTab('support');
            }}
            className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
              mobileTab === 'support' ? 'bg-[#2ee68b] text-black' : 'text-white hover:bg-white/10'
            }`}
          >
            SUPPORT ARTIST
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. PINK "MY LIKES" TICKET CARD                                 */}
      {/* Smoothly travels between bottom-right and center screen       */}
      {/* ============================================================== */}
      <div
        onClick={() => {
          if (!isOpen) {
            sound.playClick();
            onOpen();
          }
        }}
        style={{
          position: 'fixed',
          right: isOpen
            ? isMobile
              ? 'calc(50% - 150px)'
              : 'calc(50% + 12px)'
            : isMobile
            ? '12px'
            : '24px',
          bottom: isOpen
            ? isMobile
              ? 'calc(50% - 230px)'
              : 'calc(50% - 245px)'
            : isMobile
            ? '-600px'
            : '-220px',
          width: isOpen
            ? isMobile
              ? '300px'
              : '320px'
            : isMobile
            ? '215px'
            : '250px',
          height: isOpen
            ? isMobile
              ? '460px'
              : '490px'
            : isMobile
            ? '340px'
            : '380px',
          transform: isOpen
            ? 'rotate(-2deg)'
            : 'rotate(-3.2deg)',
          zIndex: isOpen ? 50 : 45,
          opacity: isMobile && !isOpen ? 0 : 1,
          pointerEvents: isMobile && !isOpen ? 'none' : 'auto',
          transition: 'all 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: isOpen ? 'default' : 'pointer',
        }}
        className={`border-[1.5px] border-white flex flex-col overflow-hidden bg-black select-none shadow-[0_0_35px_rgba(255,127,236,0.35),0_20px_50px_rgba(0,0,0,0.9)] group ${
          isOpen && isMobile && mobileTab !== 'likes' ? 'hidden' : ''
        }`}
        title={isOpen ? undefined : 'Click to open My Likes'}
      >
        {/* Header */}
        <div className="relative h-[52px] sm:h-[64px] bg-black border-b-[1.5px] border-white flex items-center justify-center overflow-hidden shrink-0">
          <div className="absolute inset-0 select-none pointer-events-none opacity-90 p-1 flex flex-col justify-around overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden whitespace-nowrap leading-[9px] sm:leading-[10px]">
                <div className="animate-like-marquee text-[#521749] font-mono text-[7px] sm:text-[8px] tracking-widest select-none">
                  <span>{LIKE_PATTERN_UNIT}</span>
                  <span>{LIKE_PATTERN_UNIT}</span>
                </div>
              </div>
            ))}
          </div>
          <h2 className="relative z-10 font-['Instrument_Serif',Georgia,serif] text-xl sm:text-2xl md:text-3xl text-[#FF7FEC] font-bold tracking-wider group-hover:scale-105 transition-transform">
            MY LIKES
          </h2>
          {isOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                onClose();
              }}
              className="absolute top-2 right-2.5 z-20 text-[#FF7FEC] hover:text-white p-1 cursor-pointer transition-colors text-xs font-mono font-bold"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>

        {/* Pink Body with Real-Time Tracks List (media_1789668197605.png, media_1789668354510.png) */}
        <div className="flex-1 bg-[#FF7FEC] overflow-y-auto flex flex-col p-1">
          {favoriteTracks.length === 0 ? (
            <div className="pt-4 px-3 text-center">
              <p className="font-['Merchant_Copy',monospace] text-xs font-bold text-black tracking-wide">
                You haven't liked any tracks yet!
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {favoriteTracks.map((item) => {
                const { track } = item;
                const isSelected = selectedTrackId
                  ? String(track.id) === String(selectedTrackId)
                  : String(activeTrack?.id) === String(track.id);
                const isHovered = hoveredTrackId === String(track.id);
                const isHighlighted = isHovered || isSelected;

                return (
                  <div
                    key={track.id}
                    onMouseEnter={() => {
                      setHoveredTrackId(String(track.id));
                      sound.playHover();
                    }}
                    onMouseLeave={() => setHoveredTrackId(null)}
                    onClick={(e) => {
                      if (isOpen) {
                        e.stopPropagation();
                        handleTrackClick(item);
                      }
                    }}
                    className={`px-3 py-2 flex items-start gap-2.5 transition-all duration-150 cursor-pointer ${
                      isHighlighted
                        ? 'bg-black border-[1.5px] border-white text-[#FF7FEC] shadow-[0_0_10px_rgba(255,127,236,0.3)]'
                        : 'bg-transparent border-[1.5px] border-transparent border-b-black/35 text-black hover:border-white'
                    }`}
                  >
                    {/* Retro 8-bit Pixel Heart */}
                    <svg
                      className={`w-3.5 h-3.5 shrink-0 mt-0.5 transition-colors ${
                        isHighlighted ? 'fill-[#FF7FEC]' : 'fill-black'
                      }`}
                      viewBox="0 0 16 16"
                    >
                      <path d="M4 2h3v1h1v1h1V3h1V2h3v2h1v3h-1v2h-1v2h-1v2h-1v1H8v-1H7v-2H6v-2H5V7H4V4h1V2H4z" />
                    </svg>

                    {/* Track Info (Top line: Artist - Title, Bottom line: Artist) */}
                    <div className="truncate font-['Merchant_Copy',monospace] flex-1 leading-tight">
                      <div
                        className={`text-[11px] sm:text-xs font-bold truncate transition-colors ${
                          isHighlighted ? 'text-[#FF7FEC]' : 'text-black'
                        }`}
                      >
                        {track.artist?.name} - {track.name}
                      </div>
                      <div
                        className={`text-[10px] truncate mt-0.5 transition-colors ${
                          isHighlighted ? 'text-[#FF7FEC]/90' : 'text-black/80'
                        }`}
                      >
                        {track.artist?.name}
                      </div>
                    </div>

                    {/* Unlike Button when open */}
                    {isOpen && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlike(String(track.id));
                        }}
                        className={`text-xs p-0.5 ml-1 cursor-pointer transition-colors ${
                          isHighlighted
                            ? 'text-[#FF7FEC]/70 hover:text-white'
                            : 'text-black/50 hover:text-red-700'
                        }`}
                        title="Remove from likes"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />
        </div>

        {/* Footer */}
        <div className="h-[42px] sm:h-[44px] bg-black border-t-[1.5px] border-white flex items-center justify-center px-3 shrink-0">
          <div className="flex items-center justify-center gap-2 text-[#FF7FEC]">
            <span className="text-xs sm:text-sm select-none">✳</span>
            <span className="font-['Merchant_Copy',monospace] text-xs sm:text-sm font-bold tracking-wider">
              Search. Listen. Defy.
            </span>
            <span className="text-xs sm:text-sm select-none">✳</span>
          </div>
        </div>
      </div>

      {/* Buttons Underneath Pink Card when Open: [ SHARE LIST ]  [ SAVE LIST ] */}
      <div
        style={{
          position: 'fixed',
          right: isMobile ? 'calc(50% - 150px)' : 'calc(50% + 12px)',
          bottom: isMobile ? 'calc(50% - 280px)' : 'calc(50% - 295px)',
          width: isMobile ? '300px' : '320px',
          zIndex: 50,
          opacity: isOpen && (!isMobile || mobileTab === 'likes') ? 1 : 0,
          pointerEvents: isOpen && (!isMobile || mobileTab === 'likes') ? 'auto' : 'none',
          transition: 'opacity 0.4s ease 0.15s',
        }}
        className="flex items-center justify-center gap-3 select-none"
      >
        <button
          onClick={handleShareList}
          className="px-4 py-1.5 bg-black border-[1.5px] border-[#FF7FEC] hover:border-white text-[#FF7FEC] hover:text-white font-['Merchant_Copy',monospace] text-xs font-bold tracking-widest cursor-pointer transition-all active:scale-95 shadow-[0_0_12px_rgba(255,127,236,0.3)]"
        >
          SHARE LIST
        </button>
        <button
          onClick={handleSaveList}
          className="px-4 py-1.5 bg-black border-[1.5px] border-[#FF7FEC] hover:border-white text-[#FF7FEC] hover:text-white font-['Merchant_Copy',monospace] text-xs font-bold tracking-widest cursor-pointer transition-all active:scale-95 shadow-[0_0_12px_rgba(255,127,236,0.3)]"
        >
          SAVE LIST
        </button>
      </div>

      {/* ============================================================== */}
      {/* 2. GREEN "SHOW YOUR SUPPORT" TICKET CARD                       */}
      {/* Slides smoothly beside the pink card when open                 */}
      {/* ============================================================== */}
      <div
        style={{
          position: 'fixed',
          left: isOpen
            ? isMobile
              ? 'calc(50% - 150px)'
              : 'calc(50% + 12px)'
            : 'calc(100vw + 50px)',
          bottom: isOpen
            ? isMobile
              ? 'calc(50% - 230px)'
              : 'calc(50% - 245px)'
            : '-220px',
          width: isMobile ? '300px' : '320px',
          height: isMobile ? '460px' : '490px',
          transform: isOpen
            ? 'rotate(2deg)'
            : 'rotate(6deg) scale(0.9)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen && (!isMobile || mobileTab === 'support') ? 'auto' : 'none',
          zIndex: 50,
          transition: 'all 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`border-[1.5px] border-white shadow-[0_0_40px_rgba(46,230,139,0.35),0_20px_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden bg-[#2ee68b] select-none ${
          isOpen && isMobile && mobileTab !== 'support' ? 'hidden' : ''
        }`}
      >
        {/* Top Black Bar */}
        <div className="h-7 bg-black flex items-center justify-center px-3 text-[#2ee68b] border-b border-black shrink-0 relative">
          <span className="font-['Merchant_Copy',monospace] text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">
            ✳ SHOW YOUR SUPPORT ✳
          </span>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="absolute top-1.5 right-2 text-[#2ee68b] hover:text-white p-0.5 cursor-pointer text-xs font-mono font-bold"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Artist Name & Star Flourish */}
        <div className="py-4 px-3 flex flex-col items-center justify-center text-black shrink-0">
          <h3 className="font-['Instrument_Serif',Georgia,serif] text-3xl sm:text-4xl text-center leading-tight tracking-wide font-normal truncate max-w-full">
            {activeTrack?.artist?.name || 'Artist'}
          </h3>
          <div className="flex items-center justify-center gap-2 mt-2 text-black w-32">
            <div className="h-[1px] flex-1 bg-black" />
            <span className="text-xs leading-none select-none">✳</span>
            <div className="h-[1px] flex-1 bg-black" />
          </div>
        </div>

        {/* Middle Black Bar */}
        <div className="h-7 bg-black flex items-center justify-center px-3 text-[#2ee68b] border-y border-black shrink-0">
          <span className="font-['Merchant_Copy',monospace] text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">
            ✳ STREAM NOW ✳
          </span>
        </div>

        {/* 6 Streaming Platform Boxes (3x2 Grid) with Gambar 2 Hover Effect */}
        <div className="grid grid-cols-3 gap-2 p-3 text-black flex-1 items-center">
          {/* 1. Amazon Music */}
          <a
            href={`https://music.amazon.com.au/search/${encodeURIComponent(
              `${activeTrack?.name || ''} ${activeTrack?.artist?.name || ''}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => {
              setHoveredPlatform('amazon');
              sound.playHover();
            }}
            onMouseLeave={() => setHoveredPlatform(null)}
            onClick={() => sound.playClick()}
            className={`h-14 sm:h-16 border-[1.5px] border-black rounded flex flex-col items-center justify-center p-1 transition-all duration-150 cursor-pointer ${
              hoveredPlatform === 'amazon' ? 'bg-black text-[#2ee68b]' : 'bg-transparent text-black'
            }`}
            title="Amazon Music"
          >
            <span className="font-bold text-[11px] tracking-tight leading-none">
              amazon<span className="font-light">music</span>
            </span>
            <svg className="w-8 h-2 mt-1" viewBox="0 0 40 10" fill="none">
              <path d="M2 3C12 9 28 9 38 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M35 1L38 3L35 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </a>

          {/* 2. Apple Music */}
          <a
            href={`https://music.apple.com/au/search?term=${encodeURIComponent(
              `${activeTrack?.name || ''} ${activeTrack?.artist?.name || ''}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => {
              setHoveredPlatform('apple');
              sound.playHover();
            }}
            onMouseLeave={() => setHoveredPlatform(null)}
            onClick={() => sound.playClick()}
            className={`h-14 sm:h-16 border-[1.5px] border-black rounded flex items-center justify-center p-1 transition-all duration-150 cursor-pointer ${
              hoveredPlatform === 'apple' ? 'bg-black text-[#2ee68b]' : 'bg-transparent text-black'
            }`}
            title="Apple Music"
          >
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors ${
                hoveredPlatform === 'apple' ? 'bg-[#2ee68b] text-black' : 'bg-black text-[#2ee68b]'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          </a>

          {/* 3. Qobuz */}
          <a
            href={`https://www.qobuz.com/au-en/search/tracks/${encodeURIComponent(
              `${activeTrack?.name || ''} ${activeTrack?.artist?.name || ''}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => {
              setHoveredPlatform('qobuz');
              sound.playHover();
            }}
            onMouseLeave={() => setHoveredPlatform(null)}
            onClick={() => sound.playClick()}
            className={`h-14 sm:h-16 border-[1.5px] border-black rounded flex items-center justify-center p-1 transition-all duration-150 cursor-pointer ${
              hoveredPlatform === 'qobuz' ? 'bg-black text-[#2ee68b]' : 'bg-transparent text-black'
            }`}
            title="Qobuz"
          >
            <span className="font-bold text-sm sm:text-base tracking-tighter lowercase">
              qobuz
            </span>
          </a>

          {/* 4. Spotify */}
          <a
            href={`https://open.spotify.com/search/${encodeURIComponent(
              `${activeTrack?.name || ''} ${activeTrack?.artist?.name || ''}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => {
              setHoveredPlatform('spotify');
              sound.playHover();
            }}
            onMouseLeave={() => setHoveredPlatform(null)}
            onClick={() => sound.playClick()}
            className={`h-14 sm:h-16 border-[1.5px] border-black rounded flex items-center justify-center p-1 transition-all duration-150 cursor-pointer ${
              hoveredPlatform === 'spotify' ? 'bg-black text-[#2ee68b]' : 'bg-transparent text-black'
            }`}
            title="Spotify"
          >
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors ${
                hoveredPlatform === 'spotify' ? 'bg-[#2ee68b] text-black' : 'bg-black text-[#2ee68b]'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.435-5.308-1.76-8.793-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.502 9.722 1.113.294.18.386.562.207.857zm1.224-2.72c-.226.367-.707.482-1.074.256-2.69-1.653-6.79-2.132-9.97-1.167-.413.125-.85-.11-.975-.523-.125-.413.11-.85.523-.975 3.633-1.102 8.146-.568 11.24 1.335.367.226.482.707.256 1.074zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.493.15-1.016-.13-1.166-.623-.15-.493.13-1.016.623-1.166 3.532-1.072 9.404-.866 13.115 1.338.445.264.59.838.327 1.282-.264.444-.838.59-1.282.328z" />
              </svg>
            </div>
          </a>

          {/* 5. Tidal */}
          <a
            href={`https://tidal.com/search?q=${encodeURIComponent(
              `${activeTrack?.name || ''} ${activeTrack?.artist?.name || ''}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => {
              setHoveredPlatform('tidal');
              sound.playHover();
            }}
            onMouseLeave={() => setHoveredPlatform(null)}
            onClick={() => sound.playClick()}
            className={`h-14 sm:h-16 border-[1.5px] border-black rounded flex flex-col items-center justify-center p-1 transition-all duration-150 cursor-pointer ${
              hoveredPlatform === 'tidal' ? 'bg-black text-[#2ee68b]' : 'bg-transparent text-black'
            }`}
            title="Tidal"
          >
            <div className="flex items-center gap-0.5 mb-1">
              <div className="w-1.5 h-1.5 bg-current rotate-45" />
              <div className="w-1.5 h-1.5 bg-current rotate-45" />
              <div className="w-1.5 h-1.5 bg-current rotate-45" />
              <div className="w-1.5 h-1.5 bg-current rotate-45" />
            </div>
            <span className="font-bold text-[9px] sm:text-[10px] tracking-[0.18em]">
              T I D A L
            </span>
          </a>

          {/* 6. YouTube Music */}
          <a
            href={`https://music.youtube.com/search?q=${encodeURIComponent(
              `${activeTrack?.name || ''} ${activeTrack?.artist?.name || ''}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => {
              setHoveredPlatform('ytmusic');
              sound.playHover();
            }}
            onMouseLeave={() => setHoveredPlatform(null)}
            onClick={() => sound.playClick()}
            className={`h-14 sm:h-16 border-[1.5px] border-black rounded flex items-center justify-center p-1 transition-all duration-150 cursor-pointer ${
              hoveredPlatform === 'ytmusic' ? 'bg-black text-[#2ee68b]' : 'bg-transparent text-black'
            }`}
            title="YouTube Music"
          >
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors ${
                hoveredPlatform === 'ytmusic' ? 'bg-[#2ee68b] text-black' : 'bg-black text-[#2ee68b]'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-12.5v9l6-4.5-6-4.5z" />
              </svg>
            </div>
          </a>
        </div>

        {/* Lower Black Bar */}
        <div className="h-7 bg-black flex items-center justify-center px-3 text-[#2ee68b] border-y border-black shrink-0">
          <span className="font-['Merchant_Copy',monospace] text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">
            ✳ SPREAD THE WORD ✳
          </span>
        </div>

        {/* Share This Track Button with 3 Concentric Stadium/Pill Dashed Borders on Hover (Gambar 3) */}
        <div className="p-3 sm:p-4 flex items-center justify-center shrink-0">
          <button
            onMouseEnter={() => {
              setIsShareHovered(true);
              sound.playHover();
            }}
            onMouseLeave={() => setIsShareHovered(false)}
            onClick={handleShareTrack}
            className="relative w-full py-4 px-6 flex items-center justify-center cursor-pointer select-none group"
          >
            {/* Concentric Ring 3 (Outermost, appears on hover) */}
            <div
              className={`absolute inset-0 rounded-full border-[1.5px] border-dashed border-black transition-all duration-200 pointer-events-none ${
                isShareHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            />

            {/* Concentric Ring 2 (Middle, appears on hover) */}
            <div
              className={`absolute inset-[3.5px] rounded-full border-[1.5px] border-dashed border-black transition-all duration-200 pointer-events-none ${
                isShareHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
            />

            {/* Concentric Ring 1 (Innermost) */}
            <div
              className={`absolute rounded-full border-[1.5px] border-dashed border-black transition-all duration-200 pointer-events-none ${
                isShareHovered ? 'inset-[7px]' : 'inset-1'
              }`}
            />

            {/* Button Text */}
            <span className="relative z-10 font-['Instrument_Serif',Georgia,serif] text-xl sm:text-2xl text-black tracking-wider leading-none select-none">
              SHARE THIS TRACK
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
