export interface LyricLine {
  time: number; // in seconds (e.g. 14.25)
  text: string;
}

/**
 * Parse standard LRC format string into ordered LyricLine array
 * Example input:
 * [00:12.45] Looking at the city lights
 * [00:18.20] Memories of lonely nights
 */
export function parseLRC(lrcText: string): { isSynced: boolean; lines: LyricLine[] } {
  if (!lrcText || typeof lrcText !== 'string') {
    return { isSynced: false, lines: [] };
  }

  const rawLines = lrcText.split(/\r?\n/);
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
  const parsedLines: LyricLine[] = [];
  let hasValidTimestamps = false;

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Ignore metadata headers like [ar: Artist], [ti: Title], [by: ...], etc.
    if (/^\[[a-zA-Z]+:.*\]$/.test(trimmed)) {
      continue;
    }

    const matches = [...trimmed.matchAll(timeRegex)];
    if (matches.length > 0) {
      hasValidTimestamps = true;
      // Strip bracket timestamps and enhanced word-level <mm:ss.xx> tags
      const text = trimmed
        .replace(timeRegex, '')
        .replace(/<[^>]+>/g, '')
        .trim();

      // Only add line if it has text or serves as musical break
      for (const match of matches) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        let ms = 0;
        if (match[3]) {
          const msStr = match[3].padEnd(3, '0').slice(0, 3);
          ms = parseInt(msStr, 10) / 1000;
        }
        const time = min * 60 + sec + ms;
        parsedLines.push({ time, text: text || '♪ ♪ ♪' });
      }
    } else {
      // Line without timestamp
      const plainText = trimmed.replace(/<[^>]+>/g, '').trim();
      if (plainText) {
        parsedLines.push({ time: -1, text: plainText });
      }
    }
  }

  if (hasValidTimestamps) {
    // Filter to timed lines and sort ascending by time
    const timedOnly = parsedLines
      .filter((l) => l.time >= 0)
      .sort((a, b) => a.time - b.time);
    return { isSynced: true, lines: timedOnly };
  }

  // Fallback for plain text lyrics (non-synced)
  return {
    isSynced: false,
    lines: parsedLines.map((l, index) => ({ time: index * 4, text: l.text })),
  };
}

/**
 * Format raw seconds into standard LRC timestamp: [mm:ss.xx]
 */
export function formatLrcTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '[00:00.00]';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `[${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}]`;
}

/**
 * Find index of active lyric line based on current playback time
 */
export function getActiveLyricIndex(lyrics: LyricLine[], currentTime: number): number {
  if (!lyrics || lyrics.length === 0) return -1;
  if (currentTime < lyrics[0].time) return -1;

  for (let i = 0; i < lyrics.length; i++) {
    const current = lyrics[i];
    const next = lyrics[i + 1];
    if (currentTime >= current.time && (!next || currentTime < next.time)) {
      return i;
    }
  }

  return lyrics.length - 1;
}
