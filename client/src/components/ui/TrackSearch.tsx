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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari trek Jamendo CC (cth: lofi, chill, acoustic, jazz)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 transition"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 text-xs sm:text-sm"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span className="hidden sm:inline">Cari</span>
        </button>
      </form>

      {/* Bar Kategori Genre */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {GENRE_CATEGORIES.map((genre) => (
          <button
            key={genre}
            type="button"
            onClick={() => filterByGenre(genre)}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition ${
              selectedGenre === genre
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Senarai Hasil Lagu */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
        {searchResults.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2">
            <Disc className="w-8 h-8 text-slate-600 animate-pulse" />
            <p>Tiada trek ditemui untuk carian tersebut.</p>
            <button
              onClick={() => filterByGenre('Semua')}
              className="text-emerald-400 hover:underline text-xs mt-1"
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
                className={`group flex items-center justify-between p-2.5 rounded-xl border transition ${
                  isCurrent
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-slate-900/60 hover:bg-slate-855 border-slate-800/80'
                }`}
              >
                {/* Info Album & Lagu */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800 border border-slate-700">
                    <img
                      src={track.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80'}
                      alt={track.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-emerald-950/60 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xs sm:text-sm font-semibold truncate ${
                        isCurrent ? 'text-emerald-400' : 'text-slate-200'
                      }`}>
                        {track.name}
                      </h4>
                      {track.genre && (
                        <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {track.genre}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {track.artist_name} {track.album_name ? `• ${track.album_name}` : ''}
                    </p>
                  </div>
                </div>

                {/* Butang Kawalan (Tambah & Main) */}
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                    {formatDuration(track.duration)}
                  </span>

                  <button
                    onClick={() => handleQueueClick(track)}
                    title="Tambah ke Giliran (Queue)"
                    className={`p-2 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                      isJustAdded
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline text-[11px]">
                      {isJustAdded ? 'Ditambah!' : 'Queue'}
                    </span>
                  </button>

                  <button
                    onClick={() => onPlayTrack(track)}
                    title="Mainkan Sekarang dalam Bilik"
                    className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition font-semibold"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2">
        <span>Semua lagu di bawah lesen Jamendo Creative Commons (CC BY).</span>
        <a
          href="https://www.jamendo.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:underline flex items-center gap-1"
        >
          <span>Jamendo</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
