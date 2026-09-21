'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import MemoriesManager from '@/components/memories/MemoriesManager';
import {
  DbSong,
  isSupabaseConfigured,
  uploadAudioFile,
  uploadCoverFile,
  insertSong,
  fetchSongs,
  deleteSong,
} from '@/lib/supabase';
import { DAILY_LETTER_MAP } from '@/lib/playlistPlayerRenderer';
import { sound } from '@/lib/audio';
import { parseLRC } from '@/lib/lyrics';
import { readAudioDuration } from '@/lib/audioMetadata';
import {
  Music,
  Upload,
  Play,
  Pause,
  Trash2,
  FileText,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  Database,
  Disc,
  ListMusic,
  PlusCircle,
  Volume2,
  Clock,
  Sparkles,
} from 'lucide-react';

const PLAYLIST_LETTERS = [
  '123', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
  'L', 'M', 'N', 'O', 'PQR', 'S', 'T', 'U', 'V', 'W', 'XYZ',
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'add' | 'library' | 'setup' | 'memories'>('add');

  // Supabase track library state
  const [songs, setSongs] = useState<DbSong[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Audio preview player in Library
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Lyrics modal
  const [selectedLyricsSong, setSelectedLyricsSong] = useState<DbSong | null>(null);

  // Add Song Form State
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [year, setYear] = useState('');
  const [playlistKey, setPlaylistKey] = useState('123');
  const [lyrics, setLyrics] = useState('');
  const [spotifyLink, setSpotifyLink] = useState('');
  const [appleMusicLink, setAppleMusicLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');

  // File uploads
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const durationRequestRef = useRef<Promise<number> | null>(null);
  const selectedAudioRef = useRef<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string>('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isPreparingCover, setIsPreparingCover] = useState(false);
  const coverSelectionRef = useRef(0);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>('');

  // Upload progress & status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);

  const [copiedSql, setCopiedSql] = useState(false);

  // LRC file input & audio preview ref for stamping
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const lrcFileInputRef = useRef<HTMLInputElement | null>(null);

  // Real-time detection of parsed synced LRC lines
  const parsedLrc = React.useMemo(() => parseLRC(lyrics), [lyrics]);

  // Handle .lrc file upload
  const handleLrcUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/\.(lrc|txt)$/i.test(file.name)) {
      setStatusMessage({ text: 'Please select a .lrc or .txt lyrics file.', type: 'error' });
      return;
    }
    sound.playClick();
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setLyrics(text);
        sound.playChime([523.25, 659.25, 783.99]);
      }
    };
    reader.onerror = () => {
      setStatusMessage({ text: 'Cannot read lyrics file. Download it to your device and try again.', type: 'error' });
    };
    reader.readAsText(file);
  };

  // Stamp current audio preview time into lyrics
  const handleStampCurrentTime = () => {
    const audio = previewAudioRef.current;
    if (!audio) return;
    sound.playClick();
    const t = audio.currentTime || 0;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    const stamp = `[${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}] `;

    setLyrics((prev) => (prev ? `${prev}\n${stamp}` : stamp));
  };

  // Load songs on mount or tab change
  const loadSongs = async () => {
    if (!isSupabaseConfigured) return;
    setIsLoadingSongs(true);
    const res = await fetchSongs(libraryFilter);
    if (res.data) {
      setSongs(res.data);
    }
    setIsLoadingSongs(false);
  };

  useEffect(() => {
    if (activeTab === 'library') {
      loadSongs();
    }
  }, [activeTab, libraryFilter]);

  // Audio file selection with duration detection
  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.playClick();
    setAudioFile(file);
    selectedAudioRef.current = file;
    setAudioDuration(0);

    // Create temporary local preview URL
    const url = URL.createObjectURL(file);
    setAudioPreviewUrl(url);

    const request = readAudioDuration(file);
    durationRequestRef.current = request;
    request.then((duration) => {
      if (selectedAudioRef.current === file) setAudioDuration(duration);
    }).catch((error: Error) => {
      if (selectedAudioRef.current === file) {
        setStatusMessage({ text: error.message, type: 'error' });
      }
    });
  };

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [audioPreviewUrl]);

  // Cover image selection
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    sound.playClick();
    const selection = ++coverSelectionRef.current;
    setCoverFile(null);
    setCoverPreviewUrl('');
    setIsPreparingCover(true);
    try {
      const bytes = await file.arrayBuffer();
      if (!bytes.byteLength) throw new Error('The selected image is empty.');
      if (selection !== coverSelectionRef.current) return;
      // Snapshot mobile/cloud-backed files before the potentially long audio upload.
      const localFile = new File([bytes], file.name, { type: file.type });
      setCoverFile(localFile);
      setCoverPreviewUrl(URL.createObjectURL(localFile));
      setStatusMessage({ text: 'Cover is ready to upload.', type: 'info' });
    } catch (error) {
      if (selection === coverSelectionRef.current) {
        setStatusMessage({
          text: `Cannot read selected cover: ${error instanceof Error ? error.message : 'File access failed.'} Download the image to your device and select it again.`,
          type: 'error',
        });
      }
    } finally {
      if (selection === coverSelectionRef.current) setIsPreparingCover(false);
    }
  };

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  // Format seconds to mm:ss
  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Submit new song
  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    if (isPreparingCover || isSubmitting) return;

    if (!title.trim() || !artist.trim()) {
      setStatusMessage({ text: 'Please fill in Title and Artist fields.', type: 'error' });
      return;
    }

    if (!audioFile) {
      setStatusMessage({ text: 'Please select an Audio file (.mp3, .wav, .m4a, .mp4a, etc.).', type: 'error' });
      return;
    }

    if (!isSupabaseConfigured) {
      setStatusMessage({
        text: 'Supabase credentials are not configured yet. Check the "SQL & SETUP GUIDE" tab to set up .env.local.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage({ text: 'Reading audio duration...', type: 'info' });

    try {
      const duration = audioDuration > 0
        ? audioDuration
        : await (durationRequestRef.current ?? readAudioDuration(audioFile));
      if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error('Enter a valid audio duration in seconds before uploading.');
      }
      setStatusMessage({ text: '1/3 Uploading audio file to Supabase Storage...', type: 'info' });
      // 1. Upload audio
      const audioRes = await uploadAudioFile(audioFile);
      if (audioRes.error || !audioRes.url) {
        throw new Error(`Audio upload failed: ${audioRes.error}`);
      }

      // 2. Upload cover if provided
      let finalCoverUrl = '';
      if (coverFile) {
        setStatusMessage({ text: '2/3 Uploading cover artwork to Supabase Storage...', type: 'info' });
        const coverRes = await uploadCoverFile(coverFile);
        if (coverRes.error || !coverRes.url) {
          throw new Error(`Cover upload failed: ${coverRes.error || 'No cover URL returned.'}`);
        }
        finalCoverUrl = coverRes.url;
      }

      // 3. Save song record to database
      setStatusMessage({ text: '3/3 Saving song record to Supabase Database...', type: 'info' });

      const insertRes = await insertSong({
        title: title.trim(),
        artist: artist.trim(),
        album: album.trim(),
        year: year.trim(),
        duration: Math.max(1, Math.round(duration)),
        playlist_key: playlistKey,
        audio_url: audioRes.url,
        artwork_url: finalCoverUrl,
        lyrics: lyrics.trim(),
        links: {
          spotify: spotifyLink.trim() || undefined,
          apple_music: appleMusicLink.trim() || undefined,
          youtube: youtubeLink.trim() || undefined,
        },
      });

      if (insertRes.error) {
        throw new Error(`Database save failed: ${insertRes.error}`);
      }

      sound.playChime([523.25, 659.25, 783.99]);
      setStatusMessage({
        text: `✓ Track "${title}" by ${artist} added successfully to Playlist ${playlistKey}!`,
        type: 'success',
      });

      // Reset form
      setTitle('');
      setArtist('');
      setAlbum('');
      setYear('');
      setLyrics('');
      setSpotifyLink('');
      setAppleMusicLink('');
      setYoutubeLink('');
      setAudioFile(null);
      selectedAudioRef.current = null;
      durationRequestRef.current = null;
      setAudioDuration(0);
      setAudioPreviewUrl('');
      setCoverFile(null);
      setCoverPreviewUrl('');
    } catch (err: any) {
      console.error('Upload failed:', err);
      setStatusMessage({ text: `Upload error: ${err?.message || 'Something went wrong.'}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Play/Pause in Library
  const handleTogglePlay = (song: DbSong) => {
    sound.playClick();
    if (playingSongId === song.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingSongId(null);
    } else {
      setPlayingSongId(song.id);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = song.audio_url;
        audioPlayerRef.current.play().catch((e) => console.warn('Play error:', e));
      }
    }
  };

  // Handle Delete
  const handleDeleteSong = async (song: DbSong) => {
    if (!confirm(`Are you sure you want to delete "${song.title}"?`)) return;
    sound.playClick();

    const res = await deleteSong(song.id, song.audio_url, song.artwork_url);
    if (res.success) {
      setSongs((prev) => prev.filter((s) => s.id !== song.id));
      if (playingSongId === song.id && audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        setPlayingSongId(null);
      }
    } else {
      alert(`Delete failed: ${res.error}`);
    }
  };

  const copySqlToClipboard = () => {
    sound.playClick();
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const filteredSongs = songs.filter((s) => {
    const matchQuery =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.album && s.album.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchQuery;
  });

  return (
    <div className="dashboard min-h-dvh bg-black text-[#FF7FEC] font-mono selection:bg-[#FF7FEC] selection:text-black relative">
      {/* CRT Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none crt-lines opacity-25 z-50" />

      {/* Hidden global audio element for playback */}
      <audio
        ref={audioPlayerRef}
        onEnded={() => setPlayingSongId(null)}
        onError={() => setPlayingSongId(null)}
      />

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 relative z-10">
        {/* ========================================================== */}
        {/* TOP BAR / HEADER */}
        {/* ========================================================== */}
        <div className="border border-[#FF7FEC] bg-black p-4 md:p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Disc className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
              <h1 className="text-lg md:text-xl font-bold tracking-widest uppercase">
                MEDIA DATABASE // SONG MANAGER
              </h1>
            </div>
            <p className="text-xs text-[#00f5d4] mt-1 tracking-wider">
              Ausify Track & Audio Repository (Supabase Cloud Storage)
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Supabase Status Indicator */}
            <div
              className={`px-3 py-1 text-xs border flex items-center gap-2 ${
                isSupabaseConfigured
                  ? 'border-[#00f5d4] text-[#00f5d4] bg-[#00f5d4]/10'
                  : 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseConfigured ? 'bg-[#00f5d4] animate-ping' : 'bg-yellow-400'
                }`}
              />
              {isSupabaseConfigured ? 'SUPABASE ONLINE' : 'CREDENTIALS NEEDED'}
            </div>

            {/* Back to Player */}
            <Link
              href="/daily"
              onClick={() => sound.playClick()}
              className="px-4 py-1.5 text-xs border border-[#FF7FEC] hover:bg-[#FF7FEC] hover:text-black transition-colors font-bold tracking-wider"
            >
              ◄ BACK TO PLAYER
            </Link>
          </div>
        </div>

        {/* ========================================================== */}
        {/* NAVIGATION TABS */}
        {/* ========================================================== */}
        <div className="dashboard-tabs flex border-b border-[#FF7FEC] mb-6 overflow-x-auto">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('add');
            }}
            className={`px-5 py-3 text-xs md:text-sm font-bold tracking-wider flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'add'
                ? 'bg-[#FF7FEC] text-black border-t border-l border-r border-[#FF7FEC]'
                : 'text-[#FF7FEC] hover:bg-[#FF7FEC]/10'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            [ + ADD NEW TRACK ]
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('library');
            }}
            className={`px-5 py-3 text-xs md:text-sm font-bold tracking-wider flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'library'
                ? 'bg-[#FF7FEC] text-black border-t border-l border-r border-[#FF7FEC]'
                : 'text-[#FF7FEC] hover:bg-[#FF7FEC]/10'
            }`}
          >
            <ListMusic className="w-4 h-4" />
            [ TRACK LIBRARY {songs.length > 0 && `(${songs.length})`} ]
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('setup');
            }}
            className={`px-5 py-3 text-xs md:text-sm font-bold tracking-wider flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'setup'
                ? 'bg-[#FF7FEC] text-black border-t border-l border-r border-[#FF7FEC]'
                : 'text-[#FF7FEC] hover:bg-[#FF7FEC]/10'
            }`}
          >
            <Database className="w-4 h-4" />
            [ SQL & SETUP GUIDE ]
          </button>
          <button onClick={() => { sound.playClick(); setActiveTab('memories'); }}
            className={`px-5 py-3 text-xs md:text-sm font-bold tracking-wider whitespace-nowrap ${activeTab === 'memories' ? 'bg-[#FF7FEC] text-black' : 'text-[#FF7FEC] hover:bg-[#FF7FEC]/10'}`}>
            [ MEMORIES ]
          </button>
        </div>
        {activeTab === 'memories' && <MemoriesManager />}

        {/* ========================================================== */}
        {/* TAB 1: ADD NEW TRACK */}
        {/* ========================================================== */}
        {activeTab === 'add' && (
          <div className="border border-[#FF7FEC] bg-black p-5 md:p-8">
            <div className="border-b border-[#FF7FEC]/30 pb-4 mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-base md:text-lg font-bold tracking-wider text-[#FF7FEC]">
                  UPLOAD NEW TRACK TO SUPABASE
                </h2>
                <p className="text-xs text-[#00f5d4] mt-1">
                  Upload audio (.mp3/.wav/.m4a/.mp4a), cover art, lyrics, and metadata. Existing static playlists will NOT be modified.
                </p>
              </div>
            </div>

            {statusMessage && (
              <div
                className={`p-3 mb-6 text-xs border flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'border-green-400 bg-green-950/30 text-green-300'
                    : statusMessage.type === 'error'
                    ? 'border-red-400 bg-red-950/30 text-red-300'
                    : 'border-[#00f5d4] bg-[#00f5d4]/10 text-[#00f5d4]'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{statusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleAddSong} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* --- Left Column: Metadata --- */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-1 text-[#FF7FEC]">
                      Track Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Paris"
                      required
                      className="w-full bg-black border border-[#FF7FEC] px-3 py-2 text-sm text-[#FF7FEC] focus:outline-none focus:ring-1 focus:ring-[#00f5d4]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-1 text-[#FF7FEC]">
                      Artist Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder="e.g. 2charm"
                      required
                      className="w-full bg-black border border-[#FF7FEC] px-3 py-2 text-sm text-[#FF7FEC] focus:outline-none focus:ring-1 focus:ring-[#00f5d4]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs uppercase tracking-wider mb-1 text-[#FF7FEC]">
                        Target Playlist / Letter
                      </label>
                      <select
                        value={playlistKey}
                        onChange={(e) => setPlaylistKey(e.target.value)}
                        className="w-full bg-black border border-[#FF7FEC] px-3 py-2 text-sm text-[#FF7FEC] focus:outline-none focus:ring-1 focus:ring-[#00f5d4]"
                      >
                        {PLAYLIST_LETTERS.map((letter) => {
                          const idx = DAILY_LETTER_MAP[letter] || 23;
                          return (
                            <option key={letter} value={letter} className="bg-black text-[#FF7FEC]">
                              DAILY {idx} - {letter}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider mb-1 text-[#FF7FEC]">
                        Release Year
                      </label>
                      <input
                        type="text"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="e.g. 2024"
                        className="w-full bg-black border border-[#FF7FEC] px-3 py-2 text-sm text-[#FF7FEC] focus:outline-none focus:ring-1 focus:ring-[#00f5d4]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-1 text-[#FF7FEC]">
                      Album / Release Name
                    </label>
                    <input
                      type="text"
                      value={album}
                      onChange={(e) => setAlbum(e.target.value)}
                      placeholder="e.g. Single Release"
                      className="w-full bg-black border border-[#FF7FEC] px-3 py-2 text-sm text-[#FF7FEC] focus:outline-none focus:ring-1 focus:ring-[#00f5d4]"
                    />
                  </div>

                  {/* Streaming Links (Optional) */}
                  <div className="border-t border-[#FF7FEC]/30 pt-3 mt-3 space-y-3">
                    <div className="text-xs text-[#00f5d4] uppercase tracking-wider font-bold">
                      Optional Streaming Links
                    </div>
                    <div>
                      <input
                        type="url"
                        value={spotifyLink}
                        onChange={(e) => setSpotifyLink(e.target.value)}
                        placeholder="Spotify Track URL (optional)"
                        className="w-full bg-black border border-[#FF7FEC]/60 px-3 py-1.5 text-xs text-[#FF7FEC] focus:outline-none focus:border-[#FF7FEC]"
                      />
                    </div>
                    <div>
                      <input
                        type="url"
                        value={appleMusicLink}
                        onChange={(e) => setAppleMusicLink(e.target.value)}
                        placeholder="Apple Music Track URL (optional)"
                        className="w-full bg-black border border-[#FF7FEC]/60 px-3 py-1.5 text-xs text-[#FF7FEC] focus:outline-none focus:border-[#FF7FEC]"
                      />
                    </div>
                    <div>
                      <input
                        type="url"
                        value={youtubeLink}
                        onChange={(e) => setYoutubeLink(e.target.value)}
                        placeholder="YouTube Music URL (optional)"
                        className="w-full bg-black border border-[#FF7FEC]/60 px-3 py-1.5 text-xs text-[#FF7FEC] focus:outline-none focus:border-[#FF7FEC]"
                      />
                    </div>
                  </div>
                </div>

                {/* --- Right Column: Audio & Cover Files --- */}
                <div className="space-y-6">
                  {/* 1. Audio Upload Box */}
                  <div className="border border-dashed border-[#FF7FEC] p-4 bg-black">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-[#FF7FEC] flex items-center gap-2">
                        <Music className="w-4 h-4 text-[#00f5d4]" />
                        Audio File (.mp3, .wav, .m4a, .mp4a) <span className="text-red-400">*</span>
                      </label>
                      {audioDuration > 0 && (
                        <span className="text-xs bg-[#00f5d4]/20 text-[#00f5d4] px-2 py-0.5 border border-[#00f5d4]">
                          {formatDuration(audioDuration)}
                        </span>
                      )}
                    </div>

                    <input
                      type="file"
                      accept="audio/*,.mp3,.wav,.ogg,.m4a,.mp4a,.flac"
                      disabled={isSubmitting}
                      onChange={handleAudioChange}
                      className="block w-full text-xs text-[#FF7FEC] file:mr-3 file:py-1.5 file:px-3 file:border file:border-[#FF7FEC] file:text-xs file:bg-black file:text-[#FF7FEC] hover:file:bg-[#FF7FEC] hover:file:text-black cursor-pointer"
                    />

                    {audioFile && (
                      <label className="block mt-3 text-xs text-[#00f5d4]">
                        Duration (seconds) — auto-detected, or enter manually
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={audioDuration || ''}
                          disabled={isSubmitting}
                          onChange={(e) => setAudioDuration(Number(e.target.value))}
                          className="block w-full mt-1 bg-black border border-[#FF7FEC] px-3 py-2 text-[#FF7FEC]"
                        />
                      </label>
                    )}

                    {audioFile && (
                      <div className="mt-3 text-xs text-gray-300">
                        <div>File: <span className="text-[#FF7FEC]">{audioFile.name}</span></div>
                        <div>Size: {(audioFile.size / (1024 * 1024)).toFixed(2)} MB</div>
                      </div>
                    )}

                    {audioPreviewUrl && (
                      <div className="mt-3 pt-3 border-t border-[#FF7FEC]/20">
                        <div className="text-xs text-[#00f5d4] mb-1 flex flex-wrap gap-2 items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Volume2 className="w-3 h-3" /> Audio Preview:
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Play here & stamp timestamps below
                          </span>
                        </div>
                        <audio ref={previewAudioRef} controls src={audioPreviewUrl} className="w-full h-8" />
                      </div>
                    )}
                  </div>

                  {/* 2. Cover Artwork Upload Box */}
                  <div className="border border-dashed border-[#FF7FEC] p-4 bg-black">
                    <label className="block text-xs uppercase tracking-wider font-bold text-[#FF7FEC] mb-2 flex items-center gap-2">
                      <Disc className="w-4 h-4 text-[#00f5d4]" />
                      Cover Artwork (.jpg, .png, .webp)
                    </label>

                    <input
                      type="file"
                      accept="image/*,.jpg,.jpeg,.png,.webp"
                      disabled={isSubmitting}
                      onChange={handleCoverChange}
                      className="block w-full text-xs text-[#FF7FEC] file:mr-3 file:py-1.5 file:px-3 file:border file:border-[#FF7FEC] file:text-xs file:bg-black file:text-[#FF7FEC] hover:file:bg-[#FF7FEC] hover:file:text-black cursor-pointer"
                    />

                    {isPreparingCover && (
                      <p className="mt-2 text-xs text-[#00f5d4]" role="status">Reading cover image...</p>
                    )}

                    {coverPreviewUrl && (
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <div className="w-24 h-24 border border-[#FF7FEC] relative overflow-hidden bg-black shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={coverPreviewUrl}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-xs text-gray-300">
                          <div className="text-[#00f5d4] font-bold">CD ARTWORK PREVIEW</div>
                          <div>{coverFile?.name}</div>
                          <div>{coverFile && (coverFile.size / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* --- Full-Width Lyrics Editor & LRC Controls --- */}
              <div className="border-t border-[#FF7FEC]/30 pt-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-[#FF7FEC] flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#00f5d4]" />
                      Lyrics (Plain Text or LRC Timestamps)
                    </label>
                    {parsedLrc.isSynced && (
                      <span className="text-[10px] px-2 py-0.5 border border-[#00f5d4] bg-[#00f5d4]/10 text-[#00f5d4] flex items-center gap-1 font-bold">
                        <Sparkles className="w-3 h-3" />
                        {parsedLrc.lines.length} SYNCED LINES DETECTED
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Hidden LRC file input */}
                    <input
                      type="file"
                      ref={lrcFileInputRef}
                      // No accept filter: mobile providers often label .lrc as an unknown MIME type.
                      onChange={handleLrcUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => lrcFileInputRef.current?.click()}
                      className="text-xs border border-[#00f5d4] text-[#00f5d4] px-2.5 py-1 hover:bg-[#00f5d4] hover:text-black transition-colors flex items-center gap-1"
                      title="Upload an existing .lrc lyric file"
                    >
                      <Upload className="w-3 h-3" />
                      Upload .LRC
                    </button>

                    {audioPreviewUrl && (
                      <button
                        type="button"
                        onClick={handleStampCurrentTime}
                        className="text-xs border border-[#FF7FEC] bg-[#FF7FEC]/20 text-[#FF7FEC] px-2.5 py-1 hover:bg-[#FF7FEC] hover:text-black transition-colors flex items-center gap-1 font-bold"
                        title="Stamp current playback time [mm:ss.xx] from audio preview"
                      >
                        <Clock className="w-3 h-3" />
                        Stamp Time
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setLyrics(
                          `[00:00.00] (Intro)\n[00:15.00] First verse lyrics here...\n[00:30.00] Chorus line...\n[00:45.00] Outro...`
                        );
                      }}
                      className="text-xs border border-[#FF7FEC]/60 text-gray-300 px-2.5 py-1 hover:bg-[#FF7FEC] hover:text-black transition-colors"
                    >
                      Insert Template
                    </button>
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="[00:05.20] First line of song...&#10;[00:12.80] Second line of song...&#10;[00:20.00] Chorus goes here...&#10;(Supports standard .lrc format: [mm:ss.xx] or plain text)"
                  className="w-full bg-black border border-[#FF7FEC] p-3 text-xs md:text-sm text-[#FF7FEC] font-mono focus:outline-none focus:ring-1 focus:ring-[#00f5d4] leading-relaxed"
                />

                <div className="text-[11px] text-gray-400 flex flex-wrap items-center justify-between">
                  <span>
                    💡 <strong className="text-[#00f5d4]">LRC Format:</strong> Use{' '}
                    <code className="text-[#FF7FEC]">[mm:ss.xx] Lyric text</code> for real-time karaoke sync!
                  </span>
                  <span>Play audio preview above and click &quot;Stamp Time&quot; to insert timestamps easily.</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isPreparingCover}
                  className={`w-full py-4 text-sm font-bold tracking-widest border transition-all uppercase flex items-center justify-center gap-2 ${
                    isSubmitting
                      ? 'border-gray-500 bg-gray-900 text-gray-400 cursor-not-allowed'
                      : 'border-[#FF7FEC] bg-[#FF7FEC] text-black hover:bg-black hover:text-[#FF7FEC]'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  {isSubmitting ? 'UPLOADING TO SUPABASE...' : '[ 💾 UPLOAD & SAVE TRACK TO SUPABASE ]'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 2: TRACK LIBRARY */}
        {/* ========================================================== */}
        {activeTab === 'library' && (
          <div className="border border-[#FF7FEC] bg-black p-5 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#FF7FEC]/30 pb-4 mb-6">
              <div>
                <h2 className="text-base md:text-lg font-bold tracking-wider text-[#FF7FEC]">
                  SUPABASE TRACK REPOSITORY
                </h2>
                <p className="text-xs text-[#00f5d4] mt-1">
                  Manage newly uploaded tracks. Existing static tracks in dailyPlaylists.json are separate and untouched.
                </p>
              </div>

              {/* Filter & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={libraryFilter}
                  onChange={(e) => {
                    sound.playClick();
                    setLibraryFilter(e.target.value);
                  }}
                  className="bg-black border border-[#FF7FEC] px-2 py-1 text-xs text-[#FF7FEC]"
                >
                  <option value="ALL">All Playlists</option>
                  {PLAYLIST_LETTERS.map((l) => (
                    <option key={l} value={l}>
                      Letter {l}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title, artist..."
                  className="bg-black border border-[#FF7FEC] px-2 py-1 text-xs text-[#FF7FEC] placeholder-[#FF7FEC]/40 w-44"
                />

                <button
                  onClick={loadSongs}
                  className="px-3 py-1 border border-[#00f5d4] text-[#00f5d4] text-xs hover:bg-[#00f5d4] hover:text-black transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>

            {!isSupabaseConfigured ? (
              <div className="border border-yellow-400 p-6 text-center text-yellow-300 text-xs">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                <div className="font-bold text-sm mb-1">SUPABASE CREDENTIALS REQUIRED</div>
                <div>To view and upload tracks, configure NEXT_PUBLIC_SUPABASE_URL and ANON_KEY in .env.local.</div>
                <button
                  onClick={() => setActiveTab('setup')}
                  className="mt-4 px-4 py-2 border border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black font-bold uppercase transition-colors"
                >
                  Go to SQL & Setup Guide
                </button>
              </div>
            ) : isLoadingSongs ? (
              <div className="py-12 text-center text-xs tracking-widest animate-pulse text-[#00f5d4]">
                (( FETCHING TRACKS FROM SUPABASE... ))
              </div>
            ) : filteredSongs.length === 0 ? (
              <div className="py-12 text-center text-xs border border-dashed border-[#FF7FEC]/40 p-6">
                <Disc className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="font-bold text-[#FF7FEC] mb-1">NO UPLOADED TRACKS FOUND IN SUPABASE</div>
                <div className="text-gray-400 mb-4">
                  {searchQuery
                    ? 'No songs matched your search filter.'
                    : 'Start by uploading your first song in the "+ ADD NEW TRACK" tab!'}
                </div>
                <button
                  onClick={() => setActiveTab('add')}
                  className="px-4 py-2 border border-[#FF7FEC] text-[#FF7FEC] hover:bg-[#FF7FEC] hover:text-black transition-colors font-bold uppercase"
                >
                  + Add New Track
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSongs.map((song) => {
                  const isPlaying = playingSongId === song.id;
                  return (
                    <div
                      key={song.id}
                      className="border border-[#FF7FEC] p-3 md:p-4 bg-black flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#00f5d4] transition-colors"
                    >
                      {/* Song Info & Cover */}
                      <div className="min-w-0 flex items-center gap-4">
                        {/* Cover Image */}
                        <div className="w-14 h-14 border border-[#FF7FEC] bg-neutral-900 shrink-0 relative overflow-hidden">
                          {song.artwork_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={song.artwork_url}
                              alt={song.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                              <Disc className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        {/* Title & Artist */}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-[#FF7FEC]">{song.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 border border-[#00f5d4] text-[#00f5d4]">
                              {song.playlist_key}
                            </span>
                          </div>
                          <div className="text-xs text-gray-300 mt-0.5">
                            {song.artist} {song.album && `• ${song.album}`} {song.year && `(${song.year})`}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1 flex flex-wrap items-center gap-3">
                            <span>Duration: {formatDuration(song.duration)}</span>
                            {song.lyrics && (
                              <span className="text-[#00f5d4] flex items-center gap-0.5">
                                <FileText className="w-3 h-3" /> Has Lyrics
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controls & Actions */}
                      <div className="flex flex-wrap items-center gap-2 self-end md:self-center md:shrink-0">
                        {/* Audio Play/Pause Button */}
                        <button
                          onClick={() => handleTogglePlay(song)}
                          className={`px-3 py-1.5 text-xs border flex items-center gap-1.5 font-bold transition-colors ${
                            isPlaying
                              ? 'border-[#00f5d4] bg-[#00f5d4] text-black'
                              : 'border-[#FF7FEC] text-[#FF7FEC] hover:bg-[#FF7FEC] hover:text-black'
                          }`}
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          {isPlaying ? 'PAUSE' : 'PLAY'}
                        </button>

                        {/* View Lyrics Button */}
                        {song.lyrics && (
                          <button
                            onClick={() => {
                              sound.playClick();
                              setSelectedLyricsSong(song);
                            }}
                            className="px-3 py-1.5 text-xs border border-[#FF7FEC] text-[#FF7FEC] hover:bg-[#FF7FEC] hover:text-black transition-colors"
                          >
                            LYRICS
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteSong(song)}
                          className="px-2.5 py-1.5 text-xs border border-red-500/70 text-red-400 hover:bg-red-500 hover:text-black transition-colors"
                          title="Delete Track"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 3: SQL & SETUP GUIDE */}
        {/* ========================================================== */}
        {activeTab === 'setup' && (
          <div className="border border-[#FF7FEC] bg-black p-5 md:p-8 space-y-6">
            <div>
              <h2 className="text-base md:text-lg font-bold tracking-wider text-[#FF7FEC]">
                SUPABASE SETUP & CONFIGURATION
              </h2>
              <p className="text-xs text-[#00f5d4] mt-1">
                Follow these 3 simple steps to connect Supabase database and storage buckets.
              </p>
            </div>

            {/* Step 1: Environment Variables */}
            <div className="border border-[#FF7FEC]/50 p-4 bg-black">
              <div className="text-xs font-bold text-[#00f5d4] uppercase mb-2">
                STEP 1: ADD CREDENTIALS TO .env.local
              </div>
              <p className="text-xs text-gray-300 mb-3">
                In your project root directory (<code className="text-[#FF7FEC]">d:\liebe</code>), create or edit{' '}
                <code className="text-[#FF7FEC]">.env.local</code> with your Supabase keys from Project Settings → API:
              </p>
              <pre className="bg-neutral-950 p-3 text-xs border border-[#FF7FEC]/30 overflow-x-auto text-[#00f5d4]">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
              </pre>
            </div>

            {/* Step 2: SQL Script */}
            <div className="border border-[#FF7FEC]/50 p-4 bg-black">
              <div className="flex flex-wrap gap-2 items-center justify-between mb-2">
                <div className="text-xs font-bold text-[#00f5d4] uppercase">
                  STEP 2: RUN SQL IN SUPABASE SQL EDITOR
                </div>
                <button
                  onClick={copySqlToClipboard}
                  className="px-3 py-1 border border-[#FF7FEC] text-xs hover:bg-[#FF7FEC] hover:text-black transition-colors flex items-center gap-1.5 font-bold"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'COPIED!' : 'COPY SQL'}
                </button>
              </div>
              <p className="text-xs text-gray-300 mb-3">
                Open Supabase Dashboard → <strong>SQL Editor</strong>, paste this script, and click <strong>Run</strong>:
              </p>
              <pre className="bg-neutral-950 p-4 text-xs border border-[#FF7FEC]/30 overflow-x-auto text-gray-200 max-h-80 leading-relaxed">
                {SUPABASE_SETUP_SQL}
              </pre>
            </div>

            {/* Step 3: Storage Verification */}
            <div className="border border-[#FF7FEC]/50 p-4 bg-black">
              <div className="text-xs font-bold text-[#00f5d4] uppercase mb-2">
                STEP 3: STORAGE BUCKETS
              </div>
              <p className="text-xs text-gray-300">
                The SQL script above automatically creates two public storage buckets:
              </p>
              <ul className="text-xs text-gray-300 list-disc list-inside mt-2 space-y-1">
                <li><code className="text-[#FF7FEC]">songs-audio</code>: stores uploaded audio files (.mp3, .wav)</li>
                <li><code className="text-[#FF7FEC]">songs-covers</code>: stores album and CD artwork (.jpg, .png)</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* LYRICS MODAL */}
      {/* ========================================================== */}
      {selectedLyricsSong && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="border-2 border-[#FF7FEC] bg-black max-w-lg w-full p-4 md:p-6 relative max-h-[85dvh] flex flex-col overflow-hidden">
            <div className="flex flex-wrap gap-3 shrink-0 items-center justify-between border-b border-[#FF7FEC] pb-3 mb-4">
              <div>
                <h3 className="font-bold text-sm text-[#FF7FEC]">{selectedLyricsSong.title}</h3>
                <div className="text-xs text-[#00f5d4]">{selectedLyricsSong.artist}</div>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  setSelectedLyricsSong(null);
                }}
                className="text-xs border border-[#FF7FEC] px-2 py-1 hover:bg-[#FF7FEC] hover:text-black font-bold"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto pr-2 text-xs font-mono leading-relaxed whitespace-pre-wrap text-gray-200">
              {selectedLyricsSong.lyrics || 'No lyrics available for this track.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SUPABASE_SETUP_SQL = `-- 1. Create Songs Database Table
CREATE TABLE IF NOT EXISTS public.songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT DEFAULT '',
  year TEXT DEFAULT '',
  duration INTEGER DEFAULT 0,
  playlist_key TEXT NOT NULL DEFAULT '123',
  audio_url TEXT NOT NULL,
  artwork_url TEXT DEFAULT '',
  lyrics TEXT DEFAULT '',
  links JSONB DEFAULT '{}'::jsonb
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- 3. Create Public Read and Insert Policies for songs
CREATE POLICY "Allow public read on songs"
  ON public.songs FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on songs"
  ON public.songs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public delete on songs"
  ON public.songs FOR DELETE
  USING (true);

-- 4. Create Public Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('songs-audio', 'songs-audio', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('songs-covers', 'songs-covers', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage Access Policies
CREATE POLICY "Allow public upload to songs-audio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'songs-audio');

CREATE POLICY "Allow public read from songs-audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'songs-audio');

CREATE POLICY "Allow public upload to songs-covers"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'songs-covers');

CREATE POLICY "Allow public read from songs-covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'songs-covers');
`;
