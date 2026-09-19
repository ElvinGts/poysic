/**
 * client/src/components/queue/QueueList.tsx
 * Tujuan: Pengurusan senarai giliran lagu (Queue) bilik dengan auto-advance dan buang lagu.
 */
import React from 'react';
import { ListMusic, Play, Trash2, XCircle, Disc, Sparkles } from 'lucide-react';
import { Track } from '../../types';

interface QueueListProps {
  queue: Track[];
  currentTrack: Track | null;
  isHost: boolean;
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (trackId: string) => void;
  onClearQueue: () => void;
  onSwitchToSearch: () => void;
}

export const QueueList: React.FC<QueueListProps> = ({
  queue,
  currentTrack,
  isHost,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue,
  onSwitchToSearch,
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Tajuk & Aksi */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-white text-sm">
            Senarai Giliran ({queue.length})
          </h3>
        </div>

        {queue.length > 0 && isHost && (
          <button
            onClick={onClearQueue}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Kosongkan</span>
          </button>
        )}
      </div>

      {/* Trek Semasa Dimainkan */}
      {currentTrack && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 relative">
              <img
                src={currentTrack.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80'}
                alt={currentTrack.name}
                className="w-full h-full object-cover animate-spin-slow"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Sedang Dimainkan
              </span>
              <h4 className="text-xs font-semibold text-white truncate">
                {currentTrack.name}
              </h4>
              <p className="text-[11px] text-slate-400 truncate">
                {currentTrack.artist_name}
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono text-emerald-400/80">
            {formatDuration(currentTrack.duration)}
          </span>
        </div>
      )}

      {/* Senarai Menunggu */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[250px]">
        {queue.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-3">
            <Disc className="w-8 h-8 text-slate-600 animate-pulse" />
            <p>Senarai giliran kosong.</p>
            <p className="text-slate-400 text-[11px] max-w-xs">
              Lagu akan dimainkan secara automatik mengikut susunan giliran sebaik sahaja lagu semasa tamat.
            </p>
            <button
              onClick={onSwitchToSearch}
              className="mt-2 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-medium text-xs transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>Cari & Tambah Lagu</span>
            </button>
          </div>
        ) : (
          queue.map((track, idx) => (
            <div
              key={`${track.id}-${idx}`}
              className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 transition"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-5 text-center font-mono text-xs text-slate-500">
                  {idx + 1}
                </span>
                <div className="w-9 h-9 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0">
                  <img
                    src={track.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80'}
                    alt={track.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-medium text-slate-200 truncate">
                    {track.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {track.artist_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                  {formatDuration(track.duration)}
                </span>

                <button
                  onClick={() => onPlayTrack(track)}
                  title="Mainkan Sekarang"
                  className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 rounded-lg transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>

                <button
                  onClick={() => onRemoveFromQueue(track.id)}
                  title="Buang dari Senarai Giliran"
                  className="p-1.5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-lg transition"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-2 flex items-center justify-between">
        <span>Auto-Play seterusnya diaktifkan secara tersinkron.</span>
      </div>
    </div>
  );
};
