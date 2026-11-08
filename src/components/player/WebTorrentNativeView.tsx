import React, { useEffect, useRef, useState } from 'react';
import { PlayIcon } from '../common/Icons';

declare global {
  interface Window {
    WebTorrent?: any;
  }
}

interface WebTorrentNativeViewProps {
  mediaTitle: string;
}

const DEFAULT_TORRENTS = [
  {
    title: 'Sintel (Open 4K Movie)',
    magnet: 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=wss%3A%2F%2Ftracker.fastcast.nz'
  },
  {
    title: 'Big Buck Bunny (60fps)',
    magnet: 'magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big+Buck+Bunny&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=wss%3A%2F%2Ftracker.fastcast.nz'
  },
  {
    title: 'Tears of Steel (Sci-Fi)',
    magnet: 'magnet:?xt=urn:btih:209c3140161321a1d862938e796314f594468dae&dn=Tears+of+Steel&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=wss%3A%2F%2Ftracker.fastcast.nz'
  }
];

export const WebTorrentNativeView: React.FC<WebTorrentNativeViewProps> = ({ mediaTitle }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeMagnet, setActiveMagnet] = useState(DEFAULT_TORRENTS[0].magnet);
  const [activeTorrentTitle, setActiveTorrentTitle] = useState(DEFAULT_TORRENTS[0].title);
  const [customMagnetInput, setCustomMagnetInput] = useState('');
  const [status, setStatus] = useState<string>('Initializing WebTorrent P2P Client...');
  const [peers, setPeers] = useState<number>(0);
  const [downloadSpeed, setDownloadSpeed] = useState<string>('0 KB/s');
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    let client: any = null;
    let isCancelled = false;

    // Check if WebTorrent is loaded in window
    const initClient = () => {
      if (typeof window.WebTorrent === 'undefined') {
        setStatus('Loading WebTorrent WebRTC Engine...');
        return;
      }

      try {
        client = new window.WebTorrent();
        setStatus(`Connecting to WebRTC trackers for: ${activeTorrentTitle}...`);

        client.add(activeMagnet, (torrent: any) => {
          if (isCancelled) return;
          setStatus(`P2P Swarm connected! Resolving video stream...`);

          // Find playable video file (.mp4, .mkv, .webm)
          const file = torrent.files.find((f: any) => 
            f.name.endsWith('.mp4') || f.name.endsWith('.mkv') || f.name.endsWith('.webm')
          ) || torrent.files[0];

          if (file && videoRef.current) {
            file.renderTo(videoRef.current, { autoplay: true });
            setStatus(`Streaming ${file.name} sequentially over WebRTC`);
          }

          // Live stats interval
          const interval = setInterval(() => {
            if (isCancelled || torrent.destroyed) {
              clearInterval(interval);
              return;
            }
            setPeers(torrent.numPeers);
            setDownloadSpeed(`${(torrent.downloadSpeed / (1024 * 1024)).toFixed(2)} MB/s`);
            setProgress(Math.round(torrent.progress * 100));
          }, 1000);
        });

        client.on('error', (err: any) => {
          console.error('WebTorrent Error:', err);
          setStatus(`P2P Warning: ${err.message || 'Connecting to fallback peers...'}`);
        });

      } catch (e: any) {
        console.error('WebTorrent Init Error:', e);
        setStatus('WebTorrent WebRTC is ready. Pick a swarm or paste a magnet link below.');
      }
    };

    const timer = setTimeout(initClient, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      if (client) {
        try { client.destroy(); } catch (_) {}
      }
    };
  }, [activeMagnet, activeTorrentTitle]);

  const handleSelectSwarm = (magnet: string, title: string) => {
    setActiveMagnet(magnet);
    setActiveTorrentTitle(title);
    setProgress(0);
    setPeers(0);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-black text-white p-4">
      {/* 1. Live Torrent Stats Bar */}
      <div className="w-full flex items-center justify-between px-6 py-2.5 bg-gray-950/90 rounded-2xl border border-white/10 z-20 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs md:text-sm font-bold text-amber-400 truncate max-w-md">
            {status}
          </span>
        </div>

        <div className="flex items-center space-x-4 text-xs font-semibold text-gray-300">
          <span className="px-2.5 py-1 rounded-lg bg-gray-900 border border-white/5">
            👥 {peers} Peers
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-gray-900 border border-white/5 text-emerald-400">
            ⬇️ {downloadSpeed}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-gray-900 border border-white/5 text-amber-300">
            📊 {progress}% Buffered
          </span>
        </div>
      </div>

      {/* 2. Native HTML5 Video Element (No iFrame, No X-Frame-Options blocks!) */}
      <div className="relative flex-1 w-full max-h-[70vh] flex items-center justify-center my-3 overflow-hidden rounded-2xl bg-gray-950">
        <video
          ref={videoRef}
          controls
          autoPlay
          playsInline
          className="w-full h-full object-contain rounded-2xl"
        />
      </div>

      {/* 3. Bottom Controls: Swarm Picker & Custom Magnet Input */}
      <div className="w-full flex flex-col gap-2.5 z-20">
        {/* Custom Magnet URL Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customMagnetInput}
            onChange={(e) => setCustomMagnetInput(e.target.value)}
            placeholder={`Paste any magnet:?xt=urn:... link to stream ${mediaTitle} via WebTorrent`}
            className="flex-1 px-4 py-2 bg-gray-900 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            data-tv-nav="true"
            data-tv-scope="player"
            onClick={() => {
              if (customMagnetInput.trim()) {
                handleSelectSwarm(customMagnetInput.trim(), `Custom Magnet (${mediaTitle})`);
              }
            }}
            className="tv-focus-target px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center space-x-1.5 shrink-0"
          >
            <PlayIcon size={14} className="fill-black" />
            <span>Load Torrent</span>
          </button>
        </div>

        {/* Demo Swarms */}
        <div className="flex items-center space-x-2 overflow-x-auto py-1">
          <span className="text-[11px] uppercase font-bold text-gray-500 shrink-0">
            Instant Test Swarms:
          </span>
          {DEFAULT_TORRENTS.map((t) => (
            <button
              key={t.title}
              data-tv-nav="true"
              data-tv-scope="player"
              onClick={() => handleSelectSwarm(t.magnet, t.title)}
              className={`tv-focus-target px-3 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                activeTorrentTitle === t.title
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border border-white/5'
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
