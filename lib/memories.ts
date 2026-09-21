import { getSupabaseClient } from './supabase';

export const MEMORY_MONTHS = Array.from({ length: 14 }, (_, index) => {
  const date = new Date(Date.UTC(2025, 11 + index, 1));
  return {
    key: date.toISOString().slice(0, 7),
    label: new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date),
  };
});

export interface Memory {
  id: string;
  month: string;
  title: string;
  caption: string;
  image_url: string;
  storage_path: string;
  created_at: string;
}

export async function fetchMemories(): Promise<Memory[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase belum dikonfigurasi.');
  const { data, error } = await client.from('memories').select('*').order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data as Memory[];
}

export async function addMemory(file: File, month: string, title: string, caption: string): Promise<Memory> {
  const form = new FormData();
  form.set('file', file);
  form.set('month', month);
  form.set('title', title);
  form.set('caption', caption);
  const response = await fetch('/api/admin/memories', { method: 'POST', body: form });
  const result = await response.json().catch(() => ({ error: 'Upload gagal. Periksa batas ukuran upload pada hosting.' }));
  if (!response.ok) throw new Error(result.error || 'Upload gagal.');
  return result.data as Memory;
}
