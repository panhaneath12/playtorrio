import React, { useState } from 'react';
import { CloseIcon, RefreshIcon, PlayIcon, CheckIcon } from '../common/Icons';

interface TorrentStreamPlayerProps {
  onClose: () => void;
}

// Curated Open-Source / Public Domain Test Torrents
const DEMO_TORRENTS = [
  {
    title: 'Sintel (Open Movie)',
    magnet: 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com',
    quality: '1080p',
    duration: '15 mins'
  },
  {
    title: 'Big Buck Bunny (Blender)',
    magnet: 'magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big+Buck+Bunny&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com',
    quality: '1080p 60fps',
    duration: '10 mins'
  },
  {
    title: 'Tears of Steel (Sci-Fi)',
    magnet: 'magnet:?xt=urn:btih:209c3140161321a1d862938e796314f594468dae&dn=Tears+of+Steel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com',
    quality: '4K VFX',
    duration: '12 mins'
  },
  {
    title: 'Cosmos Laundromat',
    magnet: 'magnet:?xt=urn:btih:c9e15763f722f23e98a29decd97d33aa3b64c833&dn=Cosmos+Laundromat&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com',
    quality: '1080p',
    duration: '12 mins'
  }
];

export const TorrentStreamPlayer: React.FC<TorrentStreamPlayerProps> = ({ onClose }) => {
  const [magnetInput, setMagnetInput] = useState('');
  const [activeMagnet, setActiveMagnet] = useState(DEMO_TORRENTS[0].magnet);
  const [activeTitle, setActiveTitle] = useState(DEMO_TORRENTS[0].title);
  const [playerEngine, setPlayerEngine] = useState<'instant' | 'webtor'>('instant');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const getPlayerUrl = () => {
    if (playerEngine === 'instant') {
      return `https://instant.io/#${encodeURIComponent(activeMagnet)}`;
    }
    return `https://webtor.io/show?magnet=${encodeURIComponent(activeMagnet)}`;
  };

  const handleStartStream = (magnet: string, title: string) => {
    setActiveMagnet(magnet);
    setActiveTitle(title);
    setStatusMsg(`Connected to P2P Swarm: ${title}`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#08090D]/95 flex flex-col justify-between overflow-hidden animate-fadeIn"
      data-tv-scope="torrent"
    >
      {/* 1. Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 bg-gradient-to-b from-brand-bg via-brand-bg/95 to-transparent z-10 border-b border-brand-border">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <span className="px-2.5 py-1 rounded bg-brand-accent text-white font-black text-xs uppercase tracking-wider shadow">
            TORRENT P2P
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide truncate max-w-sm sm:max-w-xl">
            {activeTitle}
          </h2>
          <span className="hidden sm:inline-block text-xs px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
            WebTorrent / WebRTC Active
          </span>
        </div>

        {/* Engine switcher & Exit */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            data-tv-nav="true"
            data-tv-scope="torrent"
            onClick={() => setPlayerEngine(prev => prev === 'instant' ? 'webtor' : 'instant')}
            className="tv-focus-target flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-brand-surface hover:bg-white/10 text-amber-400 text-xs sm:text-sm font-semibold border border-amber-400/20"
          >
            <RefreshIcon size={15} />
            <span>Engine: {playerEngine === 'instant' ? 'Instant.io' : 'Webtor'}</span>
          </button>

          <button
            data-tv-nav="true"
            data-tv-scope="torrent"
            onClick={onClose}
            className="tv-focus-target flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white text-xs sm:text-sm font-semibold shadow-cinema-glow"
          >
            <CloseIcon size={16} />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* 2. Video Player Frame */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black">
        {statusMsg && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-6 py-2.5 rounded-full bg-brand-accent text-white font-bold text-sm shadow-cinema-glow flex items-center space-x-2 animate-bounce">
            <CheckIcon size={18} />
            <span>{statusMsg}</span>
          </div>
        )}

        <iframe
          src={getPlayerUrl()}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write"
          title="Torrent Stream Player"
        />
      </div>

      {/* 3. Bottom Torrent Controls: Custom Magnet Input & Quick Demo Swarm */}
      <div className="bg-gradient-to-t from-brand-bg via-brand-surface to-transparent px-4 sm:px-8 py-4 flex flex-col gap-3 z-10 border-t border-brand-border">
        
        {/* Custom Magnet URL Input */}
        <div className="flex items-center gap-2 sm:gap-3">
          <input
            type="text"
            value={magnetInput}
            onChange={(e) => setMagnetInput(e.target.value)}
            placeholder="Paste any magnet:?xt=urn:... link or torrent infohash here..."
            className="flex-1 px-4 py-2 bg-brand-surface border border-brand-border rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
          <button
            data-tv-nav="true"
            data-tv-scope="torrent"
            onClick={() => {
              if (magnetInput.trim()) {
                handleStartStream(magnetInput.trim(), 'Custom Magnet Stream');
              }
            }}
            className="tv-focus-target px-4 sm:px-5 py-2 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shrink-0 shadow-cinema-glow"
          >
            <PlayIcon size={15} className="fill-white" />
            <span>Stream</span>
          </button>
        </div>

        {/* Demo Public Domain Swarms */}
        <div className="flex items-center space-x-2 overflow-x-auto py-1">
          <span className="text-[11px] uppercase font-bold text-brand-muted shrink-0 mr-1">
            Test Swarms:
          </span>
          {DEMO_TORRENTS.map((t) => (
            <button
              key={t.title}
              data-tv-nav="true"
              data-tv-scope="torrent"
              onClick={() => handleStartStream(t.magnet, t.title)}
              className={`tv-focus-target px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
                activeTitle === t.title
                  ? 'bg-brand-accent text-white shadow-cinema-glow'
                  : 'bg-brand-surface hover:bg-white/10 text-gray-300 border border-brand-border'
              }`}
            >
              <span>{t.title}</span>
              <span className="text-[10px] opacity-75 font-mono">({t.quality})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
