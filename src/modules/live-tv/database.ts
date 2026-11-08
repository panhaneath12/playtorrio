import type { 
  TvChannel, 
  TvCountry, 
  TvCategory, 
  TvRecentlyWatched, 
  TvSyncLog, 
  LiveTvFilterOptions, 
  PaginatedResult 
} from './types';
import { SEED_CHANNELS, SEED_COUNTRIES, SEED_CATEGORIES } from './seedData';

const DB_NAME = 'PlayTorrio_LiveTV_DB';
const DB_VERSION = 1;

const STORE_CHANNELS = 'channels';
const STORE_COUNTRIES = 'countries';
const STORE_CATEGORIES = 'categories';
const STORE_FAVORITES = 'favorites';
const STORE_RECENT = 'recently_watched';
const STORE_META = 'sync_meta';

class LiveTvDatabase {
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private memoryChannels: TvChannel[] = [...SEED_CHANNELS];
  private memoryCountries: TvCountry[] = [...SEED_COUNTRIES];
  private memoryCategories: TvCategory[] = [...SEED_CATEGORIES];
  private memoryFavorites: Set<string> = new Set();
  private memoryRecent: TvRecentlyWatched[] = [];
  private memorySyncLog: TvSyncLog = {
    lastSync: new Date().toISOString(),
    totalChannels: SEED_CHANNELS.length,
    totalStreams: SEED_CHANNELS.reduce((acc, c) => acc + c.streams.length, 0),
    totalCountries: SEED_COUNTRIES.length,
    status: 'idle'
  };

