import React from 'react';
import type { MediaItem } from '../../services/tmdb';
import { StarIcon, PlayIcon } from '../common/Icons';

interface MediaCardProps {
  media: MediaItem;
  id?: string;
  scope?: string;
  onSelect: (media: MediaItem) => void;
  onPlay?: (media: MediaItem) => void;
  className?: string;
  priority?: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  id,
  scope = 'main',
  onSelect,
  onPlay,
  className = '',
  priority = false
}) => {
  const isBollywood = media.genre?.toLowerCase().includes('bollywood') || media.genre?.toLowerCase().includes('hindi');
  const isAnime = media.genre?.toLowerCase().includes('anime') || media.genre?.toLowerCase().includes('animation');

  // If width is provided in className (e.g. w-full in grid), do not force fixed row width
  const widthClasses = className.includes('w-') ? '' : 'w-44 sm:w-52 md:w-60 shrink-0';

  return (
    <div
      id={id}
      data-tv-nav="true"
      data-tv-scope={scope}
      tabIndex={0}
      onClick={() => onSelect(media)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.keyCode === 13 || e.keyCode === 66) {
          e.preventDefault();
          onSelect(media);
        }
      }}
      className={`tv-focus-target group relative ${widthClasses} rounded-2xl overflow-hidden bg-brand-card border border-brand-border cursor-pointer transition-all duration-200 select-none shadow-md ${className}`}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0d1017]">
        <img
          src={media.poster}
          alt={media.title}
          loading={priority ? 'eager' : 'lazy'}
          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />

        {/* Cinematic bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-card via-transparent to-black/20 opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          {/* Genre / Region / New Release Pill */}
          {isBollywood ? (
            <span className="px-2 py-0.5 rounded-md bg-amber-600/90 backdrop-blur-md text-[10px] font-black text-black uppercase tracking-wider shadow">
              🇮🇳 Desi
            </span>
          ) : isAnime ? (
            <span className="px-2 py-0.5 rounded-md bg-pink-600/90 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-wider shadow">
              🌸 Anime
            </span>
          ) : media.isNewRelease ? (
            <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-wider shadow">
              ✨ NEW
            </span>
          ) : media.trending ? (
            <span className="px-2 py-0.5 rounded-md bg-brand-accent text-[10px] font-black text-white uppercase tracking-wider shadow">
              🔥 HOT
            </span>
          ) : <span />}

          {/* Rating Badge */}
          <div className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-amber-400 font-bold text-[11px] flex items-center space-x-1 shadow-md">
            <StarIcon size={11} className="fill-amber-400 text-amber-400" />
            <span>{media.rating > 0 ? media.rating : '7.5'}</span>
          </div>
        </div>

        {/* Play Icon Reveal on Focus/Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 bg-black/40 backdrop-blur-[2px]">
          <div 
            onClick={(e) => {
              if (onPlay) {
                e.stopPropagation();
                onPlay(media);
              }
            }}
            className="w-12 h-12 rounded-full bg-brand-accent text-white flex items-center justify-center shadow-cinema-glow transform transition-transform group-hover:scale-110 group-focus:scale-110"
            title="Play Immediately"
          >
            <PlayIcon size={20} className="fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Card Info Bar */}
      <div className="p-3.5 sm:p-4 bg-brand-card">
        <h3 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-brand-accent transition-colors duration-150">
          {media.title}
        </h3>
        <div className="flex items-center justify-between mt-1 text-[11px] text-brand-muted font-medium">
          <span className="flex items-center space-x-1.5">
            <span>{media.year || '2024'}</span>
            {media.isNewRelease && (
              <span className="text-[10px] font-bold text-emerald-400">● Fresh</span>
            )}
          </span>
          <span className="px-1.5 py-0.2 rounded bg-white/5 uppercase text-[10px] text-gray-400 font-semibold tracking-wider">
            {media.type === 'movie' ? 'Movie' : 'Series'}
          </span>
        </div>
      </div>
    </div>
  );
};
