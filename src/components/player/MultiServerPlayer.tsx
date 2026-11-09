import React, { useState, useEffect, useRef } from 'react';
import type { MediaItem, SeasonInfo, TVDetails } from '../../services/tmdb';
import { 
  syncImdbId, 
  fetchTVShowDetails,
  getAbsoluteEpisodeNumber,
  getSeasonAndEpisodeFromAbsolute
} from '../../services/tmdb';
import { STREAMING_SERVERS, DEFAULT_SERVER } from '../../config/servers';
import type { StreamingServer } from '../../config/servers';
import { CloseIcon, ServerIcon, RefreshIcon, CheckIcon, TvIcon, AlertIcon } from '../common/Icons';
import { WebTorrentNativeView } from './WebTorrentNativeView';
import { savePlaybackProgress } from '../../services/history';

interface MultiServerPlayerProps {
  media: MediaItem;
  initialSeason?: number;
  initialEpisode?: number;
  onClose: () => void;
}

export const MultiServerPlayer: React.FC<MultiServerPlayerProps> = ({
  media,
  initialSeason = 1,
  initialEpisode = 1,
  onClose
}) => {
  const isAnime = Boolean(
    media.genre?.toLowerCase().includes('anime') ||
    media.genre?.toLowerCase().includes('animation')
  );
  const isBolly = Boolean(
    media.genre?.toLowerCase().includes('bollywood') ||
    media.genre?.toLowerCase().includes('hindi') ||
    media.title.toLowerCase().includes('rrr') ||
    media.title.toLowerCase().includes('jawan') ||
    media.title.toLowerCase().includes('pathaan') ||
    media.title.toLowerCase().includes('stree') ||
    media.title.toLowerCase().includes('mirzapur') ||
    media.title.toLowerCase().includes('panchayat') ||
    media.title.toLowerCase().includes('sacred games') ||
    media.title.toLowerCase().includes('dangal')
  );
  const isAsian = Boolean(
    media.genre?.toLowerCase().includes('k-drama') ||
    media.genre?.toLowerCase().includes('c-drama') ||
    media.genre?.toLowerCase().includes('korean') ||
    media.genre?.toLowerCase().includes('chinese') ||
    media.genre?.toLowerCase().includes('hallyu') ||
    media.genre?.toLowerCase().includes('wuxia') ||
    media.genre?.toLowerCase().includes('xianxia')
  );
  const bollyServer = STREAMING_SERVERS.find(s => s.isBollywood);
  const asianServer = STREAMING_SERVERS.find(s => s.id === 'nontongo' || s.isAsian);
  // Default to NonTonGo Asian VIP for K-Drama & C-Drama, Bollywood server for Hindi cinema,
  // or Server 1 (VidLink 4K Fast) as the primary buffer-free player.
  const defaultSelectedServer = (isBolly && bollyServer)
    ? bollyServer
    : (isAsian && asianServer)
    ? asianServer
    : DEFAULT_SERVER;

  const [activeServer, setActiveServer] = useState<StreamingServer>(defaultSelectedServer);
  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [serverStatusMessage, setServerStatusMessage] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  // TV Multi-Season & Multi-Episode State
  const [tvDetails, setTvDetails] = useState<TVDetails | null>(() => {
    if (media.seasons && media.seasons.length > 0) {
      return {
        seasonsCount: media.seasonsCount || media.seasons.length,
        totalEpisodes: media.totalEpisodes || 0,
        seasons: media.seasons,
        imdbId: media.imdbId
      };
    }
    return null;
  });

  const [episodeViewMode, setEpisodeViewMode] = useState<'seasons' | 'absolute'>('seasons');
  const [jumpInputVal, setJumpInputVal] = useState<string>('');
  const [showJumpInput, setShowJumpInput] = useState<boolean>(false);

  // Fetch full TV show season structure & total episodes if type is TV
  useEffect(() => {
    if (media.type === 'tv') {
      fetchTVShowDetails(media.id).then(details => {
        if (details) {
          setTvDetails(details);
        }
      }).catch(err => console.warn('Failed to fetch TV details:', err));
    }
  }, [media.id, media.type]);

  // Loading & Auto-Failover State
  const [isStreamLoading, setIsStreamLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(20);
  const [serverErrorNotice, setServerErrorNotice] = useState<string | null>(null);
  const [failedServerIds, setFailedServerIds] = useState<Set<string>>(new Set());
  const [autoFailoverEnabled, setAutoFailoverEnabled] = useState<boolean>(true);
  const [failoverCountdown, setFailoverCountdown] = useState<number | null>(null);
  const [pendingNextServer, setPendingNextServer] = useState<StreamingServer | null>(null);
  const [isUkHelpOpen, setIsUkHelpOpen] = useState<boolean>(false);

  const failedServerIdsRef = useRef<Set<string>>(new Set());
  const watchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamVerificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keyboard shortcuts (N: Next Server, R: Reload, Esc: Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleNextServerFallback('Manual quick-switch (N)');
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReload();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeServer.id]);

  // Calculate current stream URL (using TMDB ID and real IMDb ID if present)
  const streamUrl = media.type === 'movie'
    ? activeServer.getMovieUrl(media.id, media.imdbId)
    : activeServer.getSeriesUrl(media.id, season, episode, media.imdbId);

  // Cancel any scheduled auto-failover countdown
  const cancelScheduledFailover = () => {
    if (autoSwitchTimerRef.current) clearTimeout(autoSwitchTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (streamVerificationTimerRef.current) clearTimeout(streamVerificationTimerRef.current);
    setFailoverCountdown(null);
    setPendingNextServer(null);
    setServerErrorNotice(null);
  };

  // Switch server with clean state reset
  const handleServerSwitch = (server: StreamingServer, isAutoFailover: boolean = false) => {
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    if (autoSwitchTimerRef.current) clearTimeout(autoSwitchTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (streamVerificationTimerRef.current) clearTimeout(streamVerificationTimerRef.current);

    setFailoverCountdown(null);
    setPendingNextServer(null);
    setActiveServer(server);
    setIframeKey(prev => prev + 1);
    setIsStreamLoading(true);
    setLoadingProgress(25);
    setServerErrorNotice(null);

    const msg = isAutoFailover
      ? `Auto-switched to ${server.name}`
      : `Switched to ${server.name} (${server.badge})`;
    setServerStatusMessage(msg);
    setTimeout(() => setServerStatusMessage(null), 3500);
  };

  // Auto-move to next server when current server fails, times out, or cannot display
  const handleNextServerFallback = (autoReason?: string) => {
    // Record current server as failed synchronously
    failedServerIdsRef.current.add(activeServer.id);
    setFailedServerIds(new Set(failedServerIdsRef.current));

    const currentIndex = STREAMING_SERVERS.findIndex(s => s.id === activeServer.id);

    // Look for next server that has not failed
    let nextIndex = (currentIndex + 1) % STREAMING_SERVERS.length;
    let attempts = 0;
    while (failedServerIdsRef.current.has(STREAMING_SERVERS[nextIndex].id) && attempts < STREAMING_SERVERS.length) {
      nextIndex = (nextIndex + 1) % STREAMING_SERVERS.length;
      attempts++;
    }

    // If all servers have failed, reset to allow retrying primary sources
    if (attempts >= STREAMING_SERVERS.length) {
      failedServerIdsRef.current.clear();
      setFailedServerIds(new Set());
      nextIndex = (currentIndex + 1) % STREAMING_SERVERS.length;
    }

    const nextServer = STREAMING_SERVERS[nextIndex];

    if (autoReason && autoFailoverEnabled) {
      setPendingNextServer(nextServer);
      setServerErrorNotice(`${autoReason}. Auto-moving to ${nextServer.name}...`);

      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (autoSwitchTimerRef.current) clearTimeout(autoSwitchTimerRef.current);

      let secondsLeft = 3;
      setFailoverCountdown(secondsLeft);

      countdownIntervalRef.current = setInterval(() => {
        secondsLeft -= 1;
        if (secondsLeft <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          setFailoverCountdown(null);
          setPendingNextServer(null);
          handleServerSwitch(nextServer, true);
        } else {
          setFailoverCountdown(secondsLeft);
        }
      }, 1000);
    } else {
      handleServerSwitch(nextServer, false);
    }
  };

  const handleReload = () => {
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    if (autoSwitchTimerRef.current) clearTimeout(autoSwitchTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (streamVerificationTimerRef.current) clearTimeout(streamVerificationTimerRef.current);
    setFailoverCountdown(null);
    setPendingNextServer(null);
    setIsStreamLoading(true);
    setLoadingProgress(20);
    setServerErrorNotice(null);
    setIframeKey(prev => prev + 1);
    setServerStatusMessage('Reloading video player stream...');
    setTimeout(() => setServerStatusMessage(null), 2500);
  };

  // Watchdog & Progress Simulator on server or episode change
  useEffect(() => {
    if (activeServer.id === 'webtorrent') {
      setIsStreamLoading(false);
      return;
    }

    setIsStreamLoading(true);
    setLoadingProgress(25);

    const p1 = setTimeout(() => setLoadingProgress(50), 1000);
    const p2 = setTimeout(() => setLoadingProgress(75), 2500);
    const p3 = setTimeout(() => setLoadingProgress(90), 4500);

    // Initial connection watchdog (20 seconds for slow TV Wi-Fi)
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    if (autoFailoverEnabled) {
      watchdogTimerRef.current = setTimeout(() => {
        handleNextServerFallback(`${activeServer.name} connection timeout`);
      }, 20000);
    }

    return () => {
      clearTimeout(p1);
      clearTimeout(p2);
      clearTimeout(p3);
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      if (autoSwitchTimerRef.current) clearTimeout(autoSwitchTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (streamVerificationTimerRef.current) clearTimeout(streamVerificationTimerRef.current);
    };
  }, [activeServer.id, iframeKey, season, episode, autoFailoverEnabled]);

  // PostMessage listener for embeds that emit error or playback events
  useEffect(() => {
    const handlePostMessage = (event: MessageEvent) => {
      try {
        const raw = event.data;
        if (!raw) return;
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

        // Detect player errors
        const isError =
          data.event === 'error' ||
          data.type === 'PLAYER_ERROR' ||
          data.type === 'error' ||
          data.status === 'error' ||
          data.action === 'error' ||
          data.type === 'cant_play' ||
          (typeof data.msg === 'string' && data.msg.toLowerCase().includes('error')) ||
          (typeof data.message === 'string' && data.message.toLowerCase().includes('error'));

        if (isError && autoFailoverEnabled) {
          console.warn(`[Auto-Failover] Player error from ${activeServer.name}:`, data);
          handleNextServerFallback(`${activeServer.name} stream error`);
          return;
        }

        // Detect confirmed playback
        const isPlaying =
          data.event === 'playing' ||
          data.event === 'timeupdate' ||
          data.type === 'MEDIA_DATA' ||
          (data.type === 'PLAYER_EVENT' && (data.data?.event === 'playing' || data.data?.event === 'ready'));

        if (isPlaying) {
          if (streamVerificationTimerRef.current) clearTimeout(streamVerificationTimerRef.current);
          if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
          cancelScheduledFailover();
          setIsStreamLoading(false);
        }
      } catch {
        // Non-JSON message, ignore safely
      }
    };

    window.addEventListener('message', handlePostMessage);
    return () => {
      window.removeEventListener('message', handlePostMessage);
    };
  }, [activeServer.id, autoFailoverEnabled]);

  // Iframe load handler: stream delivered successfully, keep user on this server!
  const handleIframeLoaded = () => {
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    if (streamVerificationTimerRef.current) clearTimeout(streamVerificationTimerRef.current);
    cancelScheduledFailover();
    setLoadingProgress(100);
    setIsStreamLoading(false);
  };

  const handleIframeError = () => {
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    if (streamVerificationTimerRef.current) clearTimeout(streamVerificationTimerRef.current);
    handleNextServerFallback(`${activeServer.name} stream error`);
  };

  // Auto-sync real IMDb ID for Stremio and VidSrc
  useEffect(() => {
    if (!media.imdbId) {
      syncImdbId(media).then(imdb => {
        if (imdb) {
          setIframeKey(k => k + 1);
        }
      });
    }
  }, [media]);

  // Track and persist playback history session
  useEffect(() => {
    // Initial progress save when player starts
    savePlaybackProgress(media, season, episode, 120);

    // Incrementally update progress every 15 seconds of watch time
    const interval = setInterval(() => {
      savePlaybackProgress(media, season, episode, 15);
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, [media, season, episode]);

  // Auto-focus the active server button on open for instant remote navigation
  useEffect(() => {
    const targetBtn = document.getElementById(`server-btn-${defaultSelectedServer.id}`);
    if (targetBtn) {
      targetBtn.focus();
    }
  }, [defaultSelectedServer.id]);

  const seasonsList: SeasonInfo[] = tvDetails?.seasons && tvDetails.seasons.length > 0
    ? tvDetails.seasons
    : media.seasons && media.seasons.length > 0
      ? media.seasons
      : Array.from({ length: media.seasonsCount || 1 }, (_, i) => ({
          seasonNumber: i + 1,
          name: `Season ${i + 1}`,
          episodeCount: media.episodesPerSeason || 10
        }));

  const currentSeasonInfo = seasonsList.find(s => s.seasonNumber === season) || seasonsList[0];
  const totalEpisodesInSeason = currentSeasonInfo?.episodeCount || media.episodesPerSeason || 10;
  const currentAbsoluteEp = getAbsoluteEpisodeNumber(seasonsList, season, episode);
  const totalAllEpisodes = seasonsList.reduce((acc, s) => s.seasonNumber > 0 ? acc + s.episodeCount : acc, 0) || tvDetails?.totalEpisodes || media.totalEpisodes || totalEpisodesInSeason;

  const hasPrevEp = episode > 1 || season > 1;
  const hasNextEp = episode < totalEpisodesInSeason || seasonsList.some(s => s.seasonNumber > season);

  const handlePrevEpisode = () => {
    if (episode > 1) {
      const prev = episode - 1;
      setEpisode(prev);
      setIframeKey(k => k + 1);
    } else if (season > 1) {
      const prevSeasonNum = season - 1;
      const prevSeason = seasonsList.find(s => s.seasonNumber === prevSeasonNum);
      const prevLastEp = prevSeason?.episodeCount || 1;
      setSeason(prevSeasonNum);
      setEpisode(prevLastEp);
      setIframeKey(k => k + 1);
    }
  };

  const handleNextEpisode = () => {
    if (episode < totalEpisodesInSeason) {
      const nxt = episode + 1;
      setEpisode(nxt);
      setIframeKey(k => k + 1);
    } else {
      const nextSeason = seasonsList.find(s => s.seasonNumber > season);
      if (nextSeason) {
        setSeason(nextSeason.seasonNumber);
        setEpisode(1);
        setIframeKey(k => k + 1);
      }
    }
  };

  const handleJumpToEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(jumpInputVal.trim(), 10);
    if (!isNaN(parsed) && parsed >= 1) {
      if (parsed <= totalEpisodesInSeason && episodeViewMode === 'seasons' && !isAnime) {
        setEpisode(parsed);
        setIframeKey(k => k + 1);
      } else {
        // Universal Absolute Episode Resolver
        const resolved = getSeasonAndEpisodeFromAbsolute(seasonsList, parsed);
        setSeason(resolved.season);
        setEpisode(resolved.episode);
        setIframeKey(k => k + 1);
        setServerStatusMessage(`Jumped to Ep #${parsed} (${resolved.seasonName || `Season ${resolved.season}`})`);
        setTimeout(() => setServerStatusMessage(null), 3000);
      }
      setShowJumpInput(false);
      setJumpInputVal('');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#08090D] overflow-y-auto text-white flex flex-col selection:bg-brand-accent selection:text-white"
      data-tv-scope="player"
    >
      {/* 1. Normal Web Streaming Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#08090D]/95 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-brand-accent text-white text-xs sm:text-sm font-bold border border-white/10 transition shrink-0 hover:scale-105 active:scale-95"
            title="Back to Catalog (Esc)"
          >
            <span>←</span>
            <span className="hidden sm:inline">Back to Browse</span>
          </button>
          
          <div className="min-w-0">
            <div className="flex items-center space-x-2 truncate">
              <h1 className="text-base sm:text-lg md:text-xl font-black text-white truncate">
                {media.title}
              </h1>
              {media.type === 'tv' && (
                <span className="shrink-0 px-2 py-0.5 rounded-md bg-brand-accent text-[11px] font-black uppercase text-white shadow">
                  S{season} E{episode} {totalAllEpisodes > 60 ? `• #${currentAbsoluteEp}` : ''}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-gray-400">
              <span>{media.year}</span>
              <span>&bull;</span>
              <span>⭐ {media.rating}</span>
              <span>&bull;</span>
              <span className="truncate max-w-[150px] sm:max-w-xs">{media.genre}</span>
              {media.imdbId && (
                <>
                  <span className="hidden md:inline">&bull;</span>
                  <span className="hidden md:inline font-mono text-gray-500">{media.imdbId}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Top Controls: Auto-Switch, UK Help, Reload, Close (Fullscreen Button Removed) */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <button
            onClick={() => setIsUkHelpOpen(true)}
            className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs sm:text-sm font-semibold border border-indigo-500/40 transition shadow-sm"
            title="UK ISP Streaming Fix Guide"
          >
            <span>🇬🇧 UK / Block Fix</span>
          </button>

          <button
            onClick={() => {
              setAutoFailoverEnabled(prev => !prev);
              if (autoFailoverEnabled) {
                cancelScheduledFailover();
              }
            }}
            className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              autoFailoverEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
            }`}
            title="Toggle Automatic Server Failover on Error / Timeout"
          >
            <span>⚡ Auto-Switch: {autoFailoverEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={handleReload}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 text-xs sm:text-sm font-semibold border border-white/10 transition"
            title="Reload Video Stream (R)"
          >
            <RefreshIcon size={14} />
            <span className="hidden sm:inline">Reload</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white text-xs sm:text-sm font-bold shadow-cinema-glow transition hover:scale-105 active:scale-95"
            title="Close Player (Esc)"
          >
            <CloseIcon size={16} />
            <span>Close</span>
          </button>
        </div>
      </header>

      {/* 2. Main Normal Streaming Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6">
        
        {/* Theater Video Player Box */}
        <div className="relative w-full aspect-video max-h-[75vh] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          {serverStatusMessage && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-full bg-brand-accent text-white font-bold text-xs sm:text-sm shadow-cinema-glow flex items-center space-x-2 animate-bounce">
              <CheckIcon size={16} />
              <span>{serverStatusMessage}</span>
            </div>
          )}

          {/* Floating Auto-Failover Countdown Banner */}
          {failoverCountdown !== null && pendingNextServer && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-2xl bg-[#14151f]/95 border border-amber-500/50 shadow-cinema-glow flex items-center space-x-3.5 backdrop-blur-md animate-fadeIn select-none">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0">
                <span className="text-amber-400 font-black text-sm">{failoverCountdown}</span>
              </div>
              <div className="flex flex-col text-left">
                <div className="text-white text-xs font-bold flex items-center gap-1.5">
                  <AlertIcon size={14} className="text-amber-400" />
                  <span>{serverErrorNotice || `Stream issue on ${activeServer.name}`}</span>
                </div>
                <div className="text-gray-300 text-[11px]">
                  Auto-switching to <span className="text-amber-300 font-semibold">{pendingNextServer.name}</span> in {failoverCountdown}s
                </div>
              </div>
              <div className="flex items-center space-x-2 pl-2 border-l border-white/10">
                <button
                  onClick={() => {
                    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                    setFailoverCountdown(null);
                    setPendingNextServer(null);
                    handleServerSwitch(pendingNextServer, true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-bold shadow-cinema-glow transition shrink-0"
                >
                  Switch Now ⏭️
                </button>
                <button
                  onClick={cancelScheduledFailover}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-medium transition shrink-0"
                >
                  Stay
                </button>
              </div>
            </div>
          )}

          {/* Cinematic Stream Loading & Auto-Failover Overlay */}
          {isStreamLoading && (
            <div className="absolute inset-0 z-20 bg-[#08090D]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-brand-accent/20 animate-ping" />
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-t-brand-accent border-r-transparent border-b-brand-accent/30 border-l-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ServerIcon size={22} className="text-brand-accent animate-pulse" />
                </div>
              </div>

              <h3 className="text-lg sm:text-2xl font-bold text-white mb-2 tracking-wide">
                {serverErrorNotice ? (
                  <span className="text-amber-400 flex items-center justify-center gap-2">
                    <AlertIcon size={20} className="text-amber-400 shrink-0" />
                    <span>{serverErrorNotice}</span>
                  </span>
                ) : (
                  <span>Connecting to {activeServer.name}</span>
                )}
              </h3>

              <p className="text-xs sm:text-sm text-gray-300 max-w-md mb-5 font-medium">
                {serverErrorNotice
                  ? "Switching to next resilient server automatically..."
                  : `Buffering high quality ${activeServer.quality} stream for "${media.title}"...`}
              </p>

              <div className="w-full max-w-md bg-white/10 h-2 rounded-full overflow-hidden mb-5 border border-white/10">
                <div 
                  className="bg-gradient-to-r from-brand-accent to-amber-500 h-full rounded-full transition-all duration-500 ease-out shadow-cinema-glow"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>

              <button
                onClick={() => handleNextServerFallback("User skipped")}
                className="px-4 py-2 rounded-xl bg-brand-surface hover:bg-white/10 text-white text-xs sm:text-sm font-bold border border-brand-border transition flex items-center space-x-2 shadow-md"
              >
                <RefreshIcon size={14} />
                <span>Skip to Next Server</span>
              </button>
            </div>
          )}

          {/* Stream Iframe or WebTorrent Player */}
          {activeServer.id === 'webtorrent' ? (
            <WebTorrentNativeView mediaTitle={media.title} />
          ) : (
            <iframe
              key={iframeKey}
              src={streamUrl}
              className="w-full h-full border-0"
              allowFullScreen
              referrerPolicy="no-referrer"
              allow="autoplay *; encrypted-media *; fullscreen *; picture-in-picture *; accelerometer; gyroscope"
              onLoad={handleIframeLoaded}
              onError={handleIframeError}
              title={`${media.title} Stream`}
            />
          )}
        </div>

        {/* 3. Under-Player Episode Controls (for TV Shows) */}
        {media.type === 'tv' && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12131A] p-3.5 sm:p-4 rounded-2xl border border-white/10 shadow-md">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={handlePrevEpisode}
                disabled={!hasPrevEp}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  hasPrevEp 
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10' 
                    : 'opacity-40 cursor-not-allowed bg-black/20 text-gray-500'
                }`}
              >
                <span>← Prev Episode</span>
              </button>

              <button
                onClick={handleNextEpisode}
                disabled={!hasNextEp}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  hasNextEp 
                    ? 'bg-brand-accent hover:bg-brand-accent-hover text-white shadow-cinema-glow' 
                    : 'opacity-40 cursor-not-allowed bg-black/20 text-gray-500'
                }`}
              >
                <span>Next Episode →</span>
              </button>

              <span className="text-xs sm:text-sm text-gray-300 font-semibold hidden md:inline ml-2">
                Now Playing: Season {season}, Episode {episode} {totalAllEpisodes > 60 ? `(#${currentAbsoluteEp})` : ''}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active Server: <strong className="text-white">{activeServer.name}</strong></span>
            </div>
          </div>
        )}

        {/* UK / Regional ISP Block Alert Banner (shown when servers fail) */}
        {failedServerIds.size >= 2 && (
          <div className="p-4 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm shadow-xl backdrop-blur-md animate-fadeIn">
            <div className="flex items-center space-x-3">
              <span className="text-2xl shrink-0">🇬🇧</span>
              <div>
                <span className="font-bold text-white text-sm">Streaming not loading in the UK?</span>
                <p className="text-indigo-200/90 text-xs mt-0.5">
                  UK ISPs (Virgin Media, BT, Sky, EE) actively block streaming servers by default. You can bypass this in 30 seconds!
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsUkHelpOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition shrink-0 hover:scale-105 active:scale-95"
            >
              See 30-Sec Fix →
            </button>
          </div>
        )}

        {/* 4. Streaming Servers Grid */}
        <div className="bg-[#12131A] p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-white font-bold text-sm sm:text-base">
              <ServerIcon size={18} className="text-brand-accent" />
              <span>Streaming Servers &amp; Mirrors</span>
              <span className="text-xs font-normal text-gray-400 hidden sm:inline">({STREAMING_SERVERS.length} Fast Embed Servers)</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsUkHelpOpen(true)}
                className="text-xs text-indigo-300 hover:text-indigo-200 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 px-2.5 py-1 rounded-lg font-medium transition flex items-center space-x-1"
                title="Fix streaming blocks for UK & regional ISPs"
              >
                <span>🇬🇧 In UK or blocked?</span>
              </button>
              <button
                onClick={() => handleNextServerFallback('Manual switch')}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1 font-semibold transition"
              >
                <RefreshIcon size={13} />
                <span>Next Server (N)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {STREAMING_SERVERS.map((server) => {
              const isSelected = activeServer.id === server.id;
              const hasFailed = failedServerIds.has(server.id);
              return (
                <button
                  key={server.id}
                  id={`server-btn-${server.id}`}
                  onClick={() => handleServerSwitch(server)}
                  className={`px-3 py-2.5 rounded-xl text-left transition flex flex-col justify-between space-y-1.5 ${
                    isSelected
                      ? 'bg-brand-accent text-white shadow-cinema-glow ring-2 ring-white/30'
                      : hasFailed
                      ? 'bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate max-w-[120px]">{server.name}</span>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      hasFailed 
                        ? 'bg-rose-500' 
                        : server.isTorrent 
                        ? 'bg-purple-400 animate-ping' 
                        : 'bg-emerald-400'
                    }`} />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded font-black ${
                      isSelected ? 'bg-black/30 text-white' : hasFailed ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 text-brand-muted'
                    }`}>
                      {hasFailed ? 'Failed' : server.badge}
                    </span>
                    <span className="text-gray-400 font-mono">{server.quality.split(' ')[0]}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Seasons & Episode Selector Grid (TV Shows Only) */}
        {media.type === 'tv' && (
          <div className="bg-[#12131A] p-4 sm:p-5 rounded-2xl border border-white/10 space-y-4 shadow-md">
            {/* Season Switcher & Mode Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-2">
              <div className="flex items-center space-x-2 overflow-x-auto py-1">
                <span className="text-xs uppercase font-extrabold text-gray-400 flex items-center gap-1.5 shrink-0">
                  <TvIcon size={14} className="text-brand-accent" /> Season:
                </span>
                {seasonsList.map(sInfo => {
                  const isSelected = season === sInfo.seasonNumber;
                  return (
                    <button
                      key={`season-${sInfo.seasonNumber}`}
                      onClick={() => {
                        setSeason(sInfo.seasonNumber);
                        setEpisode(1);
                        setIframeKey(k => k + 1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center space-x-1.5 ${
                        isSelected 
                          ? 'bg-brand-accent text-white shadow-cinema-glow ring-2 ring-white/30' 
                          : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
                      }`}
                    >
                      <span>{sInfo.seasonNumber === 0 ? 'Specials' : `S${sInfo.seasonNumber}`}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isSelected ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-400'
                      }`}>
                        {sInfo.episodeCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* View Mode & Jump Input */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setEpisodeViewMode(prev => prev === 'seasons' ? 'absolute' : 'seasons')}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition"
                >
                  {episodeViewMode === 'seasons' ? '🎌 View All Episodes' : '📁 View by Season'}
                </button>

                {showJumpInput ? (
                  <form onSubmit={handleJumpToEpisode} className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={totalAllEpisodes}
                      placeholder={`1-${totalAllEpisodes}`}
                      value={jumpInputVal}
                      onChange={(e) => setJumpInputVal(e.target.value)}
                      autoFocus
                      className="w-20 px-2 py-1 rounded-lg bg-black/80 border border-brand-accent text-white text-xs font-mono text-center focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-lg bg-brand-accent text-white text-xs font-bold hover:bg-brand-accent-hover"
                    >
                      Go
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowJumpInput(false)}
                      className="text-gray-400 hover:text-white text-xs px-1"
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowJumpInput(true)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold border border-white/10 transition"
                  >
                    Jump #
                  </button>
                )}
              </div>
            </div>

            {/* Episode Grid: Natural Web Grid! */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 max-h-72 overflow-y-auto pr-1">
              {episodeViewMode === 'seasons' ? (
                Array.from({ length: totalEpisodesInSeason }, (_, idx) => idx + 1).map(eNum => {
                  const isCurrent = episode === eNum;
                  const absEp = getAbsoluteEpisodeNumber(seasonsList, season, eNum);
                  return (
                    <button
                      key={`ep-${eNum}`}
                      id={`ep-btn-${eNum}`}
                      onClick={() => {
                        setEpisode(eNum);
                        setIframeKey(k => k + 1);
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center ${
                        isCurrent 
                          ? 'bg-brand-accent text-white shadow-cinema-glow ring-2 ring-white/50 scale-105' 
                          : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/15 border border-white/10'
                      }`}
                    >
                      <span>Ep {eNum}</span>
                      {totalAllEpisodes > 60 && (
                        <span className={`text-[9px] font-mono ${isCurrent ? 'text-white' : 'text-gray-400'}`}>
                          #{absEp}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                Array.from({ length: totalAllEpisodes }, (_, idx) => idx + 1).map(targetAbsNum => {
                  const isCurrent = currentAbsoluteEp === targetAbsNum;
                  return (
                    <button
                      key={`abs-ep-${targetAbsNum}`}
                      id={`abs-ep-btn-${targetAbsNum}`}
                      onClick={() => {
                        const resolved = getSeasonAndEpisodeFromAbsolute(seasonsList, targetAbsNum);
                        setSeason(resolved.season);
                        setEpisode(resolved.episode);
                        setIframeKey(k => k + 1);
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                        isCurrent 
                          ? 'bg-brand-accent text-white shadow-cinema-glow ring-2 ring-white/50 scale-105' 
                          : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/15 border border-white/10'
                      }`}
                    >
                      #{targetAbsNum}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 6. Media Details Card */}
        <div className="bg-[#12131A] p-4 sm:p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-5 shadow-md">
          <img
            src={media.poster}
            alt={media.title}
            className="w-24 sm:w-32 rounded-xl object-cover shadow-lg border border-white/10 shrink-0 self-start"
          />
          <div className="space-y-2.5 flex-1">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white">{media.title}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-accent/20 text-brand-accent text-xs font-bold border border-brand-accent/30">
                {media.type === 'movie' ? 'Feature Film' : 'TV Series'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                ⭐ {media.rating} / 10
              </span>
              <span className="text-xs text-gray-400">{media.year}</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-4xl">
              {media.overview || 'No synopsis available for this title.'}
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-400 pt-1">
              <span className="font-semibold text-gray-300">Genre:</span>
              <span>{media.genre}</span>
              {media.imdbId && (
                <>
                  <span>&bull;</span>
                  <a
                    href={`https://www.imdb.com/title/${media.imdbId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline font-mono"
                  >
                    IMDb {media.imdbId} ↗
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* 🇬🇧 UK & Regional Block Troubleshooting Modal */}
      {isUkHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="bg-[#131522] border border-white/15 rounded-3xl max-w-2xl w-full p-5 sm:p-7 space-y-5 shadow-2xl overflow-y-auto max-h-[92vh]">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">🇬🇧</span>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white">Why Streaming Fails in the UK & How to Fix It</h2>
                  <p className="text-xs sm:text-sm text-gray-400">Step-by-step 30-second fixes for Virgin Media, BT, Sky, EE & TalkTalk</p>
                </div>
              </div>
              <button
                onClick={() => setIsUkHelpOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 transition"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm leading-relaxed">
              <strong>Why none of the servers load:</strong> In the UK, High Court copyright injunctions mandate all major home broadband providers (Virgin Media, Sky, BT, EE, TalkTalk) to block free streaming embeds & third-party CDNs by default. In an embedded player, this causes infinite spinning or connection refused errors.
            </div>

            <div className="space-y-3.5">
              {/* Fix 1: Secure DNS */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-xs">Method 1 (Fastest & Free - 30s)</span>
                  <h3 className="text-sm sm:text-base font-bold text-white">Turn on Secure DNS in Browser</h3>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  No app download needed. This forces your browser to bypass your UK ISP's blocked DNS resolvers:
                </p>
                <ol className="list-decimal list-inside text-xs text-gray-300 space-y-1.5 bg-black/30 p-3 rounded-xl border border-white/5 font-mono text-[11px] sm:text-xs">
                  <li>In Chrome, Brave, or Edge, click <strong>Settings</strong>.</li>
                  <li>Click <strong>Privacy and security</strong> &rarr; <strong>Security</strong>.</li>
                  <li>Scroll to <strong>Use secure DNS</strong> and toggle it <strong>ON</strong>.</li>
                  <li>Select <strong>With: Cloudflare (1.1.1.1)</strong> or <strong>Google (Public DNS)</strong>.</li>
                  <li>Refresh this page and choose any server. It will load immediately!</li>
                </ol>
              </div>

              {/* Fix 2: VPN */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 font-bold text-xs">Method 2 (100% Guaranteed)</span>
                  <h3 className="text-sm sm:text-base font-bold text-white">Use Cloudflare WARP or a Free VPN</h3>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  A VPN or WARP completely encrypts your traffic so your UK ISP cannot see or block the video stream:
                </p>
                <ul className="list-disc list-inside text-xs text-gray-300 space-y-1 bg-black/30 p-3 rounded-xl border border-white/5">
                  <li><strong>Cloudflare 1.1.1.1 with WARP:</strong> Official free 1-click app from Cloudflare (visit <a href="https://1.1.1.1" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-semibold">1.1.1.1</a>).</li>
                  <li><strong>ProtonVPN Free:</strong> Completely free unlimited bandwidth VPN (visit <a href="https://protonvpn.com/free-vpn" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline font-semibold">protonvpn.com</a>).</li>
                  <li>Connect to any location and refresh the page.</li>
                </ul>
              </div>

              {/* Fix 3: Turn off ISP parental controls */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 font-bold text-xs">Method 3 (Router Setting)</span>
                  <h3 className="text-sm sm:text-base font-bold text-white">Turn Off ISP Parental Shield / Web Safe</h3>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  UK broadband providers enable automatic filters out of the box that classify streaming CDNs as restricted:
                </p>
                <ul className="list-disc list-inside text-xs text-gray-300 space-y-1 bg-black/30 p-3 rounded-xl border border-white/5">
                  <li><strong>Virgin Media:</strong> Log into Virgin Media account &rarr; My Apps &rarr; Web Safe &rarr; Turn OFF "Child Safe".</li>
                  <li><strong>Sky:</strong> Log into My Sky &rarr; Broadband Shield &rarr; Set to "Off".</li>
                  <li><strong>BT:</strong> Log into My BT &rarr; Broadband &rarr; Parental Controls &rarr; Turn OFF.</li>
                  <li><strong>EE:</strong> Log into My EE &rarr; Manage Device &rarr; Content Lock &rarr; Turn OFF.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsUkHelpOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-xs sm:text-sm shadow-cinema-glow transition hover:scale-105 active:scale-95"
              >
                Back to Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
