import React, { useEffect, useState } from 'react';
import { 
  getPlaybackHistory, 
  removeFromPlaybackHistory, 
  toMediaItem 
} from '../../services/history';
import type { PlaybackRecord } from '../../services/history';
import type { MediaItem } from '../../services/tmdb';
import { PlayIcon, CloseIcon } from '../common/Icons';

interface ContinueWatchingRowProps {
  onResume: (media: MediaItem, season?: number, episode?: number) => void;
  onSelectMedia: (media: MediaItem) => void;
}

export const ContinueWatchingRow: React.FC<ContinueWatchingRowProps> = ({
  onResume,
  onSelectMedia
}) => {
  const [history, setHistory] = useState<PlaybackRecord[]>([]);

  const loadHistory = () => {
    setHistory(getPlaybackHistory());
  };

  useEffect(() => {
    loadHistory();

    const handleUpdate = () => loadHistory();
    window.addEventListener('playtorrio_history_updated', handleUpdate);
    return () => window.removeEventListener('playtorrio_history_updated', handleUpdate);
  }, []);

  if (history.length === 0) return null;

  return (
    <section className="mb-12 sm:mb-14 px-4 sm:px-8 md:px-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Continue Watching
          </h2>
          <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-brand-muted text-xs font-bold">
            {history.length} in Progress
          </span>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div className="flex gap-5 sm:gap-6 md:gap-7 overflow-x-auto py-5 px-2 scroll-smooth no-scrollbar">
        {history.map((record, idx) => {
          const media = toMediaItem(record);
          const minutesLeft = Math.max(1, Math.round((record.duration - record.currentTime) / 60));

          return (
            <div
              key={`continue-${record.id}-${idx}`}
              id={`continue-card-${idx}`}
              data-tv-nav="true"
              data-tv-scope="main"
              tabIndex={0}
              onClick={() => onResume(media, record.season, record.episode)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.keyCode === 13 || e.keyCode === 66) {
                  e.preventDefault();
                  onResume(media, record.season, record.episode);
                }
              }}
              className="tv-focus-target group relative w-64 sm:w-72 md:w-80 shrink-0 rounded-2xl overflow-hidden bg-brand-card border border-brand-border cursor-pointer transition-all duration-200 select-none shadow-tv-card"
            >
              {/* Widescreen 16:9 Backdrop Art */}
              <div className="relative aspect-video w-full overflow-hidden bg-brand-surface">
                <img
                  src={record.backdrop || record.poster}
                  alt={record.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-brand-card via-black/30 to-black/40" />

                {/* Remove button */}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    const updated = removeFromPlaybackHistory(record.id);
                    setHistory(updated);
                  }}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/70 hover:bg-brand-accent text-white flex items-center justify-center transition border border-white/10 opacity-70 hover:opacity-100 z-10"
                  title="Remove from history"
                >
                  <CloseIcon size={14} />
                </button>

                {/* Central Play/Resume Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-brand-accent/90 group-hover:bg-brand-accent text-white flex items-center justify-center shadow-cinema-glow transform transition-transform group-hover:scale-110">
                    <PlayIcon size={20} className="fill-white ml-0.5" />
                  </div>
                </div>

                {/* Episode or Badge Indicator */}
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs font-bold text-white">
                  <span>
                    {record.type === 'tv' && record.season && record.episode
                      ? `S${record.season} E${record.episode}`
                      : 'Movie'}
                  </span>
                  <span className="text-[11px] text-gray-300 font-medium">
                    {minutesLeft}m left
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-gray-800">
                <div
                  className="h-full bg-brand-accent transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(5, record.progress))}%` }}
                />
              </div>

              {/* Card Footer */}
              <div className="p-3 bg-brand-card flex items-center justify-between">
                <div className="truncate mr-2">
                  <h3 className="font-bold text-sm text-white truncate group-hover:text-brand-accent transition-colors">
                    {record.title}
                  </h3>
                  <p className="text-[11px] text-brand-muted truncate">
                    {record.genre} • {record.year}
                  </p>
                </div>

                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMedia(media);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-gray-300 border border-white/5 shrink-0"
                >
                  Info
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
