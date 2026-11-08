import React, { useState } from 'react';
import type { TvChannel } from '../../modules/live-tv/types';
import { HeartIcon, PlayIcon } from '../common/Icons';

interface ChannelCardProps {
  channel: TvChannel;
  isFavorite: boolean;
  onPlay: (channel: TvChannel) => void;
  onToggleFavorite: (channelId: string) => void;
  scope?: string;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isFavorite,
  onPlay,
  onToggleFavorite,
  scope = 'livetv'
}) => {
  const [imgError, setImgError] = useState(false);

  const streamQuality = channel.streams[0]?.quality || 'HD';
  const categoryLabel = channel.categories[0] || 'General';

  return (
    <div
      id={`channel-card-${channel.id}`}
      data-tv-nav="true"
      data-tv-scope={scope}
      tabIndex={0}
      onClick={() => onPlay(channel)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onPlay(channel);
        }
      }}
      className="tv-focus-target group relative rounded-2xl bg-brand-surface/90 border border-brand-border hover:border-brand-accent/50 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent focus:shadow-cinema-glow transition-all duration-300 overflow-hidden cursor-pointer flex flex-col aspect-[16/10] select-none hover:scale-[1.03] focus:scale-[1.05]"
    >
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090D] via-black/40 to-transparent z-10" />

      {/* Channel Artwork / Logo */}
      <div className="relative w-full h-full flex items-center justify-center p-6 bg-[#0f1017]">
        {channel.logo && !imgError ? (
          <img
            src={channel.logo}
            alt={channel.name}
            onError={() => setImgError(true)}
            className="max-h-20 max-w-[80%] object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-2">
            <span className="text-3xl mb-1">{channel.countryFlag || '📺'}</span>
            <span className="text-white font-bold text-xs line-clamp-1">{channel.name}</span>
          </div>
        )}
      </div>

      {/* Top Badges: LIVE indicator & Favorite Button */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between">
        <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-red-600/90 text-white font-black text-[10px] tracking-wider uppercase shadow-md">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>LIVE</span>
        </span>

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(channel.id);
          }}
          className={`p-1.5 rounded-full transition backdrop-blur-md ${
            isFavorite 
              ? 'bg-brand-accent text-white shadow' 
              : 'bg-black/50 text-gray-300 hover:text-white hover:bg-black/80'
          }`}
          title={isFavorite ? 'Remove Favorite' : 'Add to Favorite'}
        >
          <HeartIcon size={14} filled={isFavorite} />
        </button>
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 flex flex-col justify-end bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="flex items-center space-x-1.5 mb-1">
          <span className="text-sm shrink-0">{channel.countryFlag || '📡'}</span>
          <h4 className="text-white text-xs sm:text-sm font-bold truncate group-hover:text-brand-accent transition-colors">
            {channel.name}
          </h4>
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-300">
          <span className="capitalize font-medium text-brand-muted truncate max-w-[65%]">
            {categoryLabel}
          </span>
          <span className="px-1.5 py-0.2 rounded bg-white/10 text-white font-mono text-[10px] font-bold">
            {streamQuality}
          </span>
        </div>

        {/* Current Program Snippet if available */}
        {channel.currentProgram && (
          <div className="mt-1 pt-1 border-t border-white/10 text-[10px] text-gray-400 truncate flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate">{channel.currentProgram.title}</span>
          </div>
        )}
      </div>

      {/* Hover / Focus Play Overlay Icon */}
      <div className="absolute inset-0 z-15 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity bg-black/40">
        <div className="w-12 h-12 rounded-full bg-brand-accent flex items-center justify-center shadow-cinema-glow transform scale-90 group-hover:scale-100 group-focus:scale-100 transition-transform">
          <PlayIcon size={22} className="text-white fill-white ml-0.5" />
        </div>
      </div>
    </div>
  );
};
