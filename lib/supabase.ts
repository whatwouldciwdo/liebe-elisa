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
 * Upload an audio file (.mp3, .wav, .m4a, .mp4a, etc.) to the 'songs-audio' storage bucket
 */
export async function uploadAudioFile(file: File): Promise<{ url: string; path: string; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { url: '', path: '', error: 'Supabase credentials not configured in .env.local' };
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `audio_${Date.now()}_${cleanName}`;

  // Determine explicit Content-Type to guarantee proper audio streaming in HTML5 audio (especially on iOS Safari)
  let contentType = file.type;
  if (!contentType || contentType === 'application/octet-stream') {
    const ext = cleanName.split('.').pop()?.toLowerCase();
    if (ext === 'm4a' || ext === 'mp4a' || ext === 'mp4') {
      contentType = 'audio/mp4';
    } else if (ext === 'mp3') {
      contentType = 'audio/mpeg';
    } else if (ext === 'wav') {
      contentType = 'audio/wav';
    } else if (ext === 'ogg') {
      contentType = 'audio/ogg';
    } else if (ext === 'aac') {
      contentType = 'audio/aac';
    } else if (ext === 'flac') {
      contentType = 'audio/flac';
    }
  }

  const { error: uploadError } = await supabase.storage
    .from('songs-audio')
    .upload(filePath, file, {
      contentType: contentType || undefined,
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

  let contentType = file.type;
  if (!contentType || contentType === 'application/octet-stream') {
    const ext = cleanName.split('.').pop()?.toLowerCase();
    if (ext === 'png') contentType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'webp') contentType = 'image/webp';
    else if (ext === 'gif') contentType = 'image/gif';
  }

  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    return { url: '', path: '', error: 'Cannot read the cover file. Select the image again before uploading.' };
  }
  if (!bytes.byteLength) {
    return { url: '', path: '', error: 'The cover image is empty.' };
  }

  const { error: uploadError } = await supabase.storage
    .from('songs-covers')
    .upload(filePath, bytes, {
      contentType: contentType || undefined,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    const message = /failed to fetch|network|load failed/i.test(uploadError.message)
      ? 'Cover upload could not reach Supabase Storage. Save the image locally on your device, select it again, and retry. Check your connection or try another network if this continues.'
      : uploadError.message;
    return { url: '', path: '', error: message };
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
 * Delete a song record. Keep storage assets because other playlists or static
 * playlist data may still reference them; cleanup requires a separate audit.
 */
export async function deleteSong(
  id: string,
  _audioUrl?: string,
  _artworkUrl?: string
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

  return { success: true };
}
