/**
 * client/src/components/ui/TrackSearch.tsx
 * Tujuan: Komponen carian lagu Jamendo berlesen Creative Commons dengan penapis genre pantas.
 */
import React, { useState } from 'react';
import { Search, Play, Plus, Loader2, Disc, ExternalLink } from 'lucide-react';
import { Track } from '../../types';
import { GENRE_CATEGORIES, CURATED_TRACKS } from '../../data/curatedTracks';

interface TrackSearchProps {
  currentTrackId?: string;
  onPlayTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onSearchJamendo: (query: string) => Promise<Track[]>;
}

export const TrackSearch: React.FC<TrackSearchProps> = ({
  currentTrackId,
  onPlayTrack,
  onAddToQueue,
  onSearchJamendo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Semua');
  const [searchResults, setSearchResults] = useState<Track[]>(CURATED_TRACKS);
  const [isSearching, setIsSearching] = useState(false);
  const [addedTrackId, setAddedTrackId] = useState<string | null>(null);

  const filterByGenre = (genre: string) => {
    setSelectedGenre(genre);
    if (genre === 'Semua') {
      setSearchResults(CURATED_TRACKS);
    } else {
      const filtered = CURATED_TRACKS.filter((t) => t.genre === genre);
      setSearchResults(filtered.length > 0 ? filtered : CURATED_TRACKS);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      filterByGenre(selectedGenre);
      return;
    }

    setIsSearching(true);
    try {
      const results = await onSearchJamendo(searchQuery.trim());
      setSearchResults(results);
    } catch (err) {
      console.warn('Carian gagal:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQueueClick = (track: Track) => {
    onAddToQueue(track);
    setAddedTrackId(track.id);
    setTimeout(() => {
      setAddedTrackId(null);
    }, 1500);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Borang Carian Jamendo */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E8A]" />
          <input
            type="text"
            placeholder="Cari trek Jamendo CC (cth: lofi, chill, acoustic, jazz)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Cari trek Jamendo Creative Commons"
            className="w-full bg-[#0C0C0C] border border-[#242424] focus:border-[#FF4D2E] focus:outline-none rounded-none pl-9 pr-3 py-2 text-xs font-mono text-[#F5F3EE] placeholder-[#666666] transition"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          aria-label="Cari trek audio"
          className="min-h-[44px] bg-[#FF4D2E] hover:bg-[#ff6145] disabled:opacity-50 text-[#0A0A0A] font-bold px-4 py-2 rounded-none transition flex items-center justify-center gap-1.5 text-xs font-mono"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span className="hidden sm:inline">CARI</span>
        </button>
      </form>

      {/* Bar Kategori Genre */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {GENRE_CATEGORIES.map((genre) => (
          <button
            key={genre}
            type="button"
            onClick={() => filterByGenre(genre)}
            aria-label={`Tapis mengikut genre ${genre}`}
            className={`min-h-[44px] px-3.5 py-2 text-xs font-mono rounded-none whitespace-nowrap transition border flex items-center justify-center ${
              selectedGenre === genre
                ? 'bg-[#FF4D2E] text-[#0A0A0A] border-[#FF4D2E] font-bold'
                : 'bg-[#141414] hover:bg-[#1C1C1C] text-[#8E8E8A] hover:text-[#F5F3EE] border-[#262626]'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Senarai Hasil Lagu */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
        {searchResults.length === 0 ? (
          <div className="text-center py-12 text-[#8E8E8A] text-xs flex flex-col items-center gap-2">
            <Disc className="w-8 h-8 text-[#555555] animate-pulse" />
            <p className="font-mono">Tiada trek ditemui untuk carian tersebut.</p>
            <button
              onClick={() => filterByGenre('Semua')}
              className="min-h-[44px] text-[#FF4D2E] hover:underline text-xs mt-1 font-mono flex items-center"
            >
              Kembali ke senarai pilihan popular
            </button>
          </div>
        ) : (
          searchResults.map((track) => {
            const isCurrent = currentTrackId === track.id;
            const isJustAdded = addedTrackId === track.id;

            return (
              <div
                key={track.id}
                className={`group flex items-center justify-between p-2.5 rounded-none border transition ${
                  isCurrent
                    ? 'bg-[#1C120C] border-[#FF4D2E]/60'
                    : 'bg-[#111111] hover:bg-[#161616] border-[#242424]'
                }`}
              >
                {/* Info Album & Lagu */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-11 h-11 rounded-none overflow-hidden flex-shrink-0 bg-[#1A1A1A] border border-[#2E2E2E]">
                    <img
                      src={track.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80'}
                      alt={track.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-[#0A0A0A]/70 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-[#FF4D2E] rounded-full animate-ping" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xs sm:text-sm font-semibold truncate ${
                        isCurrent ? 'text-[#FF4D2E]' : 'text-[#F5F3EE]'
                      }`}>
                        {track.name}
                      </h4>
                      {track.genre && (
                        <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-none bg-[#1A1A1A] text-[#A8E6CF] border border-[#2A2A2A]">
                          {track.genre}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#8E8E8A] truncate mt-0.5 font-mono">
                      {track.artist_name} {track.album_name ? `• ${track.album_name}` : ''}
                    </p>
                  </div>
                </div>

                {/* Butang Kawalan (Tambah & Main) */}
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <span className="text-[11px] font-mono text-[#8E8E8A] hidden sm:inline">
                    {formatDuration(track.duration)}
                  </span>

                  <button
                    onClick={() => handleQueueClick(track)}
                    title="Tambah ke Giliran (Queue)"
                    aria-label={`Tambah ${track.name} ke senarai giliran`}
                    className={`min-h-[44px] min-w-[44px] p-2.5 rounded-none text-xs font-mono transition flex items-center justify-center gap-1 border ${
                      isJustAdded
                        ? 'bg-[#A8E6CF] text-[#0A0A0A] border-[#A8E6CF] font-bold'
                        : 'bg-[#171717] hover:bg-[#222222] text-[#A0A09C] hover:text-[#F5F3EE] border-[#2A2A2A]'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline text-[10px]">
                      {isJustAdded ? 'DITAMBAH' : 'QUEUE'}
                    </span>
                  </button>

                  <button
                    onClick={() => onPlayTrack(track)}
                    title="Mainkan Sekarang dalam Bilik"
                    aria-label={`Mainkan trek ${track.name}`}
                    className="min-h-[44px] min-w-[44px] p-2.5 bg-[#FF4D2E] hover:bg-[#ff6145] text-[#0A0A0A] rounded-none transition font-bold flex items-center justify-center"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-[11px] font-mono text-[#8E8E8A] flex items-center justify-between border-t border-[#222222] pt-2">
        <span>Lesen Jamendo Creative Commons (CC BY).</span>
        <a
          href="https://www.jamendo.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#A8E6CF] hover:underline flex items-center gap-1"
        >
          <span>Jamendo</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
