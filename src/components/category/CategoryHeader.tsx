import React from 'react';
import type { MediaItem } from '../../services/tmdb';

interface CategoryHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
  totalCount?: number;
  featuredMedia?: MediaItem | null;
  onBackToHome: () => void;
}

export const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  title,
  subtitle,
  badge,
  totalCount,
  featuredMedia,
  onBackToHome
}) => {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-brand-surface border border-brand-border mb-6 select-none shadow-2xl">
      {/* Background Backdrop Artwork with Multi-Layer Cinematic Gradients */}
      {featuredMedia?.backdrop && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src={featuredMedia.backdrop}
            alt=""
            className="w-full h-full object-cover object-top opacity-30 blur-[2px] transform scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-bg via-brand-bg/90 to-brand-bg/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-surface via-transparent to-black/40" />
        </div>
      )}

      {/* Header Content */}
      <div className="relative z-10 px-6 sm:px-10 py-8 sm:py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          {/* Breadcrumb / Category Tag */}
          <div className="flex items-center space-x-2.5 mb-2.5">
            <button
              data-tv-nav="true"
              data-tv-scope="main"
              onClick={onBackToHome}
              className="tv-focus-target text-xs font-bold text-gray-400 hover:text-white transition flex items-center space-x-1"
              title="Return to Home Screen"
            >
              <span>Home</span>
              <span className="text-gray-600">/</span>
            </button>
            {badge && (
              <span className="px-2.5 py-0.5 rounded-full bg-brand-accent/20 text-brand-accent border border-brand-accent/30 text-[11px] font-black uppercase tracking-wider">
                {badge}
              </span>
            )}
            {totalCount !== undefined && totalCount > 0 && (
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                ● Live TMDB Synced
              </span>
            )}
          </div>

          {/* Large Cinematic Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-2.5">
            {title}
          </h1>

          {/* Subtitle Description */}
          <p className="text-sm sm:text-base text-gray-300 font-medium leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Back / Quick Shortcut Button for TV Remote */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            data-tv-nav="true"
            data-tv-scope="main"
            onClick={onBackToHome}
            className="tv-focus-target px-4 sm:px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-brand-border transition flex items-center space-x-2 shadow-md"
          >
            <span>‹ Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
