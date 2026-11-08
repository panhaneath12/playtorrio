import React, { useRef } from 'react';
import type { MediaItem } from '../../services/tmdb';
import { MediaCard } from './MediaCard';

interface MediaRowProps {
  title: string;
  items: MediaItem[];
  onSelectMedia: (media: MediaItem) => void;
  onPlayMedia?: (media: MediaItem) => void;
  onSeeAll?: () => void;
  rowId: string;
  badge?: string;
}

export const MediaRow: React.FC<MediaRowProps> = ({
  title,
  items,
  onSelectMedia,
  onPlayMedia,
  onSeeAll,
  rowId,
  badge
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="mb-10 sm:mb-12 md:mb-14 px-4 sm:px-8 md:px-14">
      {/* Row Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{title}</span>
          </h2>
          {badge && (
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-brand-accent/20 text-brand-accent border border-brand-accent/30 text-xs font-bold uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {onSeeAll && (
            <button
              data-tv-nav="true"
              data-tv-scope="main"
              onClick={onSeeAll}
              className="tv-focus-target group flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-brand-card hover:bg-brand-accent text-white text-xs font-bold border border-brand-border hover:border-brand-accent transition shadow-sm"
              title={`Browse all ${title}`}
            >
              <span>See All</span>
              <span className="transform transition-transform group-hover:translate-x-1 font-black">→</span>
            </button>
          )}

          <span className="text-[11px] text-brand-muted font-bold uppercase tracking-wider mr-2 hidden sm:inline">
            {items.length} Titles
          </span>
          {/* Desktop Arrow Controls (Hidden on TV to keep UI clean) */}
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex w-8 h-8 rounded-full bg-brand-surface hover:bg-white/10 text-white items-center justify-center border border-brand-border transition opacity-70 hover:opacity-100"
            aria-label="Scroll left">
            <span className="text-base font-bold">←</span>
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex w-8 h-8 rounded-full bg-brand-surface hover:bg-white/10 text-white items-center justify-center border border-brand-border transition opacity-70 hover:opacity-100"
            aria-label="Scroll right">
            <span className="text-base font-bold">→</span>
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Shelf */}
      <div
        ref={rowRef}
        className="flex gap-5 sm:gap-6 md:gap-7 overflow-x-auto py-5 sm:py-6 px-2 sm:px-3 scroll-smooth focus:outline-none no-scrollbar"
      >
        {items.map((item, idx) => (
          <MediaCard
            key={`${rowId}-${item.id}-${idx}`}
            id={`card-${rowId}-${idx}`}
            media={item}
            scope="main"
            onSelect={onSelectMedia}
            onPlay={onPlayMedia}
            priority={idx < 4}
          />
        ))}
      </div>
    </section>
  );
};
