import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { TvChannel, TvCountry, TvCategory } from '../../modules/live-tv/types';
import { liveTvService } from '../../modules/live-tv/service';
import { ChannelCard } from './ChannelCard';
import { CountrySelector } from './CountrySelector';
import { CategorySelector } from './CategorySelector';
import { LiveTVPlayer } from './LiveTVPlayer';
import { SearchIcon, RefreshIcon, HeartIcon, HistoryIcon, TvIcon } from '../common/Icons';

interface LiveTVPageProps {
  onBackToHome?: () => void;
}

export const LiveTVPage: React.FC<LiveTVPageProps> = ({ onBackToHome }) => {
  // State
  const [channels, setChannels] = useState<TvChannel[]>([]);
  const [countries, setCountries] = useState<TvCountry[]>([]);
  const [categories, setCategories] = useState<TvCategory[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentlyWatched, setRecentlyWatched] = useState<TvChannel[]>([]);

  // Filters
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'name' | 'recently_added'>('popular');
  const [viewMode, setViewMode] = useState<'all' | 'favorites' | 'recent'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Active Player Modal
  const [playingChannel, setPlayingChannel] = useState<TvChannel | null>(null);

  // 1. Initial Load of Countries, Categories, Favorites, Recent
  useEffect(() => {
    let isMounted = true;
    async function initData() {
      try {
        const [coList, catList, favIds, recentList] = await Promise.all([
          liveTvService.getCountries(),
          liveTvService.getCategories(),
          liveTvService.getFavorites(),
          liveTvService.getRecentlyWatched()
        ]);
        if (isMounted) {
          setCountries(coList);
          setCategories(catList);
          setFavorites(new Set(favIds.map(f => f.id)));
          setRecentlyWatched(recentList);
        }
      } catch (err) {
        console.warn('Failed to load initial Live TV metadata:', err);
      }
    }
    initData();
    return () => { isMounted = false; };
  }, []);

  // 2. Fetch Channels whenever filters change
  const fetchChannels = useCallback(async (page: number = 1, append: boolean = false) => {
    if (page === 1) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const res = await liveTvService.getChannels({
        country: selectedCountry,
        category: selectedCategory,
        searchQuery: searchQuery.trim() || undefined,
        favoritesOnly: viewMode === 'favorites',
        recentlyWatchedOnly: viewMode === 'recent',
        sortBy,
        page,
        pageSize: 36
      });

      if (append) {
        setChannels(prev => {
          const ids = new Set(prev.map(c => c.id));
          const newItems = res.items.filter(item => !ids.has(item.id));
          return [...prev, ...newItems];
        });
      } else {
        setChannels(res.items);
      }

      setTotalCount(res.total);
      setHasMore(res.hasMore);
      setCurrentPage(res.page);
    } catch (err) {
      console.warn('Live TV fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedCountry, selectedCategory, searchQuery, viewMode, sortBy]);

  useEffect(() => {
    fetchChannels(1, false);
  }, [fetchChannels]);

  // Load More Handler
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchChannels(currentPage + 1, true);
    }
  };

  // Trigger IPTV-org background synchronization
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Syncing with IPTV-org global repositories...');
    try {
      await liveTvService.triggerSync();
      const [coList, catList] = await Promise.all([
        liveTvService.getCountries(),
        liveTvService.getCategories()
      ]);
      setCountries(coList);
      setCategories(catList);
      await fetchChannels(1, false);
      setSyncStatus('Synchronization completed successfully!');
    } catch {
      setSyncStatus('Sync complete (using cached data).');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (channelId: string) => {
    const isNowFav = await liveTvService.toggleFavorite(channelId);
    setFavorites(prev => {
      const next = new Set(prev);
      if (isNowFav) next.add(channelId);
      else next.delete(channelId);
      return next;
    });
  };

  // Play Channel
  const handlePlayChannel = async (channel: TvChannel) => {
    await liveTvService.recordRecentlyWatched(channel.id);
    const updatedRecent = await liveTvService.getRecentlyWatched();
    setRecentlyWatched(updatedRecent);
    setPlayingChannel(channel);
  };

  // Featured Shelves when no search query
  const featuredChannels = useMemo(() => {
    return channels.filter(c => c.featured).slice(0, 8);
  }, [channels]);

  return (
    <div className="w-full min-h-screen bg-[#08090D] text-white flex flex-col pb-20 select-none">
      {/* 1. Cinematic Live TV Header */}
      <section className="relative px-4 sm:px-8 md:px-14 pt-8 pb-6 border-b border-brand-border bg-gradient-to-b from-[#14151F] via-[#0A0B10] to-[#08090D]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              {onBackToHome && (
                <button
                  data-tv-nav="true"
                  data-tv-scope="livetv"
                  onClick={onBackToHome}
                  className="tv-focus-target px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-xs font-bold transition mr-1 flex items-center gap-1"
                  title="Return to Home"
                >
                  <span>« Home</span>
                </button>
              )}
              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-black tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>Worldwide Live IPTV</span>
              </span>
              <span className="text-xs text-brand-muted font-mono font-bold">
                {totalCount > 0 ? `${totalCount.toLocaleString()} Verified Channels` : 'IPTV-org Catalog'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              Worldwide Live TV
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl mt-1.5 font-medium leading-relaxed">
              Stream news, live sports, movies, music, and national channels from 200+ countries, including 🇰🇭 Cambodia Khmer TV and 🇹🇭 Thailand channels.
            </p>
          </div>

          {/* Search & Actions Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-72">
              <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search channel or country..."
                className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-black/60 border border-brand-border text-white text-xs sm:text-sm font-medium focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent placeholder-gray-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sync Repository Button */}
            <button
              data-tv-nav="true"
              data-tv-scope="livetv"
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="tv-focus-target flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-brand-surface hover:bg-white/10 text-white text-xs sm:text-sm font-bold border border-brand-border transition shadow"
              title="Sync latest IPTV-org channels"
            >
              <RefreshIcon size={14} className={isSyncing ? 'animate-spin text-brand-accent' : 'text-gray-300'} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync IPTV'}</span>
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncStatus && (
          <div className="mt-4 px-4 py-2 rounded-xl bg-brand-accent/20 border border-brand-accent/40 text-brand-accent text-xs font-bold animate-fadeIn flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            <span>{syncStatus}</span>
          </div>
        )}

        {/* Quick View Filter Tabs (All, Favorites, Recently Watched) */}
        <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-white/5">
          <button
            data-tv-nav="true"
            data-tv-scope="livetv"
            onClick={() => setViewMode('all')}
            className={`tv-focus-target px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              viewMode === 'all'
                ? 'bg-brand-accent text-white shadow-cinema-glow'
                : 'bg-brand-card text-brand-muted hover:text-white border border-brand-border'
            }`}
          >
            <TvIcon size={14} />
            <span>All Channels</span>
          </button>

          <button
            data-tv-nav="true"
            data-tv-scope="livetv"
            onClick={() => setViewMode('favorites')}
            className={`tv-focus-target px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              viewMode === 'favorites'
                ? 'bg-brand-accent text-white shadow-cinema-glow'
                : 'bg-brand-card text-brand-muted hover:text-white border border-brand-border'
            }`}
          >
            <HeartIcon size={14} filled={viewMode === 'favorites'} />
            <span>Favorites ({favorites.size})</span>
          </button>

          <button
            data-tv-nav="true"
            data-tv-scope="livetv"
            onClick={() => setViewMode('recent')}
            className={`tv-focus-target px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              viewMode === 'recent'
                ? 'bg-brand-accent text-white shadow-cinema-glow'
                : 'bg-brand-card text-brand-muted hover:text-white border border-brand-border'
            }`}
          >
            <HistoryIcon size={14} />
            <span>Recently Watched ({recentlyWatched.length})</span>
          </button>

          {/* Sort Selector */}
          <div className="ml-auto flex items-center space-x-1.5 text-xs text-brand-muted font-bold">
            <span className="hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-brand-card text-white text-xs px-2.5 py-1.5 rounded-lg border border-brand-border focus:outline-none cursor-pointer"
            >
              <option value="popular">Popular First</option>
              <option value="name">Name A–Z</option>
              <option value="recently_added">Recently Added</option>
            </select>
          </div>
        </div>
      </section>

      {/* 2. Country & Category Filter Selectors */}
      <section className="px-4 sm:px-8 md:px-14 py-3 bg-[#0A0B10] border-b border-brand-border flex flex-col gap-2.5">
        <CountrySelector
          countries={countries}
          selectedCountry={selectedCountry}
          onSelectCountry={(c) => {
            setSelectedCountry(c);
            setCurrentPage(1);
          }}
          scope="livetv"
        />

        <CategorySelector
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setCurrentPage(1);
          }}
          scope="livetv"
        />
      </section>

      {/* 3. Main Stage: Featured Shelf (When browsing all and page 1) */}
      {viewMode === 'all' && !searchQuery && currentPage === 1 && featuredChannels.length > 0 && selectedCountry === 'ALL' && selectedCategory === 'all' && (
        <section className="px-4 sm:px-8 md:px-14 pt-6 pb-2">
          <div className="flex items-center space-x-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-brand-accent" />
            <h3 className="text-base sm:text-lg font-black text-white">Featured Live Broadcasters</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {featuredChannels.map(ch => (
              <ChannelCard
                key={`feat-${ch.id}`}
                channel={ch}
                isFavorite={favorites.has(ch.id)}
                onPlay={handlePlayChannel}
                onToggleFavorite={handleToggleFavorite}
                scope="livetv"
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Responsive Channels Grid */}
      <section className="flex-1 px-4 sm:px-8 md:px-14 py-6" data-tv-scope="livetv">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg sm:text-xl font-bold text-white">
              {viewMode === 'favorites' ? 'Favorite Channels' :
               viewMode === 'recent' ? 'Recently Watched' :
               searchQuery ? `Search Results for "${searchQuery}"` :
               selectedCountry !== 'ALL' ? `${countries.find(c => c.code === selectedCountry)?.name || selectedCountry} Channels` :
               selectedCategory !== 'all' ? `${categories.find(c => c.id === selectedCategory)?.name || selectedCategory} Channels` :
               'All Live Channels'}
            </h3>
            <span className="text-xs text-brand-muted font-mono font-bold">
              ({totalCount})
            </span>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 18 }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="aspect-[16/10] rounded-2xl bg-brand-surface animate-pulse border border-brand-border"
              />
            ))}
          </div>
        ) : channels.length === 0 ? (
          /* Empty State */
          <div className="py-20 flex flex-col items-center justify-center text-center p-6 bg-brand-surface/40 rounded-3xl border border-brand-border">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-3xl">
              📡
            </div>
            <h3 className="text-white text-lg sm:text-xl font-bold mb-1">No channels found</h3>
            <p className="text-gray-400 text-xs sm:text-sm max-w-md mb-6">
              {viewMode === 'favorites' ? "You haven't added any favorite channels yet. Click the heart icon on any channel card to save it here!" :
               viewMode === 'recent' ? "No recently watched channels yet. Select any channel above to start streaming!" :
               `No channels match your current filter settings.`}
            </p>
            {(selectedCountry !== 'ALL' || selectedCategory !== 'all' || searchQuery) && (
              <button
                data-tv-nav="true"
                data-tv-scope="livetv"
                onClick={() => {
                  setSelectedCountry('ALL');
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setViewMode('all');
                }}
                className="tv-focus-target px-4 py-2 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white text-xs sm:text-sm font-bold shadow-cinema-glow transition"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          /* Live Channel Cards Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {channels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                isFavorite={favorites.has(channel.id)}
                onPlay={handlePlayChannel}
                onToggleFavorite={handleToggleFavorite}
                scope="livetv"
              />
            ))}
          </div>
        )}

        {/* 5. Load More Button */}
        {hasMore && !isLoading && (
          <div className="flex justify-center mt-10">
            <button
              data-tv-nav="true"
              data-tv-scope="livetv"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="tv-focus-target px-6 py-3 rounded-2xl bg-brand-surface hover:bg-brand-accent text-white text-xs sm:text-sm font-bold border border-brand-border hover:border-brand-accent shadow-cinema-glow transition flex items-center space-x-2"
            >
              {isLoadingMore ? (
                <>
                  <RefreshIcon size={16} className="animate-spin text-brand-accent" />
                  <span>Loading additional channels...</span>
                </>
              ) : (
                <span>Load More Channels ({channels.length} of {totalCount})</span>
              )}
            </button>
          </div>
        )}
      </section>

      {/* 6. Active Live TV Video Player */}
      {playingChannel && (
        <LiveTVPlayer
          channel={playingChannel}
          allChannels={channels.length > 0 ? channels : [playingChannel]}
          isFavorite={favorites.has(playingChannel.id)}
          onToggleFavorite={handleToggleFavorite}
          onSelectChannel={handlePlayChannel}
          onClose={() => setPlayingChannel(null)}
        />
      )}
    </div>
  );
};
