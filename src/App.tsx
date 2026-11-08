import { useState, useMemo, useEffect } from 'react';
import { 
  getDailyTrending,
  getNewReleases,
  getTrending, 
  getPopularMovies, 
  getTopRatedMovies, 
  getPopularTV, 
  getTopRatedTV, 
  getAnimeCatalog, 
  getKDramaSeries,
  getCDramaSeries,
  getBollywoodMovies,
  getBollywoodSeries,
  getMoviesByGenre,
  syncImdbId,
  FALLBACK_CATALOG,
  DEFAULT_KDRAMA_SERIES,
  DEFAULT_CDRAMA_SERIES,
  DEFAULT_BOLLYWOOD_MOVIES,
  DEFAULT_BOLLYWOOD_SERIES
} from './services/tmdb';
import type { MediaItem } from './services/tmdb';
import { STREAMING_SERVERS } from './config/servers';
import { useSpatialNav } from './hooks/useSpatialNav';
import { TVNavbar } from './components/layout/TVNavbar';
import { HeroBanner } from './components/catalog/HeroBanner';
import { ContinueWatchingRow } from './components/catalog/ContinueWatchingRow';
import { FeaturedCategories } from './components/catalog/FeaturedCategories';
import { MediaRow } from './components/catalog/MediaRow';
import { MediaDetailModal } from './components/catalog/MediaDetailModal';
import { SearchModal } from './components/catalog/SearchModal';
import { MultiServerPlayer } from './components/player/MultiServerPlayer';
import { TorrentStreamPlayer } from './components/player/TorrentStreamPlayer';
import { IPTVControlRoom } from './components/iptv/IPTVControlRoom';
import { DebridSettingsModal } from './components/settings/DebridSettingsModal';
import { CategoryPage } from './components/category/CategoryPage';
import { LiveTVPage } from './components/live-tv/LiveTVPage';

const GENRE_PILLS = [
  { id: 0, name: 'All Categories' },
  { id: 28, name: 'Action' },
  { id: 878, name: 'Sci-Fi' },
  { id: 27, name: 'Horror' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 53, name: 'Thriller' },
  { id: 10749, name: 'Romance' }
];

