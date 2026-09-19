/**
 * server/src/jamendo.ts
 * Jamendo REST API client using Node.js native https with offline fallback tracks.
 * Queries Creative Commons MP3 tracks with 128kbps audio and cover art.
 */

import https from 'https';
import { Track } from './types';

const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID || '709fa152';

export const FALLBACK_TRACKS: Track[] = [
  {
    id: 'jamendo-1',
    name: 'Midnight Breeze (Lo-Fi Chill)',
    artist_name: 'Chillpeach',
    album_name: 'Starlit Haven',
    duration: 185,
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
    audio: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    genre: 'Lo-Fi',
    license_ccurl: 'https://creativecommons.org/licenses/by/3.0/'
  },
  {
    id: 'jamendo-2',
    name: 'Acoustic Morning Glow',
    artist_name: 'Benjamin Tissot',
    album_name: 'Coffee & Sun',
    duration: 142,
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&auto=format&fit=crop&q=80',
    audio: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=acoustic-guitars-ambient-10656.mp3',
    genre: 'Acoustic',
    license_ccurl: 'https://creativecommons.org/licenses/by/3.0/'
  },
  {
    id: 'jamendo-3',
    name: 'Subtle Tokyo Rain',
    artist_name: 'Kudasai Moments',
    album_name: 'Rainy Cafe Dreams',
    duration: 210,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
    audio: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_03d63b27b4.mp3?filename=chill-abstract-intention-12099.mp3',
    genre: 'Lo-Fi',
    license_ccurl: 'https://creativecommons.org/licenses/by/3.0/'
  },
  {
    id: 'jamendo-4',
    name: 'Golden Hour Piano Melody',
    artist_name: 'Audionautix Strings',
    album_name: 'Peaceful Reflections',
    duration: 168,
    image: 'https://images.unsplash.com/photo-1520523839898-507127053e14?w=400&auto=format&fit=crop&q=80',
    audio: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=soft-piano-ambient-11002.mp3',
    genre: 'Piano',
    license_ccurl: 'https://creativecommons.org/licenses/by/3.0/'
  },
  {
    id: 'jamendo-5',
    name: 'Sunset Drive Synthwave',
    artist_name: 'RetroNeon',
    album_name: 'Analog Highway',
    duration: 224,
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    audio: 'https://cdn.pixabay.com/download/audio/2022/01/26/audio_d0c6ff1bdd.mp3?filename=electronic-future-beats-117997.mp3',
    genre: 'Synthwave',
    license_ccurl: 'https://creativecommons.org/licenses/by/3.0/'
  },
  {
    id: 'jamendo-6',
    name: 'Warm Coffee Jazz Cafe',
    artist_name: 'Blue Note Trio',
    album_name: 'Boutique Sessions',
    duration: 195,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    audio: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6591201e.mp3?filename=jazz-cafe-111559.mp3',
    genre: 'Jazz',
    license_ccurl: 'https://creativecommons.org/licenses/by/3.0/'
  }
];

export function fetchJamendo(urlStr: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(urlStr, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

export async function searchJamendoTracks(query: string): Promise<Track[]> {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return FALLBACK_TRACKS;
  }

  try {
    const cleanQuery = encodeURIComponent(query.trim());
    const apiUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=15&search=${cleanQuery}&audioformat=mp32&include=musicinfo`;
    const response = await fetchJamendo(apiUrl);

    if (response && Array.isArray(response.results) && response.results.length > 0) {
      return response.results
        .filter((t: any) => t && t.audio && typeof t.audio === 'string' && t.audio.length > 0)
        .map((t: any) => ({
          id: String(t.id),
          name: t.name || 'Untitled Track',
          artist_name: t.artist_name || 'Jamendo Artist',
          album_name: t.album_name || 'Single',
          duration: typeof t.duration === 'number' ? t.duration : 180,
          image: t.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
          audio: t.audio,
          license_ccurl: t.license_ccurl || 'https://creativecommons.org/licenses/by/3.0/',
          genre: t.musicinfo?.tags?.genres?.[0] || 'Music'
        }));
    }
  } catch (err) {
    console.warn('[Jamendo API] Failed to fetch or parse Jamendo API:', err);
  }

  // Fallback matching query if available, or return fallback list
  const lowerQ = query.toLowerCase();
  const matched = FALLBACK_TRACKS.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQ) ||
      t.artist_name.toLowerCase().includes(lowerQ) ||
      (t.genre && t.genre.toLowerCase().includes(lowerQ))
  );

  return matched.length > 0 ? matched : FALLBACK_TRACKS;
}

export function getCuratedTracks(): Track[] {
  return FALLBACK_TRACKS;
}
