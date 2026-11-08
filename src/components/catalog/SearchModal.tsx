import React, { useState, useEffect } from 'react';
import { searchMedia } from '../../services/tmdb';
import type { MediaItem } from '../../services/tmdb';
import { SearchIcon, CloseIcon } from '../common/Icons';
import { MediaCard } from './MediaCard';

interface SearchModalProps {
  onSelectMedia: (media: MediaItem) => void;
  onClose: () => void;
}

const QUICK_TRENDING_TAGS = [
  'Queen of Tears',
  'Hidden Love',
  'Squid Game',
  'Dune',
  'Lovely Runner',
  'Deadpool',
  'The Untamed',
  'Interstellar',
  'Attack on Titan',
  'Till The End of The Moon',
  'Crash Landing on You',
  'Stranger Things',
  'RRR'
];

export const SearchModal: React.FC<SearchModalProps> = ({
  onSelectMedia,
  onClose
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchMedia(query);
      setResults(res);
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#08090D]/95 backdrop-blur-xl flex flex-col p-4 sm:p-8 md:p-12 animate-fadeIn overflow-hidden"
      data-tv-scope="search"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-brand-border">
        <div className="flex items-center space-x-4 flex-1 max-w-4xl">
          <div className="relative flex-1">
            <SearchIcon size={24} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies, TV shows, anime, or actors... (Press Esc to close)"
              className="w-full pl-14 pr-12 py-3.5 bg-brand-surface border border-brand-border rounded-2xl text-lg sm:text-xl text-white font-medium focus:outline-none focus:ring-4 focus:ring-brand-accent/50 shadow-inner"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs px-2 py-1 rounded-md bg-white/10"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-5 py-3 rounded-2xl bg-brand-surface hover:bg-white/10 text-white font-bold flex items-center space-x-2 border border-brand-border ml-3 transition hover:scale-105 active:scale-95"
          title="Close Search (Esc)"
        >
          <CloseIcon size={18} />
          <span className="hidden sm:inline">Close</span>
          <kbd className="hidden md:inline px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-gray-400 font-mono">Esc</kbd>
        </button>
      </div>

      {/* Quick Discovery Pills */}
      <div className="py-4 flex items-center space-x-2 overflow-x-auto border-b border-brand-border/40 scroll-smooth">
        <span className="text-[11px] uppercase font-extrabold text-brand-muted shrink-0 mr-1 tracking-wider">
          Popular:
        </span>
        {QUICK_TRENDING_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setQuery(tag)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 ${
              query.toLowerCase() === tag.toLowerCase()
                ? 'bg-brand-accent text-white shadow-cinema-glow'
                : 'bg-brand-card text-brand-muted hover:text-white hover:bg-brand-surface border border-brand-border'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Main Search Results Grid */}
      <div className="flex-1 overflow-y-auto pt-6 pr-1">
        {isSearching ? (
          <div className="h-64 flex flex-col items-center justify-center text-brand-muted font-bold text-lg animate-pulse">
            <span className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin mb-3" />
            <span>Searching 10,000+ titles across TMDB &amp; Streaming Servers...</span>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {results.map((item, idx) => (
              <MediaCard
                key={`search-res-${item.id}-${idx}`}
                id={`search-card-${idx}`}
                media={item}
                scope="search"
                onSelect={onSelectMedia}
                className="w-full"
              />
            ))}
          </div>
        ) : query ? (
          <div className="h-64 flex flex-col items-center justify-center text-brand-muted">
            <p className="text-xl font-bold mb-2 text-white">No matching titles found for &ldquo;{query}&rdquo;</p>
            <p className="text-sm">Try searching for keywords like &ldquo;Dune&rdquo;, &ldquo;Deadpool&rdquo;, &ldquo;RRR&rdquo;, &ldquo;Arcane&rdquo;, or &ldquo;Interstellar&rdquo;</p>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-brand-muted">
            <SearchIcon size={48} className="mb-4 opacity-30 text-brand-accent" />
            <p className="text-base sm:text-lg font-semibold text-white">Search any movie, TV series, or anime</p>
            <p className="text-xs text-gray-500 mt-1">Instant search powered by TMDB &bull; Click any title to stream immediately</p>
          </div>
        )}
      </div>
    </div>
  );
};
