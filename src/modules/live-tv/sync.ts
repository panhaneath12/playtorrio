import type {
  TvChannel,
  TvCountry,
  TvCategory,
  TvStream,
  TvSyncLog,
  IptvOrgChannel,
  IptvOrgStream,
  IptvOrgLogo,
  IptvOrgCountry,
  IptvOrgCategory,
  IptvOrgBlockItem
} from './types';
import { liveTvDb } from './database';
import { SEED_CHANNELS } from './seedData';

const ENDPOINTS = {
  CHANNELS: 'https://iptv-org.github.io/api/channels.json',
  STREAMS: 'https://iptv-org.github.io/api/streams.json',
  LOGOS: 'https://iptv-org.github.io/api/logos.json',
  COUNTRIES: 'https://iptv-org.github.io/api/countries.json',
  CATEGORIES: 'https://iptv-org.github.io/api/categories.json',
  BLOCKLIST: 'https://iptv-org.github.io/api/blocklist.json'
};

const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Default fallback logo based on category
export function getCategoryFallbackLogo(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('news')) return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=240';
  if (c.includes('sport')) return 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=240';
  if (c.includes('movie')) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=240';
  if (c.includes('music')) return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=240';
  if (c.includes('kid') || c.includes('anim')) return 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?w=240';
  if (c.includes('doc') || c.includes('science')) return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=240';
  if (c.includes('edu')) return 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=240';
  return 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=240';
}

export class IptvOrgSyncService {
  private isSyncing = false;

  async shouldSync(): Promise<boolean> {
    const log = liveTvDb.getSyncLog();
    if (!log.lastSync) return true;
    const diff = Date.now() - new Date(log.lastSync).getTime();
    return diff > SYNC_INTERVAL_MS;
  }

