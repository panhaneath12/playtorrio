import React, { useState, useEffect } from 'react';
import { CloseIcon, CheckIcon, ServerIcon } from '../common/Icons';

interface DebridSettingsModalProps {
  onClose: () => void;
}

export const DebridSettingsModal: React.FC<DebridSettingsModalProps> = ({ onClose }) => {
  const [realDebridKey, setRealDebridKey] = useState('');
  const [allDebridKey, setAllDebridKey] = useState('');
  const [customAddonUrl, setCustomAddonUrl] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setRealDebridKey(localStorage.getItem('playtorrio_rd_key') || '');
    setAllDebridKey(localStorage.getItem('playtorrio_ad_key') || '');
    setCustomAddonUrl(localStorage.getItem('playtorrio_addon_url') || 'https://torrentio.strem.fun/manifest.json');
  }, []);

  const handleSave = () => {
    localStorage.setItem('playtorrio_rd_key', realDebridKey.trim());
    localStorage.setItem('playtorrio_ad_key', allDebridKey.trim());
    localStorage.setItem('playtorrio_addon_url', customAddonUrl.trim());

    setSaveMessage('PlayTorrio V3 Cloud Resolver Settings Saved!');
    setTimeout(() => {
      setSaveMessage(null);
      onClose();
    }, 1500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#08090D]/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      data-tv-scope="settings"
    >
      <div className="relative w-full max-w-2xl bg-brand-surface border border-brand-border rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-brand-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <ServerIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">PlayTorrio V3 Addons & Debrid Engine</h2>
              <p className="text-xs text-brand-muted">Configure 4K Cloud Caching & Community Scraper Addons</p>
            </div>
          </div>

          <button
            data-tv-nav="true"
            data-tv-scope="settings"
            onClick={onClose}
            className="tv-focus-target p-2 rounded-xl bg-brand-card hover:bg-white/10 text-gray-300 border border-brand-border"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-5 py-6">
          {saveMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-bounce">
              <CheckIcon size={16} />
              <span>{saveMessage}</span>
            </div>
          )}

          {/* Real-Debrid API Key */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
              Real-Debrid API Token (Optional)
            </label>
            <input
              type="password"
              value={realDebridKey}
              onChange={(e) => setRealDebridKey(e.target.value)}
              placeholder="Paste your Real-Debrid API secret token..."
              className="w-full px-4 py-2.5 bg-brand-card border border-brand-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Provides uncapped high-speed 4K torrent streaming without seeding or ISP throttles.
            </p>
          </div>

          {/* AllDebrid API Key */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-400 mb-1.5">
              AllDebrid API Key (Optional)
            </label>
            <input
              type="password"
              value={allDebridKey}
              onChange={(e) => setAllDebridKey(e.target.value)}
              placeholder="Paste your AllDebrid API key..."
              className="w-full px-4 py-2.5 bg-brand-card border border-brand-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>

          {/* Stremio Custom Addon Manifest */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-400 mb-1.5">
              Custom Stremio Addon Manifest URL
            </label>
            <input
              type="text"
              value={customAddonUrl}
              onChange={(e) => setCustomAddonUrl(e.target.value)}
              placeholder="https://.../manifest.json"
              className="w-full px-4 py-2.5 bg-brand-card border border-brand-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Default: Torrentio Community Scraper (<code className="text-xs font-mono text-gray-400">https://torrentio.strem.fun</code>)
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-brand-border">
          <button
            data-tv-nav="true"
            data-tv-scope="settings"
            onClick={onClose}
            className="tv-focus-target px-5 py-2.5 rounded-xl bg-brand-card hover:bg-white/10 text-brand-muted font-bold text-xs border border-brand-border"
          >
            Cancel
          </button>

          <button
            data-tv-nav="true"
            data-tv-scope="settings"
            onClick={handleSave}
            className="tv-focus-target px-6 py-2.5 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-xs flex items-center space-x-1.5 shadow-cinema-glow"
          >
            <CheckIcon size={16} />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
