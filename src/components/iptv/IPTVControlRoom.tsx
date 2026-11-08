import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { PLAYTORRIO_IPTV_CHANNELS } from '../../services/iptv';
import type { IPTVChannel } from '../../services/iptv';
import { CloseIcon, TvIcon, PlayIcon, RefreshIcon } from '../common/Icons';

interface IPTVControlRoomProps {
  onClose: () => void;
}

export const IPTVControlRoom: React.FC<IPTVControlRoomProps> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<IPTVChannel>(PLAYTORRIO_IPTV_CHANNELS[0]);
  const [customUrl, setCustomUrl] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Khmer TV');
  const [streamStatus, setStreamStatus] = useState<string>('Connecting to Live Feed...');
  const [isLive, setIsLive] = useState(false);
  const [useEmbed, setUseEmbed] = useState<boolean>(false);
  const [proxyAttempted, setProxyAttempted] = useState<boolean>(false);
  const hlsInstanceRef = useRef<Hls | null>(null);

  // Switch channel helper
  const handleSelectChannel = (channel: IPTVChannel) => {
    setSelectedChannel(channel);
    // If the channel has an embedUrl and no streamUrl, default to embed
    setUseEmbed(Boolean(!channel.streamUrl && channel.embedUrl));
    setProxyAttempted(false);
  };

  const loadHlsStream = useCallback((url: string, isProxied: boolean = false) => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }

    setStreamStatus(isProxied ? `Connecting via Cloud Proxy to ${selectedChannel.name}...` : `Connecting to ${selectedChannel.name}...`);
    setIsLive(false);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        }
      });
      hlsInstanceRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => console.warn('Autoplay prevented:', e));
        setStreamStatus(`LIVE • ${selectedChannel.quality || '1080p / 720p HD'}`);
        setIsLive(true);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // If network/CORS error and we haven't tried proxying yet, attempt CORS proxy fallback
              if (!isProxied && !proxyAttempted && selectedChannel.streamUrl) {
                setProxyAttempted(true);
                setStreamStatus('Direct stream blocked by CORS. Switching to Cloud Stream Proxy...');
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(selectedChannel.streamUrl)}`;
                loadHlsStream(proxyUrl, true);
              } else if (selectedChannel.embedUrl) {
                setStreamStatus('Stream blocked. Falling back to 24/7 Web Embed...');
                setUseEmbed(true);
              } else {
                setStreamStatus('Network stream unavailable. Switch channel or click External Player.');
                hls.destroy();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setStreamStatus('Recovering media buffer...');
              hls.recoverMediaError();
              break;
            default:
              if (selectedChannel.embedUrl) {
                setUseEmbed(true);
              } else {
                setStreamStatus('Stream temporarily unavailable. Switch channel.');
                hls.destroy();
              }
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple / Android Leanback HLS
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.warn('Autoplay prevented:', e));
        setStreamStatus(`LIVE • Native HLS Stream (${selectedChannel.quality || 'HD'})`);
        setIsLive(true);
      });
    }
  }, [selectedChannel, proxyAttempted]);

  useEffect(() => {
    if (useEmbed) {
      setStreamStatus(`LIVE • 24/7 Verified Web Stream`);
      setIsLive(true);
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      return;
    }

    if (selectedChannel.streamUrl) {
      loadHlsStream(selectedChannel.streamUrl, false);
    } else if (selectedChannel.embedUrl) {
      setUseEmbed(true);
    }

    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [selectedChannel, useEmbed, loadHlsStream]);

  const handleCustomStream = () => {
    if (!customUrl.trim()) return;
    const isCustomEmbed = customUrl.includes('youtube.com') || customUrl.includes('youtu.be');
    const customChannel: IPTVChannel = {
      id: `custom-${Date.now()}`,
      name: 'Custom User Live Stream',
      category: 'News',
      logo: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=200',
      streamUrl: isCustomEmbed ? '' : customUrl.trim(),
      embedUrl: isCustomEmbed ? customUrl.trim() : undefined,
      country: 'Custom',
      quality: 'HD'
    };
    setSelectedChannel(customChannel);
    setUseEmbed(isCustomEmbed);
    setCustomUrl('');
  };

  const handleOpenExternal = () => {
    const targetUrl = selectedChannel.streamUrl || selectedChannel.embedUrl;
    if (!targetUrl) return;
    // On Android TV or PC, this attempts to open in external VLC
    window.open(`vlc://${targetUrl}`, '_blank');
  };

  const filteredChannels = activeCategory === 'All'
    ? PLAYTORRIO_IPTV_CHANNELS
    : PLAYTORRIO_IPTV_CHANNELS.filter(c => c.category === activeCategory);

  const categories = ['Khmer TV', 'All', 'News', 'Sports', 'Documentary', 'Music'];

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#07090e] flex flex-col justify-between overflow-hidden animate-fadeIn"
      data-tv-scope="iptv"
    >
      {/* 1. Header Navigation */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 bg-gradient-to-b from-brand-bg via-brand-bg/95 to-transparent z-10 border-b border-brand-border">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-accent to-amber-600 flex items-center justify-center shadow-cinema-glow">
            <TvIcon size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg sm:text-2xl font-black text-white tracking-tight">PlayTorrio</span>
              <span className="text-xs px-2.5 py-0.5 rounded font-black bg-brand-accent text-white uppercase tracking-wider shadow">
                Control Room IPTV
              </span>
              {selectedChannel.isKhmer && (
                <span className="text-xs px-2.5 py-0.5 rounded font-black bg-blue-600 text-white flex items-center gap-1 shadow">
                  <span>🇰🇭</span>
                  <span>Khmer TV</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-gray-200 font-semibold truncate max-w-xs sm:max-w-md">
                {selectedChannel.name} {selectedChannel.khmerName ? `(${selectedChannel.khmerName})` : ''} • {streamStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Exit & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* External VLC / MX Player Launcher */}
          {selectedChannel.streamUrl && (
            <button
              data-tv-nav="true"
              data-tv-scope="iptv"
              onClick={handleOpenExternal}
              className="tv-focus-target hidden md:flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition"
              title="Open stream in VLC or external media player on Android TV"
            >
              <span>⚡ Open in VLC</span>
            </button>
          )}

          {/* Toggle Embed Mode if available */}
          {selectedChannel.embedUrl && selectedChannel.streamUrl && (
            <button
              data-tv-nav="true"
              data-tv-scope="iptv"
              onClick={() => setUseEmbed(!useEmbed)}
              className="tv-focus-target flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-brand-surface hover:bg-white/10 text-xs font-semibold text-gray-200 border border-brand-border transition"
            >
              <span>{useEmbed ? '⚡ Direct HLS' : '🌐 Web Player'}</span>
            </button>
          )}

          <button
            data-tv-nav="true"
            data-tv-scope="iptv"
            onClick={() => {
              setProxyAttempted(false);
              setUseEmbed(false);
              loadHlsStream(selectedChannel.streamUrl, false);
            }}
            className="tv-focus-target flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-brand-surface hover:bg-white/10 text-gray-200 text-xs sm:text-sm font-semibold border border-brand-border transition"
          >
            <RefreshIcon size={15} />
            <span className="hidden sm:inline">Reconnect</span>
          </button>

          <button
            data-tv-nav="true"
            data-tv-scope="iptv"
            onClick={onClose}
            className="tv-focus-target flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white text-xs sm:text-sm font-semibold shadow-cinema-glow transition"
          >
            <CloseIcon size={16} />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* 2. Main Body: Split View (Player Left / Channel Matrix Right) */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6 overflow-hidden">
        
        {/* Left: Live Video Player Screen */}
        <div className="flex-1 flex flex-col justify-center items-center bg-black rounded-3xl overflow-hidden border border-brand-border relative shadow-2xl">
          {useEmbed && selectedChannel.embedUrl ? (
            <iframe
              src={selectedChannel.embedUrl}
              className="w-full h-full border-0"
              allowFullScreen
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              title={`${selectedChannel.name} Live Web Feed`}
            />
          ) : (
            <video
              ref={videoRef}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          )}

          <div className="absolute top-4 left-4 z-20 px-3.5 py-1.5 rounded-full bg-brand-accent/90 text-white text-xs font-black tracking-widest flex items-center space-x-2 shadow-cinema-glow backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>LIVE FEED • {selectedChannel.country.toUpperCase()}</span>
          </div>

          {selectedChannel.quality && (
            <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-black/60 text-amber-300 text-xs font-bold border border-amber-500/30 backdrop-blur-md">
              {selectedChannel.quality}
            </div>
          )}
        </div>

        {/* Right: Channel Zap Matrix & Custom M3U8 Loader */}
        <div className="lg:w-96 shrink-0 bg-brand-surface p-5 rounded-3xl border border-brand-border flex flex-col justify-between overflow-hidden shadow-tv-card">
          <div>
            <div className="text-xs uppercase font-black tracking-widest text-brand-accent mb-3 flex items-center justify-between">
              <span>Channel Matrix</span>
              <span className="text-brand-muted font-semibold">{filteredChannels.length} Live Channels</span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-brand-border">
              {categories.map(cat => (
                <button
                  key={cat}
                  data-tv-nav="true"
                  data-tv-scope="iptv"
                  onClick={() => setActiveCategory(cat)}
                  className={`tv-focus-target px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
                    activeCategory === cat
                      ? 'bg-brand-accent text-white shadow-cinema-glow'
                      : 'bg-brand-card text-brand-muted hover:text-white border border-brand-border'
                  }`}
                >
                  {cat === 'Khmer TV' && <span>🇰🇭</span>}
                  <span>{cat}</span>
                </button>
              ))}
            </div>

            {/* Channels List */}
            <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
              {filteredChannels.map(ch => {
                const isSelected = selectedChannel.id === ch.id;
                return (
                  <button
                    key={ch.id}
                    data-tv-nav="true"
                    data-tv-scope="iptv"
                    onClick={() => handleSelectChannel(ch)}
                    className={`tv-focus-target w-full p-3 rounded-2xl flex items-center justify-between text-left transition ${
                      isSelected
                        ? 'bg-gradient-to-r from-brand-accent/30 via-red-950/20 to-brand-card border-2 border-brand-accent text-white shadow-cinema-glow'
                        : 'bg-brand-card hover:bg-white/5 text-gray-300 border border-brand-border'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <div className="w-9 h-9 rounded-xl bg-black/40 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                        {ch.isKhmer ? (
                          <span className="text-base">🇰🇭</span>
                        ) : (
                          <TvIcon size={16} className={isSelected ? 'text-brand-accent' : 'text-gray-400'} />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                          <span>{ch.name}</span>
                          {ch.quality && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-amber-300 font-normal">
                              {ch.quality}
                            </span>
                          )}
                        </div>
                        {ch.khmerName && (
                          <div className="text-[11px] text-amber-400/90 font-medium truncate">
                            {ch.khmerName}
                          </div>
                        )}
                        <div className="text-[10px] text-brand-muted font-semibold">{ch.country} • {ch.category}</div>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom M3U8 Stream Loader */}
          <div className="pt-4 border-t border-brand-border mt-3">
            <div className="text-[11px] uppercase font-bold text-brand-muted mb-2">
              Custom M3U8 Playlist / Xtream / YouTube Link
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://.../stream.m3u8 or YouTube URL"
                className="flex-1 px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-accent"
              />
              <button
                data-tv-nav="true"
                data-tv-scope="iptv"
                onClick={handleCustomStream}
                className="tv-focus-target px-4 py-2 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-xs flex items-center space-x-1 shrink-0 shadow-cinema-glow"
              >
                <PlayIcon size={14} className="fill-white" />
                <span>Play</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