  async syncNow(): Promise<TvSyncLog> {
    if (this.isSyncing) {
      return liveTvDb.getSyncLog();
    }

    this.isSyncing = true;
    console.log('[IPTV-org Sync] Starting synchronization with IPTV-org endpoints...');

    try {
      // 1. Fetch metadata in parallel
      const [chRes, stRes, lgRes, ctRes, catRes, blRes] = await Promise.all([
        fetch(ENDPOINTS.CHANNELS, { signal: AbortSignal.timeout(20000) }),
        fetch(ENDPOINTS.STREAMS, { signal: AbortSignal.timeout(20000) }),
        fetch(ENDPOINTS.LOGOS, { signal: AbortSignal.timeout(20000) }),
        fetch(ENDPOINTS.COUNTRIES, { signal: AbortSignal.timeout(15000) }),
        fetch(ENDPOINTS.CATEGORIES, { signal: AbortSignal.timeout(15000) }),
        fetch(ENDPOINTS.BLOCKLIST, { signal: AbortSignal.timeout(15000) })
      ]);

      if (!chRes.ok || !stRes.ok) {
        throw new Error(`Failed to fetch core data: channels(${chRes.status}) streams(${stRes.status})`);
      }

      const [rawChannels, rawStreams, rawLogos, rawCountries, rawCategories, rawBlocklist]: [
        IptvOrgChannel[],
        IptvOrgStream[],
        IptvOrgLogo[],
        IptvOrgCountry[],
        IptvOrgCategory[],
        IptvOrgBlockItem[]
      ] = await Promise.all([
        chRes.json(),
        stRes.json(),
        lgRes.ok ? lgRes.json() : [],
        ctRes.ok ? ctRes.json() : [],
        catRes.ok ? catRes.json() : [],
        blRes.ok ? blRes.json() : []
      ]);

      // 2. Build fast lookup maps
      const blocklistSet = new Set(rawBlocklist.map(b => b.channel));

      const countryMap = new Map<string, IptvOrgCountry>();
      for (const c of rawCountries) {
        countryMap.set(c.code.toUpperCase(), c);
      }

      // Group streams by channel ID (deduplicating identical stream URLs)
      const streamsByChannel = new Map<string, TvStream[]>();
      for (const s of rawStreams) {
        if (!s.channel || !s.url) continue;
        const list = streamsByChannel.get(s.channel) || [];
        // Avoid duplicate stream URLs for same channel
        if (!list.some(existing => existing.url === s.url)) {
          list.push({
            url: s.url,
            quality: s.quality || undefined,
            title: s.title || undefined,
            labels: s.labels || [],
            userAgent: s.user_agent || null,
            referrer: s.referrer || null,
            isWorking: true
          });
          streamsByChannel.set(s.channel, list);
        }
      }

      // Map logos by channel ID
      const logosByChannel = new Map<string, string>();
      for (const lg of rawLogos) {
        if (lg.channel && lg.url && !logosByChannel.has(lg.channel)) {
          logosByChannel.set(lg.channel, lg.url);
        }
      }

      // 3. Normalize channels
      const normalizedChannels: TvChannel[] = [];
      const countryCounts = new Map<string, number>();
      const categoryCounts = new Map<string, number>();

      for (const raw of rawChannels) {
        // Exclude NSFW, closed channels, and blocklisted channels
        if (raw.is_nsfw || raw.closed || blocklistSet.has(raw.id)) {
          continue;
        }

        // Only include channels with at least one verified active stream
        const streams = streamsByChannel.get(raw.id);
        if (!streams || streams.length === 0) {
          continue;
        }

        const countryCode = (raw.country || 'GLOBAL').toUpperCase();
        const countryInfo = countryMap.get(countryCode);
        const categories = raw.categories && raw.categories.length > 0 ? raw.categories : ['general'];

        // Determine channel logo (priority: logos.json -> category fallback)
        const logo = logosByChannel.get(raw.id) || getCategoryFallbackLogo(categories[0]);

        // Prioritize known popular national / high-demand broadcasters
        const isFeatured = 
          countryCode === 'KH' ||
          countryCode === 'TH' ||
          raw.name.toLowerCase().includes('national') ||
          raw.name.toLowerCase().includes('dw') ||
          raw.name.toLowerCase().includes('france 24') ||
          raw.name.toLowerCase().includes('sky news') ||
          raw.name.toLowerCase().includes('red bull') ||
          raw.name.toLowerCase().includes('nasa') ||
          raw.name.toLowerCase().includes('bbc') ||
          raw.name.toLowerCase().includes('cnn');

        const channelItem: TvChannel = {
          id: raw.id,
          name: raw.name,
          altNames: raw.alt_names || [],
          network: raw.network || null,
          country: countryCode,
          countryName: countryInfo?.name || countryCode,
          countryFlag: countryInfo?.flag || '📡',
          categories,
          languages: countryInfo?.languages || [],
          logo,
          website: raw.website || undefined,
          streams,
          isNsfw: false,
          isClosed: false,
          featured: isFeatured,
          trendingRank: isFeatured ? 1 : 100
        };

        normalizedChannels.push(channelItem);

        // Update counts
        countryCounts.set(countryCode, (countryCounts.get(countryCode) || 0) + 1);
        for (const cat of categories) {
          categoryCounts.set(cat.toLowerCase(), (categoryCounts.get(cat.toLowerCase()) || 0) + 1);
        }
      }

      // Merge verified seed channels (e.g. Khmer TV channels) to guarantee top priority and working backups
      for (const seed of SEED_CHANNELS) {
        if (!normalizedChannels.some(ch => ch.id === seed.id)) {
          normalizedChannels.unshift(seed);
          countryCounts.set(seed.country, (countryCounts.get(seed.country) || 0) + 1);
        }
      }

      // 4. Normalize Countries
      const normalizedCountries: TvCountry[] = [
        { code: 'ALL', name: 'All Worldwide', flag: '🌍', channelCount: normalizedChannels.length }
      ];

      for (const [code, count] of countryCounts.entries()) {
        const cInfo = countryMap.get(code);
        normalizedCountries.push({
          code,
          name: cInfo?.name || code,
          flag: cInfo?.flag || '📡',
          channelCount: count,
          languages: cInfo?.languages || []
        });
      }

      // Sort countries: Cambodia and Thailand first, then by channel count descending
      normalizedCountries.sort((a, b) => {
        if (a.code === 'ALL') return -1;
        if (b.code === 'ALL') return 1;
        if (a.code === 'KH') return -1;
        if (b.code === 'KH') return 1;
        if (a.code === 'TH') return -1;
        if (b.code === 'TH') return 1;
        return b.channelCount - a.channelCount;
      });

      // 5. Normalize Categories
      const normalizedCategories: TvCategory[] = [
        { id: 'all', name: 'All Channels', icon: '📺', channelCount: normalizedChannels.length }
      ];

      for (const cat of rawCategories) {
        const count = categoryCounts.get(cat.id.toLowerCase()) || 0;
        if (count > 0) {
          normalizedCategories.push({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            channelCount: count
          });
        }
      }

      // Sort categories: News & Sports first, then by channel count
      normalizedCategories.sort((a, b) => {
        if (a.id === 'all') return -1;
        if (b.id === 'all') return 1;
        if (a.id === 'news') return -1;
        if (b.id === 'news') return 1;
        if (a.id === 'sports') return -1;
        if (b.id === 'sports') return 1;
        return b.channelCount - a.channelCount;
      });

      const totalStreams = normalizedChannels.reduce((sum, ch) => sum + ch.streams.length, 0);

      const syncLog: TvSyncLog = {
        lastSync: new Date().toISOString(),
        totalChannels: normalizedChannels.length,
        totalStreams,
        totalCountries: normalizedCountries.length,
        status: 'success'
      };

      // Save to IndexedDB repository
      await liveTvDb.saveSyncData(normalizedChannels, normalizedCountries, normalizedCategories, syncLog);

      console.log(`[IPTV-org Sync] Successfully synced ${normalizedChannels.length} channels, ${totalStreams} streams, across ${normalizedCountries.length} countries!`);
      return syncLog;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('[IPTV-org Sync] Synchronization failed, retaining current dataset:', errorMsg);
      const prevLog = liveTvDb.getSyncLog();
      const failLog: TvSyncLog = {
        ...prevLog,
        status: 'error',
        error: errorMsg
      };
      return failLog;
    } finally {
      this.isSyncing = false;
    }
  }
}

export const iptvSyncService = new IptvOrgSyncService();
