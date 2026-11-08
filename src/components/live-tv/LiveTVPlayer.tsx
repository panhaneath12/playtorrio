import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import type { TvChannel } from '../../modules/live-tv/types';
import { 
  CloseIcon, 
  PlayIcon, 
  RefreshIcon, 
  HeartIcon, 
  VolumeUpIcon, 
  VolumeMuteIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AlertIcon
} from '../common/Icons';

interface LiveTVPlayerProps {
  channel: TvChannel;
  allChannels: TvChannel[];
  isFavorite: boolean;
  onToggleFavorite: (channelId: string) => void;
  onSelectChannel: (channel: TvChannel) => void;
  onClose: () => void;
}

export const LiveTVPlayer: React.FC<LiveTVPlayerProps> = ({
  channel,
  allChannels,
  isFavorite,
  onToggleFavorite,
  onSelectChannel,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [activeStreamIndex, setActiveStreamIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playerState, setPlayerState] = useState<'loading' | 'playing' | 'buffering' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [showControls, setShowControls] = useState<boolean>(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const streams = channel.streams && channel.streams.length > 0
    ? channel.streams
    : [{ url: '', quality: 'HD', title: 'Default Stream' }];
  const currentStream = streams[activeStreamIndex] || streams[0];

  // Auto-hide HUD controls after 5 seconds of inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 5000);
  }, []);

  // Channel switching helpers
  const currentChannelIndex = allChannels.findIndex(c => c.id === channel.id);
  const hasPrev = currentChannelIndex > 0;
  const hasNext = currentChannelIndex < allChannels.length - 1;

  const handlePrevChannel = useCallback(() => {
    if (hasPrev) {
      onSelectChannel(allChannels[currentChannelIndex - 1]);
      setActiveStreamIndex(0);
      setRetryCount(0);
    }
  }, [allChannels, currentChannelIndex, hasPrev, onSelectChannel]);

  const handleNextChannel = useCallback(() => {
    if (hasNext) {
      onSelectChannel(allChannels[currentChannelIndex + 1]);
      setActiveStreamIndex(0);
      setRetryCount(0);
    }
  }, [allChannels, currentChannelIndex, hasNext, onSelectChannel]);

  // Fullscreen controller
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Load and play HLS stream
  const playStream = useCallback((streamUrl: string) => {
    const video = videoRef.current;
    if (!video || !streamUrl) {
      setPlayerState('error');
      setErrorMessage('No valid stream URL provided.');
      return;
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setPlayerState('loading');
    setErrorMessage(null);

    // HLS.js for browsers supporting MediaSourceExtensions
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        manifestLoadingTimeOut: 12000,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        }
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const p = video.play();
        if (p !== undefined) {
          p.then(() => {
            setIsPlaying(true);
            setPlayerState('playing');
          }).catch((e) => {
            console.warn('Autoplay unmuted blocked, retrying muted for Android TV:', e);
            video.muted = true;
            setIsMuted(true);
            video.play().then(() => {
              setIsPlaying(true);
              setPlayerState('playing');
            }).catch(() => {
              setIsPlaying(false);
              setPlayerState('playing');
            });
          });
        }
      });

      hls.on(Hls.Events.BUFFER_APPENDING, () => {
        setPlayerState('playing');
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try next stream if available and retry count < 3
              if (activeStreamIndex < streams.length - 1) {
                console.warn(`Stream ${activeStreamIndex + 1} network error, trying alternative stream...`);
                setActiveStreamIndex(prev => prev + 1);
              } else if (retryCount < 3) {
                setRetryCount(c => c + 1);
                hls.startLoad();
              } else {
                setPlayerState('error');
                setErrorMessage('Stream unavailable. Network or CORS connection failed.');
                hls.destroy();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setPlayerState('error');
              setErrorMessage('Stream format error. Switch stream or channel.');
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple & Android WebView HLS
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().then(() => {
          setIsPlaying(true);
          setPlayerState('playing');
        }).catch(() => {
          setIsPlaying(false);
          setPlayerState('playing');
        });
      }, { once: true });

      video.addEventListener('error', () => {
        if (activeStreamIndex < streams.length - 1) {
          setActiveStreamIndex(prev => prev + 1);
        } else {
          setPlayerState('error');
          setErrorMessage('Playback error on native HLS player.');
        }
      }, { once: true });
    } else {
      setPlayerState('error');
      setErrorMessage('HLS Live Streaming is not supported on this browser.');
    }
  }, [activeStreamIndex, streams, retryCount]);

  // Trigger stream loading whenever channel or active stream index changes
  useEffect(() => {
    if (currentStream?.url) {
      playStream(currentStream.url);
    }
    resetControlsTimer();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentStream?.url, playStream, resetControlsTimer]);

  // Remote D-Pad Navigation & Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetControlsTimer();

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handlePrevChannel();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleNextChannel();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setIsMuted(prev => !prev);
          break;
        case ' ':
          e.preventDefault();
          if (videoRef.current) {
            if (videoRef.current.paused) {
              videoRef.current.play();
              setIsPlaying(true);
            } else {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {});
          } else {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevChannel, handleNextChannel, resetControlsTimer, onClose]);

  // Keep mute state synced to HTML5 video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none overflow-hidden"
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
        autoPlay
        muted={isMuted}
        onClick={() => {
          if (videoRef.current) {
            if (videoRef.current.paused) {
              videoRef.current.play();
              setIsPlaying(true);
            } else {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        }}
      />

      {/* TOP HUD BAR */}
      <div className={`absolute top-0 left-0 right-0 z-30 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
        showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Channel Identity */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              data-tv-nav="true"
              data-tv-scope="livetv"
              onClick={onClose}
              className="tv-focus-target p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md"
              title="Return to Channel Directory (Back / Esc)"
            >
              <CloseIcon size={20} />
            </button>

            <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/20 flex items-center justify-center p-1.5 overflow-hidden backdrop-blur-md shrink-0">
              {channel.logo ? (
                <img src={channel.logo} alt={channel.name} className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-xl">{channel.countryFlag || '📺'}</span>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-xl font-black text-white">{channel.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>LIVE</span>
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-300">
                <span>{channel.countryFlag} {channel.countryName || channel.country}</span>
                <span>•</span>
                <span className="capitalize">{channel.categories[0] || 'General'}</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono font-bold">{currentStream.quality || '1080p'}</span>
              </div>
            </div>
          </div>

          {/* Top Right Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Stream Selector if multiple streams exist */}
            {streams.length > 1 && (
              <div className="flex items-center space-x-1 bg-black/60 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-bold text-brand-muted px-1.5 uppercase">Stream:</span>
                {streams.map((st, sIdx) => (
                  <button
                    key={`stream-${sIdx}`}
                    data-tv-nav="true"
                    data-tv-scope="livetv"
                    onClick={() => setActiveStreamIndex(sIdx)}
                    className={`tv-focus-target px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      activeStreamIndex === sIdx
                        ? 'bg-brand-accent text-white shadow'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    #{sIdx + 1} {st.quality || ''}
                  </button>
                ))}
              </div>
            )}

            {/* Favorite Button */}
            <button
              data-tv-nav="true"
              data-tv-scope="livetv"
              onClick={() => onToggleFavorite(channel.id)}
              className={`tv-focus-target p-2.5 rounded-xl border transition backdrop-blur-md ${
                isFavorite
                  ? 'bg-brand-accent text-white border-brand-accent shadow-cinema-glow'
                  : 'bg-white/10 text-gray-300 border-white/10 hover:text-white hover:bg-white/20'
              }`}
              title="Add to Favorites"
            >
              <HeartIcon size={18} filled={isFavorite} />
            </button>
          </div>
        </div>
      </div>

      {/* CENTER LOADING / ERROR STATES */}
      {playerState === 'loading' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
          <div className="w-14 h-14 rounded-full border-4 border-t-brand-accent border-r-transparent border-b-brand-accent/30 border-l-transparent animate-spin mb-4" />
          <h3 className="text-white text-base sm:text-lg font-bold">Connecting to {channel.name}...</h3>
          <p className="text-brand-muted text-xs mt-1">Acquiring live HLS adaptive feed</p>
        </div>
      )}

      {playerState === 'error' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4 text-rose-400">
            <AlertIcon size={28} />
          </div>
          <h3 className="text-white text-lg sm:text-xl font-bold mb-1">Live Feed Unavailable</h3>
          <p className="text-gray-300 text-xs sm:text-sm max-w-md mb-6">{errorMessage || 'Stream could not be decoded.'}</p>

          <div className="flex items-center space-x-3">
            <button
              data-tv-nav="true"
              data-tv-scope="livetv"
              onClick={() => playStream(currentStream.url)}
              className="tv-focus-target px-4 py-2 rounded-xl bg-brand-accent text-white text-xs sm:text-sm font-bold shadow-cinema-glow flex items-center space-x-2"
            >
              <RefreshIcon size={14} />
              <span>Retry Stream</span>
            </button>

            {hasNext && (
              <button
                data-tv-nav="true"
                data-tv-scope="livetv"
                onClick={handleNextChannel}
                className="tv-focus-target px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/10 flex items-center space-x-2"
              >
                <span>Next Channel »</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM HUD BAR */}
      <div className={`absolute bottom-0 left-0 right-0 z-30 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 ${
        showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          {/* EPG Now Playing / Next Up Bar */}
          {channel.currentProgram && (
            <div className="flex items-center justify-between text-xs bg-black/40 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
              <div className="flex items-center space-x-2 truncate">
                <span className="font-bold text-amber-400">NOW:</span>
                <span className="text-white font-medium truncate">{channel.currentProgram.title}</span>
              </div>
              {channel.nextProgram && (
                <div className="hidden sm:flex items-center space-x-2 text-gray-400 truncate pl-4">
                  <span className="font-bold text-gray-400">NEXT:</span>
                  <span className="truncate">{channel.nextProgram.title}</span>
                </div>
              )}
            </div>
          )}

          {/* Bottom Controls Row: Prev/Next Channel Surfing + Audio */}
          <div className="flex items-center justify-between">
            {/* Quick Channel Surfing Buttons */}
            <div className="flex items-center space-x-2">
              <button
                data-tv-nav="true"
                data-tv-scope="livetv"
                onClick={handlePrevChannel}
                disabled={!hasPrev}
                className={`tv-focus-target flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition backdrop-blur-md ${
                  hasPrev
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                    : 'opacity-40 cursor-not-allowed bg-black/20 text-gray-500'
                }`}
                title="Previous Channel (Remote UP)"
              >
                <ChevronLeftIcon size={16} />
                <span>Prev Channel (UP)</span>
              </button>

              <button
                data-tv-nav="true"
                data-tv-scope="livetv"
                onClick={handleNextChannel}
                disabled={!hasNext}
                className={`tv-focus-target flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold transition backdrop-blur-md ${
                  hasNext
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                    : 'opacity-40 cursor-not-allowed bg-black/20 text-gray-500'
                }`}
                title="Next Channel (Remote DOWN)"
              >
                <span>Next Channel (DOWN)</span>
                <ChevronRightIcon size={16} />
              </button>
            </div>

            {/* Play/Pause & Audio Mute Controls */}
            <div className="flex items-center space-x-2">
              <button
                data-tv-nav="true"
                data-tv-scope="livetv"
                onClick={() => {
                  if (videoRef.current) {
                    if (isPlaying) {
                      videoRef.current.pause();
                      setIsPlaying(false);
                    } else {
                      videoRef.current.play();
                      setIsPlaying(true);
                    }
                  }
                }}
                className="tv-focus-target p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md"
                title={isPlaying ? 'Pause Stream (Space)' : 'Play Stream (Space)'}
              >
                {isPlaying ? <span className="text-xs font-bold px-1">❚❚</span> : <PlayIcon size={16} />}
              </button>

              <button
                data-tv-nav="true"
                data-tv-scope="livetv"
                onClick={() => setIsMuted(m => !m)}
                className="tv-focus-target p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition backdrop-blur-md"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted ? <VolumeMuteIcon size={18} /> : <VolumeUpIcon size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
