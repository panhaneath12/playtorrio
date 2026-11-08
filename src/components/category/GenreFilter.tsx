import React from 'react';
import type { GenreOption } from '../../config/categoryConfig';

interface GenreFilterProps {
  genres: GenreOption[];
  selectedGenreId: number;
  onSelectGenre: (genreId: number) => void;
}

export const GenreFilter: React.FC<GenreFilterProps> = ({
  genres,
  selectedGenreId,
  onSelectGenre
}) => {
  return (
    <div className="w-full flex items-center space-x-2 overflow-x-auto pb-3 pt-1 scroll-smooth select-none no-scrollbar">
      <span className="text-[11px] uppercase font-black text-brand-muted shrink-0 mr-1.5 tracking-wider">
        Genre:
      </span>
      {genres.map((genre) => {
        const isSelected = selectedGenreId === genre.id;
        return (
          <button
            key={genre.id}
            id={`genre-filter-${genre.id}`}
            data-tv-nav="true"
            data-tv-scope="main"
            onClick={() => onSelectGenre(genre.id)}
            className={`tv-focus-target px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
              isSelected
                ? 'bg-brand-accent text-white shadow-cinema-glow ring-2 ring-white/40 transform scale-105'
                : 'bg-brand-card text-brand-muted hover:text-white hover:bg-white/10 border border-brand-border'
            }`}
          >
            {genre.name}
          </button>
        );
      })}
    </div>
  );
};
