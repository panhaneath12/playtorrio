import React from 'react';
import type { MediaItem } from '../../services/tmdb';
import { PlayIcon, InfoIcon, StarIcon, ServerIcon } from '../common/Icons';

interface HeroBannerProps {
  media: MediaItem;
  onPlay: (media: MediaItem) => void;
  onMoreInfo: (media: MediaItem) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  media,
  onPlay,
  onMoreInfo
}) => {
  return (
    <div className="relative w-full h-[65vh] sm:h-[72vh] md:h-[78vh] max-h-[820px] mb-8 overflow-hidden select-none">
      {/* 1. Backdrop Artwork with Multi-Layer Gradients */}
      <img
        src={media.backdrop || media.poster}
        alt={media.title}
        className="absolute inset-0 w-full h-full object-cover object-center md:object-top opacity-70 transform scale-[1.02] transition-transform duration-700 ease-out"
        loading="eager"
      />

      {/* Cinematic Vignettes */}
      {/* Bottom to Top Blend into Page */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/75 to-transparent" />
      {/* Left to Right Readability Shade */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-bg via-brand-bg/85 to-transparent max-w-4xl" />
      {/* Top Subtle Shade for Navbar Blend */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-brand-bg/90 to-transparent" />

      {/* 2. Hero Content Container */}
      <div className="relative z-10 h-full flex flex-col justify-end px-4 sm:px-8 md:px-14 pb-12 sm:pb-16 max-w-4xl">
        {/* Badges Bar */}
        <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
          <span className="px-3 py-1 rounded-full bg-brand-accent text-white font-black text-xs uppercase tracking-widest shadow-cinema-glow">⭐ FEATURED #1</span>

          {media.isNewRelease && (
            <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider backdrop-blur-md shadow-md flex items-center space-x-1">
              <span>🔥 NEW RELEASE</span>
            </span>
          )}

          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-400 font-bold text-xs border border-white/10 shadow">
            <StarIcon size={13} className="fill-amber-400 text-amber-400" />
            <span>{media.rating > 0 ? media.rating : '8.2'}</span>
          </span>

          <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-gray-200 text-xs font-semibold backdrop-blur-sm">
            {media.year || '2024'}
          </span>

          <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-gray-200 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            {media.type === 'movie' ? 'Movie' : 'TV Series'}
          </span>

          <span className="text-brand-muted font-bold text-xs">
            {media.genre}
          </span>
        </div>

        {/* Cinematic Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none mb-4 drop-shadow-2xl">
          {media.title}
        </h1>

        {/* Overview Synopsis */}
        <p className="text-gray-200/90 text-sm sm:text-base md:text-lg leading-relaxed line-clamp-3 mb-6 sm:mb-8 max-w-2xl drop-shadow font-normal">
          {media.overview}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3.5 sm:gap-4">
          <button
            id="hero-play-btn"
            data-tv-nav="true"
            data-tv-scope="main"
            onClick={() => onPlay(media)}
            className="tv-focus-target px-8 py-3.5 sm:py-4 rounded-2xl bg-brand-accent hover:bg-brand-accent-hover text-white font-extrabold text-base sm:text-lg flex items-center space-x-3 shadow-cinema-glow transition-transform active:scale-95"
          >
            <PlayIcon size={22} className="fill-white" />
            <span>Play Now</span>
          </button>

          <button
            id="hero-info-btn"
            data-tv-nav="true"
            data-tv-scope="main"
            onClick={() => onMoreInfo(media)}
            className="tv-focus-target px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm sm:text-base flex items-center space-x-2.5 border border-white/20 backdrop-blur-md transition-colors"
          >
            <InfoIcon size={20} className="text-white" />
            <span>More Info</span>
          </button>

          <div className="hidden lg:flex items-center space-x-2 text-xs font-semibold text-gray-300 px-4 py-2 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md">
            <ServerIcon size={15} className="text-emerald-400" />
            <span>12 Streaming Servers & WebTorrent Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
