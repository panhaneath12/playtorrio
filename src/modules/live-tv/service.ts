import type { 
  TvChannel, 
  TvCountry, 
  TvCategory, 
  TvProgram, 
  LiveTvFilterOptions, 
  PaginatedResult 
} from './types';
import { liveTvDb } from './database';
import { iptvSyncService } from './sync';

export class LiveTvService {
  constructor() {
    // Automatically trigger initial background sync if dataset is stale
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        iptvSyncService.shouldSync().then(needed => {
          if (needed) {
            iptvSyncService.syncNow().catch(() => {});
          }
        }).catch(() => {});
      }, 3000);
    }
  }

  async getChannels(options: LiveTvFilterOptions = {}): Promise<PaginatedResult<TvChannel>> {
    return liveTvDb.queryChannels(options);
  }

  async getChannelById(id: string): Promise<TvChannel | null> {
    return liveTvDb.getChannelById(id);
  }

  async getCountries(): Promise<TvCountry[]> {
    return liveTvDb.getCountries();
  }

  async getCategories(): Promise<TvCategory[]> {
    return liveTvDb.getCategories();
  }

  async search(query: string, page: number = 1, pageSize: number = 30): Promise<PaginatedResult<TvChannel>> {
    return liveTvDb.queryChannels({
      searchQuery: query,
      page,
      pageSize
    });
  }

  async getFeatured(): Promise<TvChannel[]> {
    const res = await liveTvDb.queryChannels({
      sortBy: 'popular',
      page: 1,
      pageSize: 15
    });
    return res.items.filter(c => c.featured).slice(0, 10);
  }

  async getTrending(): Promise<TvChannel[]> {
    const res = await liveTvDb.queryChannels({
      sortBy: 'popular',
      page: 1,
      pageSize: 20
    });
    return res.items;
  }

  async getEpg(channelId: string): Promise<{ channelId: string; now: TvProgram | null; next: TvProgram | null; timeline: TvProgram[] }> {
    const channel = await liveTvDb.getChannelById(channelId);
    if (!channel) {
      return { channelId, now: null, next: null, timeline: [] };
    }

    const now = channel.currentProgram || {
      id: `${channelId}-live`,
      channelId,
      title: `${channel.name} Live Broadcast`,
      description: `Live streaming feed from ${channel.countryName || channel.country}`,
      start: new Date(Date.now() - 30 * 60000).toISOString(),
      end: new Date(Date.now() + 60 * 60000).toISOString(),
      category: channel.categories[0] || 'General'
    };

    const next = channel.nextProgram || {
      id: `${channelId}-next`,
      channelId,
      title: `${channel.name} Prime Programming`,
      description: 'Scheduled broadcast continuation',
      start: now.end,
      end: new Date(new Date(now.end).getTime() + 90 * 60000).toISOString(),
      category: channel.categories[0] || 'General'
    };

    return {
      channelId,
      now,
      next,
      timeline: [now, next]
    };
  }

  async getFavorites(): Promise<TvChannel[]> {
    const favIds = await liveTvDb.getFavorites();
    const favSet = new Set(favIds);
    const all = await liveTvDb.getAllChannels();
    return all.filter(c => favSet.has(c.id));
  }

  async addFavorite(channelId: string): Promise<boolean> {
    if (!liveTvDb.isFavorite(channelId)) {
      return liveTvDb.toggleFavorite(channelId);
    }
    return true;
  }

  async removeFavorite(channelId: string): Promise<boolean> {
    if (liveTvDb.isFavorite(channelId)) {
      return liveTvDb.toggleFavorite(channelId);
    }
    return false;
  }

  async toggleFavorite(channelId: string): Promise<boolean> {
    return liveTvDb.toggleFavorite(channelId);
  }

  isFavorite(channelId: string): boolean {
    return liveTvDb.isFavorite(channelId);
  }

  async getRecentlyWatched(): Promise<TvChannel[]> {
    const recent = await liveTvDb.getRecentlyWatched();
    const map = new Map(recent.map((r, i) => [r.channelId, i]));
    const all = await liveTvDb.getAllChannels();
    return all
      .filter(c => map.has(c.id))
      .sort((a, b) => (map.get(a.id) ?? 999) - (map.get(b.id) ?? 999))
      .slice(0, 15);
  }

  async recordRecentlyWatched(channelId: string): Promise<void> {
    await liveTvDb.recordRecentlyWatched(channelId);
  }

  async getHealth(): Promise<{ status: string; channels: number; streams: number; lastSync: string; error?: string }> {
    const log = liveTvDb.getSyncLog();
    return {
      status: log.status === 'error' ? 'degraded' : 'healthy',
      channels: log.totalChannels,
      streams: log.totalStreams,
      lastSync: log.lastSync,
      error: log.error
    };
  }

  async triggerSync(): Promise<void> {
    await iptvSyncService.syncNow();
  }
}

export const liveTvService = new LiveTvService();
