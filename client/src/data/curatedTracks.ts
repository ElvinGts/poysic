/**
 * client/src/data/curatedTracks.ts
 * Tujuan: Senarai lagu pilihan bebas royalti Jamendo berlesen Creative Commons untuk mainan segera.
 */
import { Track } from '../types';

export const CURATED_TRACKS: Track[] = [
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

export const GENRE_CATEGORIES = [
  'Semua',
  'Lo-Fi',
  'Acoustic',
  'Piano',
  'Synthwave',
  'Jazz',
  'Ambient'
];
