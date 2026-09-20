/**
 * client/src/types/track.ts
 * Tujuan: Definisi jenis data trek lagu dan metadata muzik PoySic.
 */

export interface Track {
  id: string;
  name: string;
  artist_name: string;
  album_name: string;
  duration: number; // dalam saat
  image: string;
  audio: string;
  license_ccurl?: string;
  genre?: string;
  source?: 'jamendo' | 'audius';
}
