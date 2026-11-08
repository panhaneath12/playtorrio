import { liveTvService } from './service';
import type { LiveTvFilterOptions } from './types';

/**
 * LiveTvController
 * Dispatches and fulfills the requested /api/live-tv/* API endpoint contract.
 * Returns consistent normalized JSON responses without exposing internal DB models directly.
 */
export class LiveTvController {
  // GET /api/live-tv/channels
  async getChannels(params: Record<string, string | undefined> = {}) {
    const options: LiveTvFilterOptions = {
      country: params.country,
      category: params.category,
      language: params.language,
      searchQuery: params.q || params.search,
      favoritesOnly: params.favorites === 'true',
      recentlyWatchedOnly: params.recently_watched === 'true',
      sortBy: (params.sort as LiveTvFilterOptions['sortBy']) || 'popular',
      page: params.page ? parseInt(params.page, 10) : 1,
      pageSize: params.pageSize ? parseInt(params.pageSize, 10) : 30
    };
    const result = await liveTvService.getChannels(options);
    return {
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        hasMore: result.hasMore
      }
    };
  }

  // GET /api/live-tv/channels/:id
  async getChannelById(id: string) {
    const channel = await liveTvService.getChannelById(id);
    if (!channel) {
      return { success: false, error: 'Channel not found', statusCode: 404 };
    }
    return { success: true, data: channel };
  }

  // GET /api/live-tv/countries
  async getCountries() {
    const countries = await liveTvService.getCountries();
    return { success: true, data: countries, total: countries.length };
  }

  // GET /api/live-tv/categories
  async getCategories() {
    const categories = await liveTvService.getCategories();
    return { success: true, data: categories, total: categories.length };
  }

  // GET /api/live-tv/search?q=
  async search(query: string, page: number = 1, pageSize: number = 30) {
    const result = await liveTvService.search(query, page, pageSize);
    return {
      success: true,
      data: result.items,
      query,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        hasMore: result.hasMore
      }
    };
  }

  // GET /api/live-tv/featured
  async getFeatured() {
    const featured = await liveTvService.getFeatured();
    return { success: true, data: featured, total: featured.length };
  }

  // GET /api/live-tv/trending
  async getTrending() {
    const trending = await liveTvService.getTrending();
    return { success: true, data: trending, total: trending.length };
  }

  // GET /api/live-tv/epg/:id
  async getEpg(id: string) {
    const epg = await liveTvService.getEpg(id);
    return { success: true, data: epg };
  }

  // GET /api/live-tv/favorites
  async getFavorites() {
    const favorites = await liveTvService.getFavorites();
    return { success: true, data: favorites, total: favorites.length };
  }

  // POST /api/live-tv/favorites/:id
  async addFavorite(id: string) {
    const isFav = await liveTvService.addFavorite(id);
    return { success: true, favorited: isFav, channelId: id };
  }

  // DELETE /api/live-tv/favorites/:id
  async removeFavorite(id: string) {
    const isFav = await liveTvService.removeFavorite(id);
    return { success: true, favorited: isFav, channelId: id };
  }

  // GET /api/live-tv/recently-watched
  async getRecentlyWatched() {
    const recent = await liveTvService.getRecentlyWatched();
    return { success: true, data: recent, total: recent.length };
  }

  // GET /api/live-tv/health
  async getHealth() {
    const health = await liveTvService.getHealth();
    return { success: true, data: health };
  }
}

export const liveTvController = new LiveTvController();
