import React from 'react';
import { FilmIcon, TvIcon, PlayIcon, ServerIcon } from '../common/Icons';

interface FeaturedCategoriesProps {
  onSelectCategory: (category: 'all' | 'movie' | 'tv' | 'anime' | 'kdrama' | 'cdrama' | 'bollywood' | 'livetv') => void;
  onOpenIPTV: () => void;
  onOpenTorrentPlayer: () => void;
  activeCategory: string;
}

export const FeaturedCategories: React.FC<FeaturedCategoriesProps> = ({
  onSelectCategory,
  onOpenIPTV,
  onOpenTorrentPlayer,
  activeCategory
}) => {
  const categories = [
    {
      id: 'movie',
      title: 'Movies',
      subtitle: 'Blockbusters & Cinema',
      icon: <FilmIcon size={26} className="text-white" />,
      gradient: 'from-blue-600/30 via-indigo-900/20 to-brand-card',
      border: 'border-blue-500/30',
      action: () => onSelectCategory('movie')
    },
    {
      id: 'tv',
      title: 'TV Series',
      subtitle: 'Binge-Worthy Shows',
      icon: <TvIcon size={26} className="text-white" />,
      gradient: 'from-purple-600/30 via-purple-900/20 to-brand-card',
      border: 'border-purple-500/30',
      action: () => onSelectCategory('tv')
    },
    {
      id: 'kdrama',
      title: 'K-Drama',
      subtitle: 'Romance & Thrillers',
      icon: <span className="text-2xl">🇰🇷</span>,
      gradient: 'from-rose-600/30 via-pink-950/20 to-brand-card',
      border: 'border-rose-500/30',
      action: () => onSelectCategory('kdrama')
    },
    {
      id: 'cdrama',
      title: 'C-Drama',
      subtitle: 'Historical & Wuxia',
      icon: <span className="text-2xl">🇨🇳</span>,
      gradient: 'from-red-600/30 via-amber-950/20 to-brand-card',
      border: 'border-red-500/30',
      action: () => onSelectCategory('cdrama')
    },
    {
      id: 'anime',
      title: 'Anime Hub',
      subtitle: 'Simulcasts & Manga',
      icon: <span className="text-2xl">🌸</span>,
      gradient: 'from-pink-600/30 via-rose-900/20 to-brand-card',
      border: 'border-pink-500/30',
      action: () => onSelectCategory('anime')
    },
    {
      id: 'bollywood',
      title: 'Bollywood',
      subtitle: 'Hindi & South Indian',
      icon: <span className="text-2xl">🇮🇳</span>,
      gradient: 'from-amber-600/30 via-orange-900/20 to-brand-card',
      border: 'border-amber-500/30',
      action: () => onSelectCategory('bollywood')
    },
    {
      id: 'iptv',
      title: 'Live TV',
      subtitle: '🇰🇭 Khmer & Global HD',
      icon: <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />,
      gradient: 'from-red-600/30 via-rose-950/30 to-brand-card',
      border: 'border-red-500/30',
      action: () => {
        if (onOpenIPTV) onOpenIPTV();
        else onSelectCategory('livetv');
      }
    },
    {
      id: 'torrents',
      title: 'P2P Torrents',
      subtitle: 'WebTorrent & Magnets',
      icon: <ServerIcon size={22} className="text-amber-400" />,
      gradient: 'from-emerald-600/30 via-emerald-950/20 to-brand-card',
      border: 'border-emerald-500/30',
      action: onOpenTorrentPlayer
    }
  ];

  return (
    <section className="mb-12 sm:mb-14 px-4 sm:px-8 md:px-14">
      <div className="flex items-center space-x-2.5 mb-4">
        <h2 className="text-base sm:text-lg font-bold text-brand-muted uppercase tracking-wider">
          Explore Categories
        </h2>
      </div>

      {/* Responsive Category Hub Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-4">
        {categories.map((cat, idx) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              id={`cat-tile-${idx}`}
              data-tv-nav="true"
              data-tv-scope="main"
              onClick={cat.action}
              className={`tv-focus-target group relative p-4 rounded-2xl bg-gradient-to-br ${cat.gradient} bg-brand-card border ${cat.border} text-left transition-all duration-200 shadow-md hover:scale-[1.02] flex flex-col justify-between min-h-[105px] select-none ${
                isActive ? 'ring-2 ring-brand-accent shadow-cinema-glow' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <PlayIcon size={14} className="text-white/30 group-hover:text-brand-accent transition-colors" />
              </div>

              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight group-hover:text-brand-accent transition-colors">
                  {cat.title}
                </h3>
                <p className="text-[11px] text-brand-muted truncate font-medium">
                  {cat.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