  async init(): Promise<void> {
    if (this.isInitialized) return;

    // Load favorites and history from localStorage for instant availability
    try {
      const favStored = localStorage.getItem('playtorrio_livetv_favorites');
      if (favStored) {
        const arr = JSON.parse(favStored) as string[];
        this.memoryFavorites = new Set(arr);
      }
      const recStored = localStorage.getItem('playtorrio_livetv_recent');
      if (recStored) {
        this.memoryRecent = JSON.parse(recStored) as TvRecentlyWatched[];
      }
      const metaStored = localStorage.getItem('playtorrio_livetv_synclog');
      if (metaStored) {
        this.memorySyncLog = JSON.parse(metaStored) as TvSyncLog;
      }
    } catch {
      // Ignore localStorage errors
    }

    if (typeof window === 'undefined' || !window.indexedDB) {
      this.isInitialized = true;
      return;
    }

    try {
      this.db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_CHANNELS)) {
            const chStore = db.createObjectStore(STORE_CHANNELS, { keyPath: 'id' });
            chStore.createIndex('country', 'country', { unique: false });
            chStore.createIndex('name', 'name', { unique: false });
          }
          if (!db.objectStoreNames.contains(STORE_COUNTRIES)) {
            db.createObjectStore(STORE_COUNTRIES, { keyPath: 'code' });
          }
          if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
            db.createObjectStore(STORE_CATEGORIES, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORE_FAVORITES)) {
            db.createObjectStore(STORE_FAVORITES, { keyPath: 'channelId' });
          }
          if (!db.objectStoreNames.contains(STORE_RECENT)) {
            db.createObjectStore(STORE_RECENT, { keyPath: 'channelId' });
          }
          if (!db.objectStoreNames.contains(STORE_META)) {
            db.createObjectStore(STORE_META, { keyPath: 'key' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // Populate from IndexedDB if populated
      await this.loadFromIndexedDB();
    } catch (err) {
      console.warn('[LiveTV Database] IndexedDB unavailable, continuing with memory/localStorage fallback:', err);
    } finally {
      this.isInitialized = true;
    }
  }

  private async loadFromIndexedDB(): Promise<void> {
    if (!this.db) return;
    try {
      const channels = await this.getAllFromStore<TvChannel>(STORE_CHANNELS);
      if (channels.length > 0) {
        this.memoryChannels = channels;
      }
      const countries = await this.getAllFromStore<TvCountry>(STORE_COUNTRIES);
      if (countries.length > 0) {
        this.memoryCountries = countries;
      }
      const categories = await this.getAllFromStore<TvCategory>(STORE_CATEGORIES);
      if (categories.length > 0) {
        this.memoryCategories = categories;
      }
    } catch (err) {
      console.warn('[LiveTV Database] Could not hydrate from IndexedDB:', err);
    }
  }

  private getAllFromStore<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve) => {
      if (!this.db) return resolve([]);
      try {
        const tx = this.db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  // Save freshly synchronized IPTV-org dataset
  async saveSyncData(
    channels: TvChannel[], 
    countries: TvCountry[], 
    categories: TvCategory[], 
    syncLog: TvSyncLog
  ): Promise<void> {
    this.memoryChannels = channels;
    this.memoryCountries = countries;
    this.memoryCategories = categories;
    this.memorySyncLog = syncLog;

    try {
      localStorage.setItem('playtorrio_livetv_synclog', JSON.stringify(syncLog));
    } catch {
      // LocalStorage quota may be full, ignore safely
    }

    if (!this.db) return;

    try {
      const tx = this.db.transaction([STORE_CHANNELS, STORE_COUNTRIES, STORE_CATEGORIES, STORE_META], 'readwrite');
      
      const chStore = tx.objectStore(STORE_CHANNELS);
      chStore.clear();
      for (const ch of channels) {
        chStore.put(ch);
      }

      const coStore = tx.objectStore(STORE_COUNTRIES);
      coStore.clear();
      for (const co of countries) {
        coStore.put(co);
      }

      const catStore = tx.objectStore(STORE_CATEGORIES);
      catStore.clear();
      for (const cat of categories) {
        catStore.put(cat);
      }

      const metaStore = tx.objectStore(STORE_META);
      metaStore.put({ key: 'last_sync', data: syncLog });
    } catch (err) {
      console.warn('[LiveTV Database] Failed to write sync data to IndexedDB:', err);
    }
  }

  async getAllChannels(): Promise<TvChannel[]> {
    await this.init();
    return this.memoryChannels;
  }

  async getChannelById(id: string): Promise<TvChannel | null> {
    await this.init();
    return this.memoryChannels.find(c => c.id === id) || null;
  }

  async queryChannels(options: LiveTvFilterOptions = {}): Promise<PaginatedResult<TvChannel>> {
    await this.init();
    const {
      country,
      category,
      language,
      searchQuery,
      favoritesOnly,
      recentlyWatchedOnly,
      sortBy = 'popular',
      page = 1,
      pageSize = 30
    } = options;

    let list = [...this.memoryChannels];

    // Country Filter
    if (country && country !== 'ALL') {
      const cUpper = country.toUpperCase();
      list = list.filter(ch => ch.country.toUpperCase() === cUpper);
    }

    // Category Filter
    if (category && category !== 'all') {
      const catLower = category.toLowerCase();
      list = list.filter(ch => ch.categories.some(c => c.toLowerCase() === catLower));
    }

    // Language Filter
    if (language) {
      const langLower = language.toLowerCase();
      list = list.filter(ch => ch.languages?.some(l => l.toLowerCase() === langLower));
    }

    // Favorites Filter
    if (favoritesOnly) {
      list = list.filter(ch => this.memoryFavorites.has(ch.id));
    }

    // Recently Watched Filter
    if (recentlyWatchedOnly) {
      const recentIds = new Set(this.memoryRecent.map(r => r.channelId));
      list = list.filter(ch => recentIds.has(ch.id));
      // Sort by recent watch order
      const orderMap = new Map(this.memoryRecent.map((r, idx) => [r.channelId, idx]));
      list.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
    }

    // Search Query
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(ch => 
        ch.name.toLowerCase().includes(q) ||
        ch.altNames?.some(alt => alt.toLowerCase().includes(q)) ||
        ch.countryName?.toLowerCase().includes(q) ||
        ch.categories.some(cat => cat.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (!recentlyWatchedOnly) {
      if (sortBy === 'name') {
        list.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortBy === 'recently_added') {
        list.sort((a, b) => (b.trendingRank || 999) - (a.trendingRank || 999));
      } else {
        // 'popular': Featured channels first, then trending rank
        list.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (a.trendingRank || 999) - (b.trendingRank || 999);
        });
      }
    }

    const total = list.length;
    const totalPages = Math.ceil(total / pageSize);
    const validPage = Math.max(1, Math.min(page, totalPages || 1));
    const startIdx = (validPage - 1) * pageSize;
    const items = list.slice(startIdx, startIdx + pageSize);

    return {
      items,
      total,
      page: validPage,
      pageSize,
      totalPages,
      hasMore: validPage < totalPages
    };
  }

  async getCountries(): Promise<TvCountry[]> {
    await this.init();
    return this.memoryCountries;
  }

  async getCategories(): Promise<TvCategory[]> {
    await this.init();
    return this.memoryCategories;
  }

  async getFavorites(): Promise<string[]> {
    await this.init();
    return Array.from(this.memoryFavorites);
  }

  isFavorite(channelId: string): boolean {
    return this.memoryFavorites.has(channelId);
  }

  async toggleFavorite(channelId: string): Promise<boolean> {
    await this.init();
    const isFav = this.memoryFavorites.has(channelId);
    if (isFav) {
      this.memoryFavorites.delete(channelId);
    } else {
      this.memoryFavorites.add(channelId);
    }
    try {
      localStorage.setItem('playtorrio_livetv_favorites', JSON.stringify(Array.from(this.memoryFavorites)));
    } catch {
      // Ignore localStorage issues
    }
    return !isFav;
  }

  async getRecentlyWatched(): Promise<TvRecentlyWatched[]> {
    await this.init();
    return this.memoryRecent;
  }

  async recordRecentlyWatched(channelId: string): Promise<void> {
    await this.init();
    const filtered = this.memoryRecent.filter(r => r.channelId !== channelId);
    filtered.unshift({
      channelId,
      watchedAt: new Date().toISOString()
    });
    // Keep max 30 recent channels
    this.memoryRecent = filtered.slice(0, 30);
    try {
      localStorage.setItem('playtorrio_livetv_recent', JSON.stringify(this.memoryRecent));
    } catch {
      // Ignore
    }
  }

  getSyncLog(): TvSyncLog {
    return this.memorySyncLog;
  }
}

export const liveTvDb = new LiveTvDatabase();
