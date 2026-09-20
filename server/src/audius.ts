/**
 * server/src/audius.ts
 * Audius Decentralized Music API Client for PoySic.
 * Provides access to millions of tracks without requiring paid or complex API keys.
 * Streaming URLs are native MP3/M4A direct streams compatible with HTML5 Audio and Cristian clock sync.
 */

import { Track } from './types';

const AUDIUS_APP_NAME = 'poysic';
const AUDIUS_BASE_URLS = [
  'https://api.audius.co',
  'https://discoveryprovider.audius.co',
];

export async function searchAudiusTracks(query: string, limit = 15): Promise<Track[]> {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return [];
  }

  const cleanQuery = encodeURIComponent(query.trim());

  for (const baseUrl of AUDIUS_BASE_URLS) {
    try {
      const url = `${baseUrl}/v1/tracks/search?query=${cleanQuery}&app_name=${AUDIUS_APP_NAME}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'PoySic/1.0',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      if (data && Array.isArray(data.data) && data.data.length > 0) {
        const tracks: Track[] = data.data
          .filter((t: any) => t && t.id && (t.is_streamable !== false))
          .slice(0, limit)
          .map((t: any) => {
            const artwork =
              t.artwork?.['480x480'] ||
              t.artwork?.['150x150'] ||
              t.artwork?.['1000x1000'] ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80';

            return {
              id: `audius-${t.id}`,
              name: t.title || 'Untitled Track',
              artist_name: t.user?.name || 'Audius Artist',
              album_name: 'Audius Release',
              duration: typeof t.duration === 'number' && t.duration > 0 ? Math.round(t.duration) : 180,
              image: artwork,
              audio: `https://api.audius.co/v1/tracks/${t.id}/stream?app_name=${AUDIUS_APP_NAME}`,
              license_ccurl: 'https://audius.co',
              genre: t.genre || 'Audius',
              source: 'audius' as const,
            };
          });

        if (tracks.length > 0) {
          return tracks;
        }
      }
    } catch (err) {
      console.warn(`[Audius API] Host ${baseUrl} search failed:`, (err as Error).message);
    }
  }

  return [];
}
