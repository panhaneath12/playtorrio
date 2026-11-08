import React from 'react';
import { RefreshIcon } from '../common/Icons';

interface LoadMoreButtonProps {
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  error?: string | null;
}

export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  isLoading,
  hasMore,
  onLoadMore,
  error
}) => {
  if (!hasMore && !isLoading) {
    return (
      <div className="w-full py-12 flex items-center justify-center text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-muted bg-white/5 px-4 py-2 rounded-full border border-white/5">
          ✓ All Available Titles Loaded
        </span>
      </div>
    );
  }

  return (
    <div className="w-full py-10 flex flex-col items-center justify-center gap-3">
      {error && (
        <p className="text-xs text-rose-400 font-bold mb-1">
          {error}
        </p>
      )}

      <button
        id="btn-load-more"
        data-tv-nav="true"
        data-tv-scope="main"
        onClick={onLoadMore}
        disabled={isLoading}
        className={`tv-focus-target group px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 flex items-center space-x-2.5 shadow-cinema-glow ${
          isLoading
            ? 'bg-brand-surface text-brand-muted border border-brand-border cursor-wait'
            : 'bg-brand-accent hover:bg-brand-accent-hover text-white active:scale-95'
        }`}
      >
        <RefreshIcon
          size={16}
          className={`${isLoading ? 'animate-spin text-brand-accent' : 'group-hover:rotate-180 transition-transform duration-500'}`}
        />
        <span>{isLoading ? 'Fetching More Titles...' : 'Load More Titles'}</span>
      </button>
    </div>
  );
};
