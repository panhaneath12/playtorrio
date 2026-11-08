import React from 'react';
import { SearchIcon, FilmIcon, TvIcon, ServerIcon } from '../common/Icons';

interface TVNavbarProps {
  activeTab: 'all' | 'movie' | 'tv' | 'anime' | 'kdrama' | 'cdrama' | 'bollywood' | 'livetv';
  onTabChange: (tab: 'all' | 'movie' | 'tv' | 'anime' | 'kdrama' | 'cdrama' | 'bollywood' | 'livetv') => void;
  onOpenSearch: () => void;
  onOpenTorrentPlayer: () => void;
  onOpenIPTV: () => void;
  onOpenDebridSettings: () => void;
  serverCount: number;
}

export const TVNavbar: React.FC<TVNavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenSearch,
  onOpenTorrentPlayer,
  onOpenDebridSettings,
  serverCount
}) => {
  return (
    <>
      {/* 1. Main Top Navigation Bar (Modern Web Header) */}
      <header className="sticky top-0 z-30 w-full px-4 sm:px-8 md:px-12 py-3 sm:py-4 flex items-center justify-between bg-[#08090D]/90 backdrop-blur-xl border-b border-white/10 transition-colors">
        {/* PlayTorrio Brand Identity */}
        <div 
          onClick={() => onTabChange('all')}
          className="flex items-center space-x-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-accent via-red-600 to-amber-500 flex items-center justify-center shadow-cinema-glow group-hover:scale-105 transition-transform">
            <FilmIcon size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-red-500 transition-colors">PlayTorrio</span>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded font-black bg-brand-accent text-white uppercase tracking-wider shadow">
                V3
              </span>
            </div>
            <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{serverCount} Fast Servers &bull; Worldwide Live TV</span>
            </div>
          </div>
        </div>

        {/* Center Categories (Desktop & Tablet Navigation Links) */}
        <nav className="hidden md:flex items-center space-x-1 bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
          <button
            onClick={() => onTabChange('all')}
            className={`px-4 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-brand-accent text-white shadow-cinema-glow'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => onTabChange('movie')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
              activeTab === 'movie'
                ? 'bg-brand-accent text-white shadow-cinema-glow'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <FilmIcon size={14} />
            <span>Movies</span>
          </button>

          <button
            onClick={() => onTabChange('tv')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
              activeTab === 'tv'
                ? 'bg-brand-accent text-white shadow-cinema-glow'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <TvIcon size={14} />
            <span>TV Shows</span>
          </button>

          <button
            onClick={() => onTabChange('anime')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
              activeTab === 'anime'
                ? 'bg-brand-accent text-white shadow-cinema-glow'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🎌 Anime</span>
          </button>

          <button
            onClick={() => onTabChange('kdrama')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
              activeTab === 'kdrama'
                ? 'bg-brand-accent text-white shadow-cinema-glow'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🇰🇷 K-Drama</span>
          </button>

          <button
            onClick={() => onTabChange('cdrama')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
              activeTab === 'cdrama'
                ? 'bg-brand-accent text-white shadow-cinema-glow'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🇨🇳 C-Drama</span>
          </button>

          <button
            onClick={() => onTabChange('bollywood')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
              activeTab === 'bollywood'
                ? 'bg-brand-accent text-white shadow-cinema-glow'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🎬 Bollywood</span>
          </button>

          <button
            onClick={() => onTabChange('livetv')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
              activeTab === 'livetv'
                ? 'bg-red-600 text-white shadow-cinema-glow ring-2 ring-white/30'
                : 'text-red-400 hover:text-white hover:bg-red-600/20 border border-red-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Live TV</span>
          </button>

          <button
            onClick={onOpenTorrentPlayer}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold text-amber-400 hover:text-white hover:bg-amber-500/20 transition-all border border-amber-500/20"
            title="In-Browser P2P WebTorrent Streaming Engine"
          >
            <span>⚡ P2P</span>
          </button>
        </nav>

        {/* Right Search & Settings Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenSearch}
            className="flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-white text-xs sm:text-sm font-bold border border-white/10 shadow-md transition-all hover:scale-105 active:scale-95"
            title="Search Movies, Shows & Anime (/)"
          >
            <SearchIcon size={16} className="text-brand-accent" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-gray-400 font-mono">
              /
            </kbd>
          </button>

          <button
            onClick={onOpenDebridSettings}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white text-xs sm:text-sm font-semibold border border-white/10 transition-all"
            title="Addons, Debrid & Resolvers"
          >
            <ServerIcon size={15} className="text-purple-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      {/* 2. Mobile Responsive Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#08090D]/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-around py-2.5 px-2 overflow-x-auto">
        <button
          onClick={() => onTabChange('all')}
          className={`flex flex-col items-center justify-center space-y-1 text-xs font-semibold shrink-0 px-2 ${
            activeTab === 'all' ? 'text-brand-accent' : 'text-gray-400'
          }`}
        >
          <FilmIcon size={18} />
          <span>Home</span>
        </button>

        <button
          onClick={() => onTabChange('movie')}
          className={`flex flex-col items-center justify-center space-y-1 text-xs font-semibold shrink-0 px-2 ${
            activeTab === 'movie' ? 'text-brand-accent' : 'text-gray-400'
          }`}
        >
          <FilmIcon size={18} />
          <span>Movies</span>
        </button>

        <button
          onClick={() => onTabChange('tv')}
          className={`flex flex-col items-center justify-center space-y-1 text-xs font-semibold shrink-0 px-2 ${
            activeTab === 'tv' ? 'text-brand-accent' : 'text-gray-400'
          }`}
        >
          <TvIcon size={18} />
          <span>Series</span>
        </button>

        <button
          onClick={() => onTabChange('kdrama')}
          className={`flex flex-col items-center justify-center space-y-1 text-xs font-semibold shrink-0 px-2 ${
            activeTab === 'kdrama' ? 'text-brand-accent' : 'text-gray-400'
          }`}
        >
          <span className="text-sm">🇰🇷</span>
          <span>K-Drama</span>
        </button>

        <button
          onClick={() => onTabChange('cdrama')}
          className={`flex flex-col items-center justify-center space-y-1 text-xs font-semibold shrink-0 px-2 ${
            activeTab === 'cdrama' ? 'text-brand-accent' : 'text-gray-400'
          }`}
        >
          <span className="text-sm">🇨🇳</span>
          <span>C-Drama</span>
        </button>

        <button
          onClick={() => onTabChange('anime')}
          className={`flex flex-col items-center justify-center space-y-1 text-xs font-semibold shrink-0 px-2 ${
            activeTab === 'anime' ? 'text-brand-accent' : 'text-gray-400'
          }`}
        >
          <span className="text-sm">🎌</span>
          <span>Anime</span>
        </button>

        <button
          onClick={() => onTabChange('livetv')}
          className={`flex flex-col items-center justify-center space-y-1 text-xs font-semibold shrink-0 px-2 ${
            activeTab === 'livetv' ? 'text-red-500 font-bold' : 'text-gray-400'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>Live TV</span>
        </button>

        <button
          onClick={onOpenSearch}
          className="flex flex-col items-center justify-center space-y-1 text-xs font-semibold text-gray-400 shrink-0 px-2"
        >
          <SearchIcon size={18} />
          <span>Search</span>
        </button>
      </nav>
    </>
  );
};
