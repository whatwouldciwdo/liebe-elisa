import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { isAdmin, sameOrigin } from '@/lib/adminSession';
import { MEMORY_MONTHS } from '@/lib/memories';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origin tidak diizinkan.' }, { status: 403 });
  if (!isAdmin(request)) return NextResponse.json({ error: 'Sesi habis. Login admin terlebih dahulu.' }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Isi SUPABASE_SERVICE_ROLE_KEY di environment server lalu restart aplikasi.' }, { status: 503 });
  const limit = 11 * 1024 * 1024;
  if (Number(request.headers.get('content-length')) > limit) return NextResponse.json({ error: 'Foto maksimal 10 MB.' }, { status: 413 });
  try {
    // Bound streamed bodies too; Content-Length is not always provided by clients.
    const reader = request.body?.getReader();
    if (!reader) return NextResponse.json({ error: 'Data upload kosong.' }, { status: 400 });
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) { await reader.cancel(); return NextResponse.json({ error: 'Foto maksimal 10 MB.' }, { status: 413 }); }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks);
    const form = await new Response(bytes, { headers: { 'Content-Type': request.headers.get('content-type') || '' } }).formData();
    const file = form.get('file');
    const month = String(form.get('month') || '');
    const title = String(form.get('title') || '').trim();
    const caption = String(form.get('caption') || '').trim();
    const types: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
    if (!(file instanceof File) || !types[file.type] || !file.size || file.size > 10 * 1024 * 1024 ||
      !MEMORY_MONTHS.some(item => item.key === month) || !title || title.length > 120 || caption.length > 1000) {
      return NextResponse.json({ error: 'Periksa bulan, judul, caption, dan foto JPG/PNG/WebP maksimal 10 MB.' }, { status: 400 });
    }
    const image = Buffer.from(await file.arrayBuffer());
    const valid = file.type === 'image/jpeg' ? image.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
      : file.type === 'image/png' ? image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : image.toString('ascii', 0, 4) === 'RIFF' && image.toString('ascii', 8, 12) === 'WEBP';
    if (!valid) return NextResponse.json({ error: 'Isi file tidak sesuai format foto.' }, { status: 400 });
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const path = `admin/${month}/${randomUUID()}.${types[file.type]}`;
    const { error: uploadError } = await client.storage.from('memories').upload(path, image, { contentType: file.type });
    if (uploadError) return NextResponse.json({ error: `Upload Storage gagal: ${uploadError.message}` }, { status: 502 });
    const imageUrl = client.storage.from('memories').getPublicUrl(path).data.publicUrl;
    const { data, error } = await client.from('memories').insert({ month, title, caption, image_url: imageUrl, storage_path: path }).select().single();
    if (error) {
      const { error: cleanupError } = await client.storage.from('memories').remove([path]);
      return NextResponse.json({ error: `Simpan memories gagal: ${error.message}${cleanupError ? ' Hapus upload tersisa di Storage secara manual.' : ''}` }, { status: 502 });
    }
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Upload gagal. Periksa format file, konfigurasi server, dan koneksi Supabase.' }, { status: 400 });
  }
}