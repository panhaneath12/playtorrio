import React from 'react';
import type { TvCategory } from '../../modules/live-tv/types';

interface CategorySelectorProps {
  categories: TvCategory[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  scope?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  scope = 'livetv'
}) => {
  return (
    <div className="w-full flex items-center space-x-2 overflow-x-auto py-1 scroll-smooth select-none">
      <span className="text-[11px] uppercase font-extrabold text-brand-muted shrink-0 mr-1 tracking-wider">
        Category:
      </span>
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        return (
          <button
            key={cat.id}
            id={`category-pill-${cat.id}`}
            data-tv-nav="true"
            data-tv-scope={scope}
            onClick={() => onSelectCategory(cat.id)}
            className={`tv-focus-target px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
              isSelected
                ? 'bg-brand-accent text-white shadow-cinema-glow ring-2 ring-white/30'
                : 'bg-brand-card text-brand-muted hover:text-white hover:bg-white/10 border border-brand-border'
            }`}
          >
            {cat.icon && <span>{cat.icon}</span>}
            <span>{cat.name}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              isSelected ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-400'
            }`}>
              {cat.channelCount}
            </span>
          </button>
        );
      })}
    </div>
  );
};
