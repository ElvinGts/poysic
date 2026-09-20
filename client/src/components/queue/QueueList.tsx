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
      <div className="flex items-center justify-between border-b border-[#222222] pb-3">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-[#FF4D2E]" />
          <h3 className="font-bold text-[#F5F3EE] text-sm font-mono uppercase tracking-wider">
            Senarai Giliran ({queue.length})
          </h3>
        </div>

        {queue.length > 0 && isHost && (
          <button
            onClick={onClearQueue}
            aria-label="Kosongkan senarai giliran"
            className="text-xs text-[#FF4D2E] hover:underline flex items-center gap-1 font-mono transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>KOSONGKAN</span>
          </button>
        )}
      </div>

      {/* Trek Semasa Dimainkan */}
      {currentTrack && (
        <div className="bg-[#1C120C] border border-[#FF4D2E]/60 rounded-none p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-none bg-[#1A1A1A] border border-[#2E2E2E] overflow-hidden flex-shrink-0 relative">
              <img
                src={currentTrack.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80'}
                alt={currentTrack.name}
                className="w-full h-full object-cover animate-spin-slow"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A8E6CF]">
                SEDANG DIMAINKAN
              </span>
              <h4 className="text-xs font-semibold text-[#F5F3EE] truncate">
                {currentTrack.name}
              </h4>
              <p className="text-[11px] text-[#8E8E8A] truncate font-mono">
                {currentTrack.artist_name}
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono text-[#A8E6CF]">
            {formatDuration(currentTrack.duration)}
          </span>
        </div>
      )}

      {/* Senarai Menunggu */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[250px]">
        {queue.length === 0 ? (
          <div className="text-center py-12 text-[#8E8E8A] text-xs flex flex-col items-center gap-3">
            <Disc className="w-8 h-8 text-[#555555] animate-pulse" />
            <p className="font-mono">Senarai giliran kosong.</p>
            <p className="text-[#8E8E8A] text-[11px] max-w-xs font-mono">
              Lagu akan dimainkan secara automatik mengikut susunan giliran sebaik sahaja lagu semasa tamat.
            </p>
            <button
              onClick={onSwitchToSearch}
              aria-label="Cari dan tambah lagu ke giliran"
              className="mt-2 px-3.5 py-1.5 bg-[#FF4D2E] hover:bg-[#ff6145] text-[#0A0A0A] rounded-none font-bold text-xs font-mono transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>CARI & TAMBAH LAGU</span>
            </button>
          </div>
        ) : (
          queue.map((track, idx) => (
            <div
              key={`${track.id}-${idx}`}
              className="group flex items-center justify-between p-2.5 rounded-none bg-[#111111] hover:bg-[#161616] border border-[#242424] transition"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-5 text-center font-mono text-xs text-[#8E8E8A]">
                  {idx + 1}
                </span>
                <div className="w-9 h-9 rounded-none bg-[#1A1A1A] border border-[#2E2E2E] overflow-hidden flex-shrink-0">
                  <img
                    src={track.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80'}
                    alt={track.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-medium text-[#F5F3EE] truncate">
                    {track.name}
                  </h4>
                  <p className="text-[11px] text-[#8E8E8A] truncate font-mono">
                    {track.artist_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <span className="text-[11px] font-mono text-[#8E8E8A] hidden sm:inline">
                  {formatDuration(track.duration)}
                </span>

                <button
                  onClick={() => onPlayTrack(track)}
                  title="Mainkan Sekarang"
                  aria-label={`Mainkan sekarang: ${track.name}`}
                  className="p-1.5 bg-[#FF4D2E] hover:bg-[#ff6145] text-[#0A0A0A] rounded-none transition font-bold"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>

                <button
                  onClick={() => onRemoveFromQueue(track.id)}
                  title="Buang dari Senarai Giliran"
                  aria-label={`Buang ${track.name} daripada senarai giliran`}
                  className="p-1.5 text-[#8E8E8A] hover:text-[#FF4D2E] hover:bg-[#2A1412] border border-transparent hover:border-[#3D1A16] rounded-none transition"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-[11px] font-mono text-[#8E8E8A] border-t border-[#222222] pt-2 flex items-center justify-between">
        <span>Auto-Play seterusnya diaktifkan secara tersinkron.</span>
      </div>
    </div>
  );
};
