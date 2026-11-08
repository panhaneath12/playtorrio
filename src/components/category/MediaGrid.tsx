import React from 'react';
import type { MediaItem } from '../../services/tmdb';
import { MediaCard } from '../catalog/MediaCard';

interface MediaGridProps {
  items: MediaItem[];
  onSelectMedia: (media: MediaItem) => void;
  onPlayMedia?: (media: MediaItem) => void;
  isLoading?: boolean;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  onSelectMedia,
  onPlayMedia,
  isLoading = false
}) => {
  if (items.length === 0 && !isLoading) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center text-center select-none bg-brand-surface/30 rounded-3xl border border-brand-border">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">
          🎬
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Titles Found</h3>
        <p className="text-sm text-brand-muted max-w-md">
          We couldn't find any titles matching your selected filters or search keywords. Try selecting "All" genres or resetting the search query.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 
        Responsive Cinema Poster Grid:
        - Mobile: 2-3 columns
        - Tablet: 3-4 columns
        - Desktop: 5-6 columns
        - Android TV & Ultra-wide (1080p / 4K): 7-9 columns
      */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-5 gap-y-8 sm:gap-x-6 sm:gap-y-9 md:gap-x-7 md:gap-y-10 lg:gap-x-8 lg:gap-y-12">
        {items.map((item, idx) => (
          <MediaCard
            key={`grid-${item.id}-${idx}`}
            id={`grid-card-${item.id}-${idx}`}
            media={item}
            scope="main"
            className="w-full"
            onSelect={onSelectMedia}
            onPlay={onPlayMedia}
            priority={idx < 8}
          />
        ))}

        {/* Skeleton Placeholders when loading more */}
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="w-full aspect-[2/3] rounded-2xl bg-brand-card/60 border border-brand-border animate-pulse overflow-hidden flex flex-col justify-end p-3"
            >
              <div className="w-3/4 h-3 bg-white/10 rounded mb-2" />
              <div className="w-1/2 h-2.5 bg-white/5 rounded" />
            </div>
          ))}
      </div>
    </div>
  );
};
