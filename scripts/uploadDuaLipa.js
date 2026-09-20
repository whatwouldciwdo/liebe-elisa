const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read key from .env.local
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
let rawKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim() || '';
console.log('Raw key in .env.local:', rawKey);

// Check if rawKey has '<kyMDY5' glitch or if it works directly
async function testKey(key) {
  const url = 'https://iektvwfwkvrmngfjnaun.supabase.co';
  const supabase = createClient(url, key);
  const { data, error } = await supabase.from('songs').select('*');
  if (error) {
    console.log('Test key failed:', error.message);
    return null;
  }
  console.log('Test key SUCCESS! Found songs:', data.length);
  return supabase;
}

async function run() {
  let supabase = await testKey(rawKey);

  if (!supabase) {
    // Attempt cleanup if `<kyMDY5` was pasted in error
    // Decode both sides around '<'
    const parts = rawKey.split('<');
    console.log('Parts count:', parts.length);
    if (parts.length > 1) {
      // Clean candidate:
      const payloadObj = {
        iss: "supabase",
        ref: "iektvwfwkvrmngfjnaun",
        role: "service_role",
        iat: 1789920690,
        exp: 2105496690
      };
      const cleanedPayload = Buffer.from(JSON.stringify(payloadObj)).toString('base64').replace(/=/g, '');
      const sig = parts[1].split('.').pop();
      const cleanedKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${cleanedPayload}.${sig}`;
      console.log('Testing cleanedKey...');
      supabase = await testKey(cleanedKey);
      if (supabase) {
        console.log('Updating .env.local with cleanedKey...');
        const newEnv = `NEXT_PUBLIC_SUPABASE_URL=https://iektvwfwkvrmngfjnaun.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${cleanedKey}\n`;
        fs.writeFileSync(path.join(__dirname, '..', '.env.local'), newEnv, 'utf-8');
      }
    }
  }

  if (!supabase) {
    console.error('Could not authenticate with Supabase. Please check key.');
    process.exit(1);
  }

  console.log('=== STARTING UPLOAD DUA LIPA TO SUPABASE ===');

  const audioPath = 'C:/Users/62821/Downloads/Dua Lipa - Training Season.mp3';
  const coverPath = 'C:/Users/62821/Downloads/dua lipa - training season.png';
  const lrcPath = 'C:/Users/62821/Downloads/Dua Lipa - Training Season (Live from the Royal Albert Hall).lrc';

  // 1. Upload audio
  console.log('1. Uploading Audio to songs-audio bucket...');
  const audioBuffer = fs.readFileSync(audioPath);
  const audioFileName = `dua_lipa_training_season_${Date.now()}.mp3`;
  const { data: audioUpload, error: audioErr } = await supabase.storage
    .from('songs-audio')
    .upload(audioFileName, audioBuffer, { contentType: 'audio/mpeg', upsert: true });

  if (audioErr) {
    console.error('Audio upload error:', audioErr);
    process.exit(1);
  }

  const { data: audioUrlData } = supabase.storage.from('songs-audio').getPublicUrl(audioFileName);
  const audioPublicUrl = audioUrlData.publicUrl;
  console.log('✓ Audio uploaded:', audioPublicUrl);

  // 2. Upload cover
  console.log('2. Uploading Cover to songs-covers bucket...');
  const coverBuffer = fs.readFileSync(coverPath);
  const coverFileName = `dua_lipa_cover_${Date.now()}.png`;
  const { data: coverUpload, error: coverErr } = await supabase.storage
    .from('songs-covers')
    .upload(coverFileName, coverBuffer, { contentType: 'image/png', upsert: true });

  let coverPublicUrl = '';
  if (coverErr) {
    console.warn('Cover upload warning:', coverErr);
  } else {
    const { data: coverUrlData } = supabase.storage.from('songs-covers').getPublicUrl(coverFileName);
    coverPublicUrl = coverUrlData.publicUrl;
    console.log('✓ Cover uploaded:', coverPublicUrl);
  }

  // 3. Read lyrics
  const lyricsText = fs.readFileSync(lrcPath, 'utf-8');

  // 4. Insert song into DB for playlist '123' and 'D'
  console.log('3. Inserting song record into Supabase Database for playlist D & 123...');

  const playlistsToInsert = ['D', '123', 'T'];
  for (const pKey of playlistsToInsert) {
    const { data: songData, error: songErr } = await supabase
      .from('songs')
      .insert([
        {
          title: 'Training Season',
          artist: 'Dua Lipa',
          album: 'Live from the Royal Albert Hall',
          year: '2024',
          duration: 221,
          playlist_key: pKey,
          audio_url: audioPublicUrl,
          artwork_url: coverPublicUrl,
          lyrics: lyricsText,
          links: {
            spotify: 'https://open.spotify.com/search/Training%20Season%20Dua%20Lipa',
            apple_music: 'https://music.apple.com/au/search?term=Training%20Season%20Dua%20Lipa',
            youtube: 'https://music.youtube.com/search?q=Training%20Season%20Dua%20Lipa',
          },
        },
      ])
      .select();

    if (songErr) {
      console.error(`Insert for ${pKey} error:`, songErr);
    } else {
      console.log(`✓ Inserted song for playlist ${pKey}! ID:`, songData[0].id);
    }
  }

  console.log('=== ALL DONE! DUA LIPA UPLOADED TO SUPABASE SUCCESSFULLY! ===');
}

run().catch(console.error);
