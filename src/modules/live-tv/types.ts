export interface TvStream {
  url: string;
  quality?: string;
  title?: string;
  labels?: string[];
  userAgent?: string | null;
  referrer?: string | null;
  isWorking?: boolean;
}

export interface TvProgram {
  id: string;
  channelId: string;
  title: string;
  description?: string;
  start: string; // ISO 8601 UTC
  end: string;   // ISO 8601 UTC
  category?: string;
  durationMinutes?: number;
}

export interface TvChannel {
  id: string;
  name: string;
  altNames?: string[];
  network?: string | null;
  country: string; // 2-letter country code
  countryName?: string;
  countryFlag?: string;
  categories: string[];
  languages?: string[];
  logo: string;
  website?: string;
  streams: TvStream[];
  isNsfw: boolean;
  isClosed: boolean;
  featured?: boolean;
  trendingRank?: number;
  currentProgram?: TvProgram | null;
  nextProgram?: TvProgram | null;
}

export interface TvCountry {
  code: string;
  name: string;
  flag: string;
  channelCount: number;
  languages?: string[];
}

export interface TvCategory {
  id: string;
  name: string;
  description?: string;
  channelCount: number;
  icon?: string;
}

export interface TvFavorite {
  channelId: string;
  addedAt: string;
}

export interface TvRecentlyWatched {
  channelId: string;
  watchedAt: string;
  durationSeconds?: number;
}

export interface TvSyncLog {
  lastSync: string;
  totalChannels: number;
  totalStreams: number;
  totalCountries: number;
  status: 'idle' | 'syncing' | 'success' | 'error';
  error?: string;
}

export interface LiveTvFilterOptions {
  country?: string;
  category?: string;
  language?: string;
  searchQuery?: string;
  favoritesOnly?: boolean;
  recentlyWatchedOnly?: boolean;
  sortBy?: 'popular' | 'name' | 'recently_added';
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

// Raw IPTV-org JSON response schemas
export interface IptvOrgChannel {
  id: string;
  name: string;
  alt_names?: string[];
  network?: string | null;
  owners?: string[];
  country: string;
  categories?: string[];
  is_nsfw?: boolean;
  launched?: string | null;
  closed?: string | null;
  replaced_by?: string | null;
  website?: string | null;
}

export interface IptvOrgStream {
  channel: string | null;
  feed?: string | null;
  title?: string;
  url: string;
  quality?: string | null;
  labels?: string[];
  user_agent?: string | null;
  referrer?: string | null;
}

export interface IptvOrgLogo {
  channel: string;
  feed?: string | null;
  in_use?: boolean;
  url: string;
}

export interface IptvOrgCountry {
  name: string;
  code: string;
  languages?: string[];
  flag?: string;
}

export interface IptvOrgCategory {
  id: string;
  name: string;
  description?: string;
}

export interface IptvOrgBlockItem {
  channel: string;
  reason?: string;
  ref?: string;
}
