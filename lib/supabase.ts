import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface DbSong {
  id: string;
  created_at?: string;
  title: string;
  artist: string;
  album?: string;
  year?: string;
  duration: number; // in seconds
  playlist_key: string; // '123', 'A', 'B', etc.
  audio_url: string;
  artwork_url?: string;
  lyrics?: string;
  links?: {
    spotify?: string;
    apple_music?: string;
    youtube?: string;
    [key: string]: string | undefined;
  };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-public-key')
);

// Client instance (null-safe wrapper)
let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return clientInstance;
}

/**
 * Upload an audio file (.mp3, .wav, etc.) to the 'songs-audio' storage bucket
 */
export async function uploadAudioFile(file: File): Promise<{ url: string; path: string; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { url: '', path: '', error: 'Supabase credentials not configured in .env.local' };
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `audio_${Date.now()}_${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from('songs-audio')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    return { url: '', path: '', error: uploadError.message };
  }

  const { data } = supabase.storage.from('songs-audio').getPublicUrl(filePath);
  return { url: data.publicUrl, path: filePath };
}

/**
 * Upload cover artwork (.jpg, .png, etc.) to the 'songs-covers' storage bucket
 */
export async function uploadCoverFile(file: File): Promise<{ url: string; path: string; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { url: '', path: '', error: 'Supabase credentials not configured in .env.local' };
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `cover_${Date.now()}_${cleanName}`;

  const { error: uploadError } = await supabase.storage
    .from('songs-covers')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    return { url: '', path: '', error: uploadError.message };
  }

  const { data } = supabase.storage.from('songs-covers').getPublicUrl(filePath);
  return { url: data.publicUrl, path: filePath };
}

/**
 * Insert a new song record into the 'songs' database table
 */
export async function insertSong(
  song: Omit<DbSong, 'id' | 'created_at'>
): Promise<{ data?: DbSong; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: 'Supabase credentials not configured in .env.local' };
  }

  const { data, error } = await supabase
    .from('songs')
    .insert([
      {
        title: song.title,
        artist: song.artist,
        album: song.album || '',
        year: song.year || '',
        duration: song.duration || 0,
        playlist_key: song.playlist_key || '123',
        audio_url: song.audio_url,
        artwork_url: song.artwork_url || '',
        lyrics: song.lyrics || '',
        links: song.links || {},
      },
    ])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: data as DbSong };
}

/**
 * Fetch all uploaded songs from Supabase, optionally filtered by playlist_key
 */
export async function fetchSongs(playlistKey?: string): Promise<{ data: DbSong[]; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { data: [], error: 'Supabase credentials not configured in .env.local' };
  }

  let query = supabase.from('songs').select('*').order('created_at', { ascending: false });

  if (playlistKey && playlistKey !== 'ALL') {
    query = query.eq('playlist_key', playlistKey);
  }

  const { data, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: (data as DbSong[]) || [] };
}

/**
 * Delete a song record and its uploaded files from storage
 */
export async function deleteSong(
  id: string,
  audioUrl?: string,
  artworkUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase credentials not configured in .env.local' };
  }

  // 1. Delete from DB
  const { error: dbError } = await supabase.from('songs').delete().eq('id', id);
  if (dbError) {
    return { success: false, error: dbError.message };
  }

  // 2. Optionally delete from storage buckets
  try {
    if (audioUrl && audioUrl.includes('songs-audio/')) {
      const parts = audioUrl.split('songs-audio/');
      if (parts[1]) {
        await supabase.storage.from('songs-audio').remove([decodeURIComponent(parts[1])]);
      }
    }
    if (artworkUrl && artworkUrl.includes('songs-covers/')) {
      const parts = artworkUrl.split('songs-covers/');
      if (parts[1]) {
        await supabase.storage.from('songs-covers').remove([decodeURIComponent(parts[1])]);
      }
    }
  } catch (e) {
    console.warn('File cleanup warning:', e);
  }

  return { success: true };
}
