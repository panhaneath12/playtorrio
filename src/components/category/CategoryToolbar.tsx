import React from 'react';
import { SearchIcon, CloseIcon } from '../common/Icons';
import type { SortOption } from '../../config/categoryConfig';

interface CategoryToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortOptions: SortOption[];
  selectedSort: 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc' | 'title.asc';
  onSortChange: (sortId: 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc' | 'title.asc') => void;
  totalDisplayCount: number;
}

export const CategoryToolbar: React.FC<CategoryToolbarProps> = ({
  searchQuery,
  onSearchChange,
  sortOptions,
  selectedSort,
  onSortChange,
  totalDisplayCount
}) => {
  return (
    <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 py-3 mb-5 border-y border-brand-border bg-brand-surface/40 px-3 sm:px-4 rounded-2xl">
      {/* 1. Category Search Input */}
      <div className="relative flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-muted">
          <SearchIcon size={16} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search within this category..."
          data-tv-nav="true"
          data-tv-scope="main"
          className="tv-focus-target w-full pl-10 pr-9 py-2 rounded-xl bg-brand-card text-white text-xs sm:text-sm font-medium border border-brand-border placeholder-gray-500 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
            title="Clear search"
          >
            <CloseIcon size={14} />
          </button>
        )}
      </div>

      {/* 2. Sort Pills / Selector & Result Count */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] uppercase font-bold text-brand-muted shrink-0 mr-1 hidden lg:inline">
          Sort By:
        </span>
        {sortOptions.map((opt) => {
          const isSelected = selectedSort === opt.id;
          return (
            <button
              key={opt.id}
              data-tv-nav="true"
              data-tv-scope="main"
              onClick={() => onSortChange(opt.id)}
              className={`tv-focus-target px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                isSelected
                  ? 'bg-brand-accent text-white shadow-cinema-glow'
                  : 'bg-brand-card hover:bg-white/10 text-gray-300 border border-brand-border'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
        <span className="text-[11px] text-brand-muted font-bold ml-2 shrink-0 hidden sm:inline">
          ({totalDisplayCount} titles)
        </span>
      </div>
    </div>
  );
};
