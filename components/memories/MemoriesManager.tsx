'use client';

import { useEffect, useRef, useState } from 'react';
import { addMemory, fetchMemories, MEMORY_MONTHS, type Memory } from '@/lib/memories';

export default function MemoriesManager() {
  const [month, setMonth] = useState(MEMORY_MONTHS[0].key);
  const [items, setItems] = useState<Memory[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const field = 'block w-full mt-2 border border-[#FF7FEC]/40 bg-black p-3 text-white';

  useEffect(() => {
    let active = true;
    fetchMemories().then(data => { if (active) setItems(data); }).catch(error => { if (active) setMessage(error.message); });
    fetch('/api/admin/session', { cache: 'no-store' }).then(response => response.json()).then(data => { if (active) setSignedIn(data.authenticated === true); }).catch(() => { if (active) setMessage('Gagal memeriksa sesi admin.'); });
    return () => { active = false; };
  }, []);

  return <section className="border border-[#FF7FEC] p-5 md:p-8 space-y-6 text-[#FF7FEC]">
    <h2 className="text-xl">[ MONTHLY MEMORIES ]</h2>
    <p>December 2025 — January 2027. Foto yang ditambahkan tampil di /memories sesuai bulan yang dipilih.</p>
    <details className="border border-[#FF7FEC]/30 p-4">
      <summary className="cursor-pointer">Setup database &amp; akun pengelola</summary>
      <p className="mt-3">Jika tabel belum dibuat, jalankan SQL berikut. Login memakai ADMIN_USERNAME dan ADMIN_PASSWORD dari environment server, tanpa akun Supabase Auth. Server juga memerlukan ADMIN_SESSION_SECRET dan SUPABASE_SERVICE_ROLE_KEY. Foto bersifat publik.</p>
      <a href="/data/memories-setup.sql" download className="underline inline-block mt-3">Download memories-setup.sql</a>
    </details>
    {!signedIn ? <form className="space-y-4" onSubmit={async event => {
      event.preventDefault(); if (busy) return; setBusy(true); setMessage('');
      try {
        const response = await fetch('/api/admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Login gagal.');
        setSignedIn(true);
        setPassword(''); setMessage('Login berhasil.');
      } catch (error) { setMessage(error instanceof Error ? error.message : 'Login gagal.'); }
      finally { setBusy(false); }
    }}>
      <label className="block">Username admin<input className={field} type="text" autoComplete="username" required value={username} onChange={e => setUsername(e.target.value)} /></label>
      <label className="block">Password<input className={field} type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
      <button disabled={busy} className="border p-3 disabled:opacity-40">{busy ? 'LOGGING IN…' : 'LOGIN'}</button>
    </form> : <button disabled={busy} className="border p-3" onClick={async () => {
      setBusy(true);
      try {
        const response = await fetch('/api/admin/session', { method: 'DELETE' });
        if (!response.ok) throw new Error('Logout gagal.');
        setSignedIn(false); setMessage('Logout berhasil.');
      } catch (error) { setMessage(error instanceof Error ? error.message : 'Logout gagal.'); }
      finally { setBusy(false); }
    }}>LOG OUT</button>}
    <label className="block">Bulan<select className={field} value={month} onChange={e => setMonth(e.target.value)} disabled={busy}>
      {MEMORY_MONTHS.map(item => <option key={item.key} value={item.key}>{item.label} ({items.filter(photo => photo.month === item.key).length})</option>)}
    </select></label>
    <form className="space-y-4" onSubmit={async event => {
      event.preventDefault(); if (busy) return;
      const form = event.currentTarget;
      const data = new FormData(form);
      const file = fileRef.current?.files?.[0];
      if (!file) { setMessage('Pilih foto terlebih dahulu.'); return; }
      setBusy(true); setMessage('Mengunggah foto…');
      try {
        const item = await addMemory(file, month, String(data.get('title') || ''), String(data.get('caption') || ''));
        setItems(previous => [...previous, item]); form.reset(); setMessage('Foto berhasil ditambahkan.');
      } catch (error) { setMessage(error instanceof Error ? error.message : 'Upload gagal.'); }
      finally { setBusy(false); }
    }}>
      <fieldset disabled={busy || !signedIn} className="space-y-4 disabled:opacity-50">
        <label className="block">Judul<input name="title" required maxLength={120} className={field} /></label>
        <label className="block">Caption<textarea name="caption" maxLength={1000} rows={3} className={field} /></label>
        <label className="block">Foto (JPG / PNG / WebP, maksimal 10 MB)<input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" required className={field} /></label>
        <button className="bg-[#FF7FEC] text-black px-5 py-3">{busy ? 'UPLOADING…' : '+ ADD MEMORY'}</button>
      </fieldset>
    </form>
    <p role="status" aria-live="polite" className="text-white break-words">{message}</p>
    <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.filter(item => item.month === month).map(item => <li key={item.id}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image_url} alt={item.title} className="aspect-[4/5] w-full object-cover" loading="lazy" />
        <p className="mt-2">{item.title}</p><p className="text-white/60 text-sm">{item.caption}</p>
      </li>)}
    </ul>
    {!items.some(item => item.month === month) && <p>Belum ada foto untuk bulan ini.</p>}
  </section>;
}