export function App() {
  const [activeTab, setActiveTab] = useState<'all' | 'movie' | 'tv' | 'anime' | 'kdrama' | 'cdrama' | 'bollywood' | 'livetv'>('all');
  const [selectedGenreId, setSelectedGenreId] = useState<number>(0);

  // Live Catalog State
  const [newReleases, setNewReleases] = useState<MediaItem[]>([]);
  const [dailyTrending, setDailyTrending] = useState<MediaItem[]>([]);
  const [trendingAll, setTrendingAll] = useState<MediaItem[]>(FALLBACK_CATALOG);
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<MediaItem[]>([]);
  const [popularTV, setPopularTV] = useState<MediaItem[]>([]);
  const [topRatedTV, setTopRatedTV] = useState<MediaItem[]>([]);
  const [animeCatalog, setAnimeCatalog] = useState<MediaItem[]>([]);
  const [kdramaSeries, setKdramaSeries] = useState<MediaItem[]>(DEFAULT_KDRAMA_SERIES);
  const [cdramaSeries, setCdramaSeries] = useState<MediaItem[]>(DEFAULT_CDRAMA_SERIES);
  const [bollywoodMovies, setBollywoodMovies] = useState<MediaItem[]>(DEFAULT_BOLLYWOOD_MOVIES);
  const [bollywoodSeries, setBollywoodSeries] = useState<MediaItem[]>(DEFAULT_BOLLYWOOD_SERIES);
  const [genreResults, setGenreResults] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Player State
  const [selectedMediaForDetails, setSelectedMediaForDetails] = useState<MediaItem | null>(null);
  const [selectedMediaForPlayer, setSelectedMediaForPlayer] = useState<MediaItem | null>(null);
  const [playerInitialSeason, setPlayerInitialSeason] = useState<number>(1);
  const [playerInitialEpisode, setPlayerInitialEpisode] = useState<number>(1);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTorrentPlayerOpen, setIsTorrentPlayerOpen] = useState(false);
  const [isIPTVOpen, setIsIPTVOpen] = useState(false);
  const [isDebridSettingsOpen, setIsDebridSettingsOpen] = useState(false);

  // Fetch Live TMDB / IMDb synchronized data on mount with auto-refresh
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [dTrend, nRels, trending, popMovies, topMovies, popShows, topShows, anime, kdrama, cdrama, bMovies, bShows] = await Promise.all([
          getDailyTrending('all'),
          getNewReleases(1),
          getTrending('all'),
          getPopularMovies(1),
          getTopRatedMovies(1),
          getPopularTV(1),
          getTopRatedTV(1),
          getAnimeCatalog(1),
          getKDramaSeries(1),
          getCDramaSeries(1),
          getBollywoodMovies(1),
          getBollywoodSeries(1)
        ]);

        if (isMounted) {
          if (dTrend.length > 0) setDailyTrending(dTrend);
          if (nRels.length > 0) setNewReleases(nRels);
          if (trending.length > 0) setTrendingAll(trending);
          if (popMovies.length > 0) setPopularMovies(popMovies);
          if (topMovies.length > 0) setTopRatedMovies(topMovies);
          if (popShows.length > 0) setPopularTV(popShows);
          if (topShows.length > 0) setTopRatedTV(topShows);
          if (anime.length > 0) setAnimeCatalog(anime);
          if (kdrama.length > 0) setKdramaSeries(kdrama);
          if (cdrama.length > 0) setCdramaSeries(cdrama);
          if (bMovies.length > 0) setBollywoodMovies(bMovies);
          if (bShows.length > 0) setBollywoodSeries(bShows);
        }
      } catch (e) {
        console.warn('Live catalog load error, utilizing local backup:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    // Background sync: automatically checks for newly released titles & daily trending updates every 20 minutes
    const syncInterval = setInterval(() => {
      Promise.all([getDailyTrending('all'), getNewReleases(1)]).then(([dTrend, nRels]) => {
        if (isMounted) {
          if (dTrend.length > 0) setDailyTrending(dTrend);
          if (nRels.length > 0) setNewReleases(nRels);
        }
      }).catch(() => {});
    }, 20 * 60 * 1000);

    return () => { 
      isMounted = false; 
      clearInterval(syncInterval);
    };
  }, []);

  // Fetch Genre Specific Movies when a Genre Pill is clicked
  useEffect(() => {
    if (selectedGenreId === 0) {
      setGenreResults([]);
      return;
    }

    let isMounted = true;
    getMoviesByGenre(selectedGenreId, 1).then(items => {
      if (isMounted) setGenreResults(items);
    });

    return () => { isMounted = false; };
  }, [selectedGenreId]);

  // Active Spatial Navigation Scope: restricts D-pad arrows to the top-most active view
  const activeScope = useMemo(() => {
    if (isIPTVOpen) return 'iptv';
    if (activeTab === 'livetv') return 'livetv';
    if (isDebridSettingsOpen) return 'settings';
    if (isTorrentPlayerOpen) return 'torrent';
    if (selectedMediaForPlayer) return 'player';
    if (selectedMediaForDetails) return 'details';
    if (isSearchOpen) return 'search';
    return 'main';
  }, [isIPTVOpen, activeTab, isDebridSettingsOpen, isTorrentPlayerOpen, selectedMediaForPlayer, selectedMediaForDetails, isSearchOpen]);

  // Handle Android TV Back Button (or Escape / Backspace on PC)
  const handleBack = () => {
    if (isIPTVOpen) {
      setIsIPTVOpen(false);
    } else if (isDebridSettingsOpen) {
      setIsDebridSettingsOpen(false);
    } else if (isTorrentPlayerOpen) {
      setIsTorrentPlayerOpen(false);
    } else if (selectedMediaForPlayer) {
      setSelectedMediaForPlayer(null);
    } else if (selectedMediaForDetails) {
      setSelectedMediaForDetails(null);
    } else if (isSearchOpen) {
      setIsSearchOpen(false);
    } else if (activeTab !== 'all') {
      setActiveTab('all');
      setSelectedGenreId(0);
    }
  };

  // Disable TV spatial navigation hijacking to restore native browser mouse, trackpad, and keyboard scrolling
  useSpatialNav({
    activeScope,
    onBack: handleBack,
    enabled: false
  });

  // Native web keyboard shortcuts: Escape key closes modal or returns to home
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBack]);

  // Dynamic Cinematic Hero Item for each view
  const heroMedia = useMemo(() => {
    if (activeTab === 'movie') {
      return (
        newReleases.find(i => i.backdrop && i.overview) ||
        dailyTrending.find(i => i.type === 'movie' && i.backdrop && i.overview) ||
        popularMovies.find(i => i.backdrop && i.overview) ||
        popularMovies[0] ||
        trendingAll[0]
      );
    }
    if (activeTab === 'tv') {
      return (
        dailyTrending.find(i => i.type === 'tv' && i.backdrop && i.overview) ||
        popularTV.find(i => i.backdrop && i.overview) ||
        popularTV[0] ||
        trendingAll[0]
      );
    }
    if (activeTab === 'anime') {
      return animeCatalog.find(i => i.backdrop && i.overview) || animeCatalog[0] || trendingAll[0];
    }
    if (activeTab === 'kdrama') {
      return kdramaSeries.find(i => i.backdrop && i.overview) || kdramaSeries[0] || trendingAll[0];
    }
    if (activeTab === 'cdrama') {
      return cdramaSeries.find(i => i.backdrop && i.overview) || cdramaSeries[0] || trendingAll[0];
    }
    if (activeTab === 'bollywood') {
      return bollywoodMovies.find(i => i.backdrop && i.overview) || bollywoodMovies[0];
    }
    return (
      newReleases.find(i => i.backdrop && i.overview) ||
      dailyTrending.find(i => i.backdrop && i.overview) ||
      trendingAll.find(i => i.backdrop && i.overview) ||
      trendingAll[0] ||
      FALLBACK_CATALOG[0]
    );
  }, [activeTab, newReleases, dailyTrending, trendingAll, popularMovies, popularTV, animeCatalog, kdramaSeries, cdramaSeries, bollywoodMovies]);

  // Curated "Recommended for You" Collection
  const recommendedForYou = useMemo(() => {
    const list = [...topRatedMovies, ...topRatedTV].filter(i => i.rating >= 8.0);
    return list.length > 0 ? list.slice(0, 18) : trendingAll.slice(6);
  }, [topRatedMovies, topRatedTV, trendingAll]);

  // Handle Play Action with resume support & IMDb ID sync
  const handlePlayFromAnywhere = async (media: MediaItem, season: number = 1, episode: number = 1) => {
    if (!media.imdbId) {
      syncImdbId(media).catch(() => {});
    }
    setPlayerInitialSeason(season);
    setPlayerInitialEpisode(episode);
    setSelectedMediaForDetails(null);
    setSelectedMediaForPlayer(media);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-white flex flex-col selection:bg-brand-accent selection:text-white pb-16 md:pb-0">
      {/* 1. PlayTorrio V3 Cinematic Navigation Header */}
      <TVNavbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedGenreId(0);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenTorrentPlayer={() => setIsTorrentPlayerOpen(true)}
        onOpenIPTV={() => {
          setActiveTab('livetv');
          setSelectedGenreId(0);
        }}
        onOpenDebridSettings={() => setIsDebridSettingsOpen(true)}
        serverCount={STREAMING_SERVERS.length}
      />

      {/* 2. Genre Discovery Pills Bar (Home Screen Discovery) */}
      {activeTab === 'all' && (
        <div className="w-full px-4 sm:px-8 md:px-14 py-2 flex items-center space-x-2 overflow-x-auto bg-black/50 border-b border-brand-border scroll-smooth">
          <span className="text-[11px] uppercase font-extrabold text-brand-muted shrink-0 mr-1.5 tracking-wider">
            Genre:
          </span>
          {GENRE_PILLS.map((genre) => (
            <button
              key={genre.id}
              data-tv-nav="true"
              data-tv-scope="main"
              onClick={() => setSelectedGenreId(genre.id)}
              className={`tv-focus-target px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                selectedGenreId === genre.id
                  ? 'bg-brand-accent text-white shadow-cinema-glow'
                  : 'bg-brand-card text-brand-muted hover:text-white border border-brand-border'
              }`}
            >
              {genre.name}
            </button>
          ))}
        </div>
      )}

      {/* 3. Main Living Room & Responsive Streaming Stage */}
      <main className="flex-1 pb-16" data-tv-scope="main">
        {/* Dedicated Live TV or Main Category Browse Pages */}
        {activeTab === 'livetv' ? (
          <LiveTVPage onBackToHome={() => setActiveTab('all')} />
        ) : activeTab !== 'all' ? (
          <CategoryPage
            key={activeTab}
            category={activeTab}
            initialGenreId={selectedGenreId}
            initialItems={
              activeTab === 'movie' ? popularMovies :
              activeTab === 'tv' ? popularTV :
              activeTab === 'kdrama' ? kdramaSeries :
              activeTab === 'cdrama' ? cdramaSeries :
              activeTab === 'anime' ? animeCatalog :
              [...bollywoodMovies, ...bollywoodSeries]
            }
            onSelectMedia={setSelectedMediaForDetails}
            onPlayMedia={handlePlayFromAnywhere}
            onBackToHome={() => {
              setActiveTab('all');
              setSelectedGenreId(0);
            }}
          />
        ) : (
          /* Home Screen — Hybrid Cinematic Layout */
          <>
            {/* B. Cinematic Hero Banner */}
            {selectedGenreId === 0 && (
              <HeroBanner
                media={heroMedia}
                onPlay={handlePlayFromAnywhere}
                onMoreInfo={setSelectedMediaForDetails}
              />
            )}

            {/* C. Continue Watching Row (Persistent actual history) */}
            {selectedGenreId === 0 && (
              <ContinueWatchingRow
                onResume={handlePlayFromAnywhere}
                onSelectMedia={setSelectedMediaForDetails}
              />
            )}

            {/* D. Featured Categories Hub (Discovery Tiles) */}
            {selectedGenreId === 0 && (
              <FeaturedCategories
                activeCategory={activeTab}
                onSelectCategory={(cat) => {
                  setActiveTab(cat);
                  setSelectedGenreId(0);
                }}
                onOpenIPTV={() => {
                  setActiveTab('livetv');
                  setSelectedGenreId(0);
                }}
                onOpenTorrentPlayer={() => setIsTorrentPlayerOpen(true)}
              />
            )}

            {/* Dynamic Category Shelves with "See All" Integration */}
            <div className="space-y-8 sm:space-y-10 md:space-y-12 pt-4">
              {/* Filtered Genre Shelf if pill active */}
              {selectedGenreId !== 0 && (
                <MediaRow
                  rowId={`genre-${selectedGenreId}`}
                  title={`🎬 Top ${GENRE_PILLS.find(g => g.id === selectedGenreId)?.name || 'Genre'} Movies`}
                  badge="Curated"
                  items={genreResults.length > 0 ? genreResults : trendingAll}
                  onSelectMedia={setSelectedMediaForDetails}
                  onPlayMedia={handlePlayFromAnywhere}
                  onSeeAll={() => setActiveTab('movie')}
                />
              )}

              {/* 1. Fresh Theatrical & Digital Drops */}
              <MediaRow
                rowId="new-releases-home"
                title="✨ In Theatres & Fresh New Releases"
                badge="Just Dropped"
                items={newReleases.length > 0 ? newReleases : popularMovies}
                onSelectMedia={setSelectedMediaForDetails}
                onPlayMedia={handlePlayFromAnywhere}
                onSeeAll={() => setActiveTab('movie')}
              />

              {/* 2. Real-Time Daily Trending */}
              <MediaRow
                rowId="daily-trending"
                title="🔥 Trending Today"
                badge="Daily Hot"
                items={dailyTrending.length > 0 ? dailyTrending : trendingAll}
                onSelectMedia={setSelectedMediaForDetails}
                onPlayMedia={handlePlayFromAnywhere}
                onSeeAll={() => setActiveTab('movie')}
              />

              {/* 3. Top Trending This Week */}
              <MediaRow
                rowId="trending-now"
                title="📈 Top Trending This Week"
                badge="Top 10"
                items={trendingAll}
                onSelectMedia={setSelectedMediaForDetails}
                onPlayMedia={handlePlayFromAnywhere}
                onSeeAll={() => setActiveTab('movie')}
              />

              {/* 4. Popular Movies */}
              <MediaRow
                rowId="popular-movies"
                title="🎬 Popular Movies"
                badge="Cinema"
                items={popularMovies.length > 0 ? popularMovies : trendingAll}
                onSelectMedia={setSelectedMediaForDetails}
                onPlayMedia={handlePlayFromAnywhere}
                onSeeAll={() => setActiveTab('movie')}
              />

              {/* 5. Trending TV Shows */}
              <MediaRow
                rowId="popular-series"
                title="📺 Trending TV Shows"
                badge="Series"
                items={popularTV.length > 0 ? popularTV : trendingAll}
                onSelectMedia={setSelectedMediaForDetails}
                onPlayMedia={handlePlayFromAnywhere}
                onSeeAll={() => setActiveTab('tv')}
              />

              {/* 6. Top Rated Movies */}
              <MediaRow
                rowId="top-rated"
                title="⭐ Top Rated Cinema Masterpieces"
                badge="Hall of Fame"
                items={topRatedMovies.length > 0 ? topRatedMovies : trendingAll}
                onSelectMedia={setSelectedMediaForDetails}
                onPlayMedia={handlePlayFromAnywhere}
                onSeeAll={() => setActiveTab('movie')}
              />

              {/* 7. Anime Collection */}
              <MediaRow
                rowId="anime-collection"
                title="🌸 Anime Collection"
                badge="Anime"
                items={animeCatalog.length > 0 ? animeCatalog : FALLBACK_CATALOG.filter(i => i.genre.includes('Anime'))}
                onSelectMedia={setSelectedMediaForDetails}
                onPlayMedia={handlePlayFromAnywhere}
                onSeeAll={() => setActiveTab('anime')}
              />

              {/* 8. Korean Drama Collection (K-Drama) */}
              <MediaRow
                rowId="kdrama-collection"
                title="🇰🇷 Trending Korean Dramas (K-Drama)"
                badge="K-Drama"
                items={kdramaSeries}
                onSelectMedia={setSelectedMediaForDetails}
                onPlayMedia={handlePlayFromAnywhere}
                onSeeAll={() => setActiveTab('kdrama')}
              />

              {/* 9. Chinese Drama Collection (C-Drama) */}
              <MediaRow
                rowId="cdrama-collection"
                title="🇨🇳 Popular Chinese Dramas (C-Drama)"
                badge="C-Drama"
                items={cdramaSeries}
                onSelectMedia={setSelectedMediaForDetails}
                onPlayMedia={handlePlayFromAnywhere}
                onSeeAll={() => setActiveTab('cdrama')}
              />

              {/* 10. Bollywood Collection */}
              <MediaRow
                rowId="bollywood-collection"
                title="🇮🇳 Bollywood & Indian Cinema"
                badge="Bollywood"
                items={bollywoodMovies.length > 0 ? bollywoodMovies : FALLBACK_CATALOG.filter(i => i.genre.includes('Bollywood'))}
                onSelectMedia={setSelectedMediaForDetails}
                onPlayMedia={handlePlayFromAnywhere}
                onSeeAll={() => setActiveTab('bollywood')}
              />

              {/* 11. Recommended For You */}
              <MediaRow
                rowId="recommended"
                title="🎯 Recommended For You"
                badge="Curated"
                items={recommendedForYou}
                onSelectMedia={setSelectedMediaForDetails}
                onPlayMedia={handlePlayFromAnywhere}
                onSeeAll={() => setActiveTab('movie')}
              />

              {isLoading && (
                <div className="w-full flex items-center justify-center py-12 text-sm text-brand-muted font-bold animate-pulse">
                  Syncing live entertainment catalog with TMDB & IMDb...
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* 4. PlayTorrio V3 Modern Web Streaming Footer */}
      <footer className="w-full bg-[#08090D] border-t border-white/10 pt-12 pb-8 px-4 sm:px-8 md:px-14 text-sm text-gray-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand & Bio */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-accent via-red-600 to-amber-500 flex items-center justify-center shadow-cinema-glow">
                <span className="text-white font-black text-base">P</span>
              </div>
              <span className="text-xl font-black text-white tracking-tight">PlayTorrio</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-brand-accent text-white uppercase tracking-wider">
                V3 WEB
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Next-generation streaming platform. Discover and stream movies, TV shows, anime, and live international channels in 4K with 12 fast multi-server engines and direct P2P streaming.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{STREAMING_SERVERS.length} Fast Embed Servers Online</span>
            </div>
          </div>

          {/* Col 2: Catalog Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Browse Catalog</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => { setActiveTab('all'); setSelectedGenreId(0); }} className="hover:text-white transition">
                  Home &amp; Trending
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('movie'); setSelectedGenreId(0); }} className="hover:text-white transition">
                  Movies &amp; Blockbusters
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('tv'); setSelectedGenreId(0); }} className="hover:text-white transition">
                  TV Series &amp; Shows
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('kdrama'); setSelectedGenreId(0); }} className="hover:text-white transition">
                  🇰🇷 Korean Drama (K-Drama)
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('cdrama'); setSelectedGenreId(0); }} className="hover:text-white transition">
                  🇨🇳 Chinese Drama (C-Drama)
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('anime'); setSelectedGenreId(0); }} className="hover:text-white transition">
                  Anime Hub (AniList &bull; MAL)
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('bollywood'); setSelectedGenreId(0); }} className="hover:text-white transition">
                  Bollywood &amp; Indian Cinema
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveTab('livetv'); setSelectedGenreId(0); }} className="hover:text-white transition flex items-center gap-1.5 text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  Live TV (Global &amp; Khmer)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Streaming Technology */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Streaming Engines</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center justify-between">
                <span>VidLink &bull; Multi-Res</span>
                <span className="text-[10px] text-emerald-400 font-mono">1080p/4K</span>
              </li>
              <li className="flex items-center justify-between">
                <span>NonTonGo &bull; Asian VIP</span>
                <span className="text-[10px] text-emerald-400 font-mono">Multi-Sub</span>
              </li>
              <li className="flex items-center justify-between">
                <span>VidFast &bull; Asian Fast</span>
                <span className="text-[10px] text-emerald-400 font-mono">Ultra HD</span>
              </li>
              <li className="flex items-center justify-between">
                <span>VidSrc Prime &bull; Fast CDN</span>
                <span className="text-[10px] text-emerald-400 font-mono">Ultra-HD</span>
              </li>
              <li className="flex items-center justify-between">
                <span>AutoEmbed &bull; Multi-Lang</span>
                <span className="text-[10px] text-emerald-400 font-mono">Captions</span>
              </li>
              <li className="flex items-center justify-between">
                <span>2Embed &bull; Cloud Backup</span>
                <span className="text-[10px] text-emerald-400 font-mono">Global</span>
              </li>
              <li className="flex items-center justify-between">
                <button onClick={() => setIsTorrentPlayerOpen(true)} className="text-amber-400 hover:underline">
                  WebTorrent P2P Engine
                </button>
                <span className="text-[10px] text-amber-400 font-mono">Magnets</span>
              </li>
              <li className="flex items-center justify-between">
                <button onClick={() => setIsDebridSettingsOpen(true)} className="text-purple-400 hover:underline">
                  Real-Debrid &bull; Stremio
                </button>
                <span className="text-[10px] text-purple-400 font-mono">Cloud Debrid</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Web Features & Shortcuts */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Keyboard Shortcuts</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Open Search</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-200 font-mono text-[11px]">/</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Close Modal / Back</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-200 font-mono text-[11px]">Esc</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Fullscreen Video</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-200 font-mono text-[11px]">F</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Mute / Unmute</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-200 font-mono text-[11px]">M</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Play / Pause</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-200 font-mono text-[11px]">Space</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Back to Top */}
        <div className="max-w-7xl mx-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} PlayTorrio V3 Web Platform. Stream smoothly on any browser. No media files are hosted on this server.
          </p>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsDebridSettingsOpen(true)}
              className="hover:text-white transition"
            >
              Settings &amp; Resolvers
            </button>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center space-x-1 px-3 py-1 rounded-full bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-white/10 transition"
            >
              <span>Back to Top</span>
              <span>&uarr;</span>
            </button>
          </div>
        </div>
      </footer>

      {/* 5. Details Modal */}
      {selectedMediaForDetails && (
        <MediaDetailModal
          media={selectedMediaForDetails}
          onPlay={handlePlayFromAnywhere}
          onClose={() => setSelectedMediaForDetails(null)}
        />
      )}

      {/* 6. Search & On-Screen Virtual Keyboard Modal */}
      {isSearchOpen && (
        <SearchModal
          onSelectMedia={(media) => {
            setIsSearchOpen(false);
            setSelectedMediaForDetails(media);
          }}
          onClose={() => setIsSearchOpen(false)}
        />
      )}

      {/* 7. Multi-Server Video Player (12 Verified Servers) */}
      {selectedMediaForPlayer && (
        <MultiServerPlayer
          media={selectedMediaForPlayer}
          initialSeason={playerInitialSeason}
          initialEpisode={playerInitialEpisode}
          onClose={() => setSelectedMediaForPlayer(null)}
        />
      )}

      {/* 8. Dedicated WebTorrent & Magnet P2P Player */}
      {isTorrentPlayerOpen && (
        <TorrentStreamPlayer
          onClose={() => setIsTorrentPlayerOpen(false)}
        />
      )}

      {/* 9. PlayTorrio V3 Live IPTV Control Room */}
      {isIPTVOpen && (
        <IPTVControlRoom
          onClose={() => setIsIPTVOpen(false)}
        />
      )}

      {/* 10. Debrid & Stremio Addons Settings Modal */}
      {isDebridSettingsOpen && (
        <DebridSettingsModal
          onClose={() => setIsDebridSettingsOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
