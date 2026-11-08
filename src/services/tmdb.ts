export interface SeasonInfo {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  poster?: string;
  airDate?: string;
  overview?: string;
}

export interface EpisodeInfo {
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  overview?: string;
  stillPath?: string;
  airDate?: string;
  runtime?: number;
  voteAverage?: number;
}

export interface TVDetails {
  seasonsCount: number;
  totalEpisodes: number;
  seasons: SeasonInfo[];
  imdbId?: string;
}

export interface MediaItem {
  id: string; // TMDB ID
  imdbId?: string; // IMDb ID (e.g. tt15398776) for Stremio, VidSrc, & Torrentio
  title: string;
  type: 'movie' | 'tv';
  overview: string;
  poster: string;
  backdrop: string;
  rating: number;
  year: number;
  releaseDate?: string;
  genre: string;
  duration?: string;
  seasonsCount?: number;
  episodesPerSeason?: number;
  totalEpisodes?: number;
  seasons?: SeasonInfo[];
  trending?: boolean;
  isNewRelease?: boolean;
}

export const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10765: 'Sci-Fi & Fantasy'
};

// Verified API Key fallback for instant out-of-the-box syncing without configuration
const DEFAULT_API_KEY = '844dba0bfd8f3a4f3799f6130ef9e335';
const BASE_URL = 'https://api.themoviedb.org/3';

function getApiKey(): string {
  return import.meta.env.VITE_TMDB_API_KEY || DEFAULT_API_KEY;
}

// Convert raw TMDB API response item to standard MediaItem
function formatMediaItem(r: any, defaultType?: 'movie' | 'tv'): MediaItem {
  const type = (r.media_type || defaultType || (r.title ? 'movie' : 'tv')) as 'movie' | 'tv';
  const releaseDate = r.release_date || r.first_air_date || '';
  const parsedDate = releaseDate ? new Date(releaseDate) : null;
  const year = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.getFullYear() : 2024;
  
  // Format primary genre
  const genreIds: number[] = r.genre_ids || [];
  const primaryGenre = genreIds.length > 0 && GENRE_MAP[genreIds[0]] 
    ? GENRE_MAP[genreIds[0]] 
    : (type === 'movie' ? 'Feature Film' : 'TV Series');

  // Calculate if title is newly released (within ~90 days of today or released this month)
  const now = new Date();
  const diffDays = parsedDate && !isNaN(parsedDate.getTime())
    ? Math.floor((now.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  const isNewRelease = diffDays >= 0 && diffDays <= 90;

  const cachedDetails = tvDetailsCache.get(String(r.id));
  const seasonsCount = cachedDetails?.seasonsCount || r.number_of_seasons || (type === 'tv' ? 1 : undefined);
  const totalEpisodes = cachedDetails?.totalEpisodes || r.number_of_episodes;
  const seasons = cachedDetails?.seasons;
  const episodesPerSeason = cachedDetails?.seasons?.[0]?.episodeCount || 10;

  return {
    id: String(r.id),
    imdbId: r.imdb_id || (r.external_ids ? r.external_ids.imdb_id : undefined),
    title: r.title || r.name || 'Untitled',
    type,
    overview: r.overview || 'No synopsis available for this title.',
    poster: r.poster_path 
      ? `https://image.tmdb.org/t/p/w500${r.poster_path}` 
      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500',
    backdrop: r.backdrop_path 
      ? `https://image.tmdb.org/t/p/original${r.backdrop_path}` 
      : 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1280',
    rating: Number((r.vote_average || 7.5).toFixed(1)),
    year,
    releaseDate,
    genre: primaryGenre,
    seasonsCount,
    episodesPerSeason,
    totalEpisodes,
    seasons,
    trending: r.popularity > 40,
    isNewRelease
  };
}

// Memory Cache with TTL to allow live updates when new movies drop
interface CacheEntry {
  data: MediaItem[];
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes freshness window

export function clearTMDBCache() {
  cache.clear();
}

async function fetchFromTMDB(endpoint: string, defaultType?: 'movie' | 'tv', forceFresh: boolean = false): Promise<MediaItem[]> {
  const key = getApiKey();
  const cacheKey = `${endpoint}_${key}`;
  const cached = cache.get(cacheKey);

  if (!forceFresh && cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const delimiter = endpoint.includes('?') ? '&' : '?';
  const url = `${BASE_URL}${endpoint}${delimiter}api_key=${key}&include_adult=false`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
    const data = await res.json();
    const items = (data.results || []).map((r: any) => formatMediaItem(r, defaultType));
    cache.set(cacheKey, { data: items, timestamp: Date.now() });
    return items;
  } catch (err) {
    console.warn(`TMDB fetch failed for ${endpoint}:`, err);
    if (cached) return cached.data;
    return [];
  }
}

// 1. Fetch Real-Time Daily Trending (updates every 24h dynamically)
export async function getDailyTrending(type: 'all' | 'movie' | 'tv' = 'all'): Promise<MediaItem[]> {
  const res = await fetchFromTMDB(`/trending/${type}/day`, type === 'all' ? undefined : type);
  return res.length > 0 ? res : FALLBACK_CATALOG;
}

// 2. Fetch Weekly Trending
export async function getTrending(type: 'all' | 'movie' | 'tv' = 'all'): Promise<MediaItem[]> {
  const res = await fetchFromTMDB(`/trending/${type}/week`, type === 'all' ? undefined : type);
  return res.length > 0 ? res : FALLBACK_CATALOG;
}

// 3. Fetch In-Theatres & Brand New Cinema/VOD Releases (Guarantees newly released movies appear immediately)
export async function getNewReleases(page: number = 1): Promise<MediaItem[]> {
  const today = new Date().toISOString().split('T')[0];
  const [nowPlaying, recentReleases] = await Promise.all([
    fetchFromTMDB(`/movie/now_playing?page=${page}`, 'movie'),
    fetchFromTMDB(`/discover/movie?sort_by=primary_release_date.desc&primary_release_date.lte=${today}&vote_count.gte=10&page=${page}`, 'movie')
  ]);

  const map = new Map<string, MediaItem>();
  [...nowPlaying, ...recentReleases].forEach(item => {
    item.isNewRelease = true;
    map.set(item.id, item);
  });

  const list = Array.from(map.values());
  return list.length > 0 ? list : FALLBACK_CATALOG.filter(i => i.type === 'movie');
}

// 2. Fetch Popular Blockbuster Movies
export async function getPopularMovies(page: number = 1): Promise<MediaItem[]> {
  const res = await fetchFromTMDB(`/movie/popular?page=${page}`, 'movie');
  return res.length > 0 ? res : FALLBACK_CATALOG.filter(i => i.type === 'movie');
}

// 3. Fetch Top Rated Movies
export async function getTopRatedMovies(page: number = 1): Promise<MediaItem[]> {
  const res = await fetchFromTMDB(`/movie/top_rated?page=${page}`, 'movie');
  return res.length > 0 ? res : FALLBACK_CATALOG.filter(i => i.type === 'movie');
}

// 4. Fetch Popular & Binge-Worthy TV Series
export async function getPopularTV(page: number = 1): Promise<MediaItem[]> {
  const res = await fetchFromTMDB(`/tv/popular?page=${page}`, 'tv');
  return res.length > 0 ? res : FALLBACK_CATALOG.filter(i => i.type === 'tv');
}

// 5. Fetch Top Rated TV Series
export async function getTopRatedTV(page: number = 1): Promise<MediaItem[]> {
  const res = await fetchFromTMDB(`/tv/top_rated?page=${page}`, 'tv');
  return res.length > 0 ? res : FALLBACK_CATALOG.filter(i => i.type === 'tv');
}

// 6. Fetch Authentic Japanese Anime (TV + Movies)
export async function getAnimeCatalog(page: number = 1): Promise<MediaItem[]> {
  const [tvAnime, movieAnime] = await Promise.all([
    fetchFromTMDB(`/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=${page}`, 'tv'),
    fetchFromTMDB(`/discover/movie?with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=${page}`, 'movie')
  ]);

  const combined = [...tvAnime, ...movieAnime];
  return combined.length > 0 ? combined : FALLBACK_CATALOG.filter(i => i.genre.includes('Anime'));
}

// 7. Fetch Movies by Genre (Action, Sci-Fi, Horror, Comedy, etc.)
export async function getMoviesByGenre(genreId: number, page: number = 1): Promise<MediaItem[]> {
  return fetchFromTMDB(`/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&page=${page}`, 'movie');
}

// 8. Fetch Bollywood / Hindi Movies
export async function getBollywoodMovies(page: number = 1): Promise<MediaItem[]> {
  const res = await fetchFromTMDB(`/discover/movie?with_original_language=hi&sort_by=popularity.desc&page=${page}`, 'movie');
  return res.length > 0 ? res : DEFAULT_BOLLYWOOD_MOVIES;
}

// 9. Fetch Bollywood / Hindi TV & Web Series
export async function getBollywoodSeries(page: number = 1): Promise<MediaItem[]> {
  const res = await fetchFromTMDB(`/discover/tv?with_original_language=hi&sort_by=popularity.desc&page=${page}`, 'tv');
  return res.length > 0 ? res : DEFAULT_BOLLYWOOD_SERIES;
}

// 10. Fetch Korean Drama Series (K-Drama)
export async function getKDramaSeries(page: number = 1): Promise<MediaItem[]> {
  const res = await fetchFromTMDB(`/discover/tv?with_original_language=ko&without_genres=10767,10764,10763,16&vote_count.gte=10&sort_by=popularity.desc&page=${page}`, 'tv');
  return res.length > 0 ? res : DEFAULT_KDRAMA_SERIES;
}

// 11. Fetch Korean Cinema & Movies
export async function getKDramaMovies(page: number = 1): Promise<MediaItem[]> {
  return fetchFromTMDB(`/discover/movie?with_original_language=ko&sort_by=popularity.desc&page=${page}`, 'movie');
}

// 12. Fetch Chinese Drama Series (C-Drama)
export async function getCDramaSeries(page: number = 1): Promise<MediaItem[]> {
  const res = await fetchFromTMDB(`/discover/tv?with_original_language=zh&without_genres=10767,10764,10763,16&vote_count.gte=8&sort_by=popularity.desc&page=${page}`, 'tv');
  return res.length > 0 ? res : DEFAULT_CDRAMA_SERIES;
}

// 13. Fetch Chinese Cinema & Movies
export async function getCDramaMovies(page: number = 1): Promise<MediaItem[]> {
  return fetchFromTMDB(`/discover/movie?with_original_language=zh&sort_by=popularity.desc&page=${page}`, 'movie');
}

// 14. Dedicated Category Browse Pipeline (Movies, TV Shows, Anime, K-Drama, C-Drama, Bollywood)
export interface CategoryBrowseParams {
  category: 'movie' | 'tv' | 'anime' | 'kdrama' | 'cdrama' | 'bollywood';
  genreId?: number;
  sortBy?: 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc' | 'title.asc';
  page?: number;
  searchQuery?: string;
}

export async function fetchCategoryBrowseMedia({
  category,
  genreId = 0,
  sortBy = 'popularity.desc',
  page = 1,
  searchQuery = ''
}: CategoryBrowseParams): Promise<{ items: MediaItem[]; totalResults?: number }> {
  const cleanSearch = searchQuery.trim();

  // If user searched inside category, route through search API
  if (cleanSearch) {
    const key = getApiKey();
    const type = (category === 'tv' || category === 'kdrama' || category === 'cdrama') ? 'tv' : 'movie';
    const searchUrl = `${BASE_URL}/search/${type}?api_key=${key}&query=${encodeURIComponent(cleanSearch)}&page=${page}&include_adult=false`;
    try {
      const res = await fetch(searchUrl);
      if (res.ok) {
        const data = await res.json();
        const results = (data.results || []).map((r: any) => formatMediaItem(r, type));
        return { items: results, totalResults: data.total_results || results.length };
      }
    } catch (e) {
      console.warn('Category search error:', e);
    }
  }

  // Otherwise, use discover API with genre, sorting, and pagination
  let endpoint = '';
  let defaultType: 'movie' | 'tv' = 'movie';

  // Construct sort param for TV vs Movie
  let effectiveSort: string = sortBy;
  const isTVCategory = category === 'tv' || category === 'kdrama' || category === 'cdrama';
  if (isTVCategory && sortBy === 'primary_release_date.desc') {
    effectiveSort = 'first_air_date.desc';
  }
  if (isTVCategory && sortBy === 'title.asc') {
    effectiveSort = 'name.asc';
  }
  const voteFilter = sortBy === 'vote_average.desc' ? '&vote_count.gte=30' : '';

  if (category === 'movie') {
    defaultType = 'movie';
    const genreParam = genreId > 0 ? `&with_genres=${genreId}` : '';
    endpoint = `/discover/movie?sort_by=${effectiveSort}&page=${page}${genreParam}${voteFilter}`;
  } else if (category === 'tv') {
    defaultType = 'tv';
    const genreParam = genreId > 0 ? `&with_genres=${genreId}` : '';
    endpoint = `/discover/tv?sort_by=${effectiveSort}&page=${page}${genreParam}${voteFilter}`;
  } else if (category === 'kdrama') {
    defaultType = 'tv';
    const genreParam = genreId > 0 ? `&with_genres=${genreId}` : '';
    endpoint = `/discover/tv?with_original_language=ko&without_genres=10767,10764,10763,16&vote_count.gte=10&sort_by=${effectiveSort}&page=${page}${genreParam}${voteFilter}`;
  } else if (category === 'cdrama') {
    defaultType = 'tv';
    const genreParam = genreId > 0 ? `&with_genres=${genreId}` : '';
    endpoint = `/discover/tv?with_original_language=zh&without_genres=10767,10764,10763,16&vote_count.gte=8&sort_by=${effectiveSort}&page=${page}${genreParam}${voteFilter}`;
  } else if (category === 'anime') {
    defaultType = 'tv';
    if (genreId === 99999) {
      // 🇨🇳 Donghua - Chinese Animation
      endpoint = `/discover/tv?with_genres=16&with_original_language=zh&sort_by=${effectiveSort}&page=${page}${voteFilter}`;
    } else {
      const genreParam = genreId > 0 ? `&with_genres=16,${genreId}` : '&with_genres=16';
      endpoint = `/discover/tv?with_original_language=ja&sort_by=${effectiveSort}&page=${page}${genreParam}${voteFilter}`;
    }
  } else if (category === 'bollywood') {
    defaultType = 'movie';
    const genreParam = genreId > 0 ? `&with_genres=${genreId}` : '';
    endpoint = `/discover/movie?with_original_language=hi&sort_by=${effectiveSort}&page=${page}${genreParam}${voteFilter}`;
  }

  const items = await fetchFromTMDB(endpoint, defaultType);
  return { items, totalResults: items.length > 0 ? 1000 : 0 };
}

// TV Details & Episode In-Memory Caches
const tvDetailsCache = new Map<string, TVDetails>();
const seasonEpisodesCache = new Map<string, EpisodeInfo[]>();

// 11. Fetch Complete TV Show Season & Episode Structure from TMDB
export async function fetchTVShowDetails(tvId: string): Promise<TVDetails | null> {
  const cached = tvDetailsCache.get(String(tvId));
  if (cached) return cached;

  const key = getApiKey();
  const endpoint = `${BASE_URL}/tv/${tvId}?api_key=${key}&append_to_response=external_ids`;

  try {
    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      const rawSeasons: any[] = data.seasons || [];

      // Primary seasons: season_number > 0
      const filtered: SeasonInfo[] = rawSeasons
        .filter((s: any) => s.season_number > 0)
        .map((s: any) => ({
          seasonNumber: s.season_number,
          name: s.name || `Season ${s.season_number}`,
          episodeCount: s.episode_count || 10,
          poster: s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : undefined,
          airDate: s.air_date,
          overview: s.overview
        }));

      // If Specials exist (season 0), append at the end
      const specials = rawSeasons.find((s: any) => s.season_number === 0);
      if (specials && specials.episode_count > 0) {
        filtered.push({
          seasonNumber: 0,
          name: specials.name || 'Specials',
          episodeCount: specials.episode_count,
          poster: specials.poster_path ? `https://image.tmdb.org/t/p/w500${specials.poster_path}` : undefined,
          airDate: specials.air_date,
          overview: specials.overview
        });
      }

      const seasonsCount = data.number_of_seasons || filtered.length || 1;
      const totalEpisodes = data.number_of_episodes || filtered.reduce((acc, s) => acc + s.episodeCount, 0);
      const imdbId = data.imdb_id || (data.external_ids ? data.external_ids.imdb_id : null) || undefined;

      const result: TVDetails = {
        seasonsCount,
        totalEpisodes,
        seasons: filtered,
        imdbId
      };

      tvDetailsCache.set(String(tvId), result);
      return result;
    }
  } catch (err) {
    console.warn(`[TMDB] Error fetching TV details for ID ${tvId}:`, err);
  }

  return null;
}

// 12. Fetch Individual Season Episodes (Titles, Overview, Stills, Runtimes)
export async function fetchSeasonEpisodes(tvId: string, seasonNumber: number): Promise<EpisodeInfo[]> {
  const cacheKey = `${tvId}_season_${seasonNumber}`;
  const cached = seasonEpisodesCache.get(cacheKey);
  if (cached) return cached;

  const key = getApiKey();
  const endpoint = `${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${key}`;

  try {
    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      const episodes: EpisodeInfo[] = (data.episodes || []).map((ep: any) => ({
        episodeNumber: ep.episode_number,
        seasonNumber: ep.season_number,
        name: ep.name || `Episode ${ep.episode_number}`,
        overview: ep.overview,
        stillPath: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : undefined,
        airDate: ep.air_date,
        runtime: ep.runtime,
        voteAverage: ep.vote_average
      }));
      seasonEpisodesCache.set(cacheKey, episodes);
      return episodes;
    }
  } catch (err) {
    console.warn(`[TMDB] Error fetching season ${seasonNumber} episodes for TV ${tvId}:`, err);
  }

  return [];
}

// 13. Convert TMDB (Season, Episode) to Absolute Episode Number (For Anime & Continuous Shows)
export function getAbsoluteEpisodeNumber(seasons: SeasonInfo[], seasonNumber: number, episodeNumber: number): number {
  let count = 0;
  for (const s of seasons) {
    if (s.seasonNumber > 0 && s.seasonNumber < seasonNumber) {
      count += s.episodeCount;
    } else if (s.seasonNumber === seasonNumber) {
      return count + episodeNumber;
    }
  }
  return count + episodeNumber;
}

// 14. Convert Absolute Episode Number to TMDB (Season, Episode)
export function getSeasonAndEpisodeFromAbsolute(
  seasons: SeasonInfo[], 
  absoluteEpisode: number
): { season: number; episode: number; seasonName?: string } {
  let remaining = Math.max(1, absoluteEpisode);
  const validSeasons = seasons.filter(s => s.seasonNumber > 0);
  if (validSeasons.length === 0) {
    return { season: 1, episode: remaining };
  }
  for (const s of validSeasons) {
    if (remaining <= s.episodeCount) {
      return { season: s.seasonNumber, episode: remaining, seasonName: s.name };
    }
    remaining -= s.episodeCount;
  }
  const last = validSeasons[validSeasons.length - 1];
  return { 
    season: last.seasonNumber, 
    episode: Math.min(last.episodeCount, Math.max(1, remaining)), 
    seasonName: last.name 
  };
}

// 15. Fetch IMDb ID & Auto-populate TV Show Seasons
export async function syncImdbId(item: MediaItem): Promise<string> {
  if (item.imdbId && item.imdbId.startsWith('tt')) {
    if (item.type === 'tv' && (!item.seasons || item.seasons.length === 0)) {
      fetchTVShowDetails(item.id).then(details => {
        if (details) {
          item.seasons = details.seasons;
          item.seasonsCount = details.seasonsCount;
          item.totalEpisodes = details.totalEpisodes;
        }
      }).catch(() => {});
    }
    return item.imdbId;
  }

  const key = getApiKey();
  const endpoint = item.type === 'movie' 
    ? `${BASE_URL}/movie/${item.id}?api_key=${key}&append_to_response=external_ids`
    : `${BASE_URL}/tv/${item.id}?api_key=${key}&append_to_response=external_ids`;

  try {
    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      const resolvedImdb = data.imdb_id || (data.external_ids ? data.external_ids.imdb_id : null);
      if (resolvedImdb) {
        item.imdbId = resolvedImdb;
      }
      if (item.type === 'tv') {
        const rawSeasons: any[] = data.seasons || [];
        const filtered: SeasonInfo[] = rawSeasons
          .filter((s: any) => s.season_number > 0)
          .map((s: any) => ({
            seasonNumber: s.season_number,
            name: s.name || `Season ${s.season_number}`,
            episodeCount: s.episode_count || 10,
            poster: s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : undefined,
            airDate: s.air_date,
            overview: s.overview
          }));
        const specials = rawSeasons.find((s: any) => s.season_number === 0);
        if (specials && specials.episode_count > 0) {
          filtered.push({
            seasonNumber: 0,
            name: specials.name || 'Specials',
            episodeCount: specials.episode_count,
            poster: specials.poster_path ? `https://image.tmdb.org/t/p/w500${specials.poster_path}` : undefined,
            airDate: specials.air_date,
            overview: specials.overview
          });
        }
        item.seasons = filtered;
        item.seasonsCount = data.number_of_seasons || filtered.length || 1;
        item.totalEpisodes = data.number_of_episodes;
        if (filtered[0]?.episodeCount) {
          item.episodesPerSeason = filtered[0].episodeCount;
        }
        tvDetailsCache.set(String(item.id), {
          seasonsCount: item.seasonsCount || 1,
          totalEpisodes: data.number_of_episodes || 0,
          seasons: filtered,
          imdbId: item.imdbId
        });
      }
      if (resolvedImdb) return resolvedImdb;
    }
  } catch (e) {
    console.warn(`Could not resolve IMDb ID for ${item.title}:`, e);
  }

  // Fallback pattern
  return `tt${item.id}`;
}

// 9. Multi-Catalog Search (Movies, TV Shows, Anime)
export async function searchMedia(query: string): Promise<MediaItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const key = getApiKey();
  const url = `${BASE_URL}/search/multi?api_key=${key}&query=${encodeURIComponent(cleanQuery)}&include_adult=false`;

  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return (data.results || [])
        .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
        .slice(0, 24)
        .map((r: any) => formatMediaItem(r));
    }
  } catch (e) {
    console.warn('Search failed, falling back to local matches:', e);
  }

  return FALLBACK_CATALOG.filter(
    item => item.title.toLowerCase().includes(cleanQuery.toLowerCase()) || item.genre.toLowerCase().includes(cleanQuery.toLowerCase())
  );
}

// Comprehensive Fallback Catalog (Used if completely offline)
export const DEFAULT_BOLLYWOOD_MOVIES: MediaItem[] = [
  {
    id: '579974',
    imdbId: 'tt8178634',
    title: 'RRR (Rise Roar Revolt)',
    type: 'movie',
    overview: 'A fearless revolutionary and an officer in the British force, who once shared a deep bond, decide to join forces and chart out an inspiring path of freedom against the despotic rulers.',
    poster: 'https://image.tmdb.org/t/p/w500/nEufeZlyAOLqO2brrs0yeMu1QXO.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/m03jul0YcbEOuvUsGm4Q4gH92L.jpg',
    rating: 8.0,
    year: 2022,
    genre: 'Bollywood / Action',
    duration: '3h 7m',
    trending: true
  },
  {
    id: '872906',
    imdbId: 'tt15354916',
    title: 'Jawan',
    type: 'movie',
    overview: 'An emotional journey of a prison warden driven by a personal vendetta to rectify the wrongs in society, while keeping a promise made years ago.',
    poster: 'https://image.tmdb.org/t/p/w500/j1q9qF2y5s25nUq15s1b1b1b1b1.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/m03jul0YcbEOuvUsGm4Q4gH92L.jpg',
    rating: 7.6,
    year: 2023,
    genre: 'Bollywood / Action',
    duration: '2h 49m',
    trending: true
  },
  {
    id: '864692',
    imdbId: 'tt12844910',
    title: 'Pathaan',
    type: 'movie',
    overview: 'An Indian spy takes on the leader of a group of mercenaries who have nefarious plans to target India with a deadly biological weapon.',
    poster: 'https://image.tmdb.org/t/p/w500/m1b9HYPjjBf3iEfa7w0t6JpE2Fk.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/jr81FVhvGRL8Qp0gePQdqvi0EN4.jpg',
    rating: 7.2,
    year: 2023,
    genre: 'Bollywood / Thriller',
    duration: '2h 26m',
    trending: true
  },
  {
    id: '1079091',
    imdbId: 'tt28346066',
    title: 'Stree 2: Sarkate Ka Aatank',
    type: 'movie',
    overview: 'The town of Chanderi is being haunted again. This time women are mysteriously abducted by a headless entity known as Sarkata.',
    poster: 'https://image.tmdb.org/t/p/w500/mox43d6V1qB2gZ6F9V3b2D9J.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/cgkO265tbt4G5wG4p5v6V4Q4l.jpg',
    rating: 7.5,
    year: 2024,
    genre: 'Bollywood / Comedy Horror',
    duration: '2h 27m',
    trending: true
  },
  {
    id: '20453',
    imdbId: 'tt1187043',
    title: '3 Idiots',
    type: 'movie',
    overview: 'Two friends embark on a quest for a lost buddy. On this journey, they encounter a forgotten bet, a wedding they must crash, and a funeral that goes impossibly out of control.',
    poster: 'https://image.tmdb.org/t/p/w500/66A9MqXOyVFCssoloscw79z8Tew.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/u7kuU08nF9T19k2a2eW4N7UoN8r.jpg',
    rating: 8.4,
    year: 2009,
    genre: 'Bollywood / Comedy',
    duration: '2h 50m'
  },
  {
    id: '360814',
    imdbId: 'tt5074352',
    title: 'Dangal',
    type: 'movie',
    overview: 'Former wrestler Mahavir Singh Phogat trains his daughters Geeta and Babita to become India\'s first world-class female wrestlers against all social stigmas.',
    poster: 'https://image.tmdb.org/t/p/w500/5A6ZcZf879YqZ4oU6Cq12P6W9z.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/9rde18C9UvL71r6cQ0W0h0J4Q9z.jpg',
    rating: 8.2,
    year: 2016,
    genre: 'Bollywood / Biography',
    duration: '2h 41m'
  },
  {
    id: '634492',
    imdbId: 'tt10698680',
    title: 'K.G.F: Chapter 2',
    type: 'movie',
    overview: 'The blood-soaked land of Kolar Gold Fields has a new overlord now, Rocky, whose name strikes fear in the heart of his foes as he battles Adheera.',
    poster: 'https://image.tmdb.org/t/p/w500/khCgN08kG3Fz9xQ3N2M4a5g7r.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/70Xq3N2v2M4a5g7r8b9N08kG3.jpg',
    rating: 8.3,
    year: 2022,
    genre: 'Bollywood / Action',
    duration: '2h 48m',
    trending: true
  },
  {
    id: '353486',
    imdbId: 'tt4849438',
    title: 'Baahubali 2: The Conclusion',
    type: 'movie',
    overview: 'When Shiva, the son of Bahubali, learns about his heritage, he begins to look for answers. His story is juxtaposed with past events in the Mahishmati Kingdom.',
    poster: 'https://image.tmdb.org/t/p/w500/9xj3C6pXk0p8yL0b8c0W0h0J.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/70Xq3N2v2M4a5g7r8b9N08kG3.jpg',
    rating: 8.2,
    year: 2017,
    genre: 'Bollywood / Action Fantasy',
    duration: '2h 47m'
  },
  {
    id: '781732',
    imdbId: 'tt13751694',
    title: 'Animal',
    type: 'movie',
    overview: 'A son undergoes a remarkable transformation as the bond with his father begins to fracture, and he sets out on a path of ruthless vengeance.',
    poster: 'https://image.tmdb.org/t/p/w500/hrHA5XbTszmD58c67nF4k4D9z.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/yDHYTjA3R0ne82juh4vyuh832jT.jpg',
    rating: 7.1,
    year: 2023,
    genre: 'Bollywood / Crime',
    duration: '3h 24m'
  },
  {
    id: '12228',
    imdbId: 'tt0073707',
    title: 'Sholay',
    type: 'movie',
    overview: 'After his family is murdered by a notorious and ruthless bandit of the ravines, a former police officer enlists the services of two outlaws to capture him.',
    poster: 'https://image.tmdb.org/t/p/w500/yZ0tJ5bY4j0c2p4k2p4k2p4k2p.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    rating: 8.2,
    year: 1975,
    genre: 'Bollywood / Classic Action',
    duration: '3h 24m'
  }
];

export const DEFAULT_BOLLYWOOD_SERIES: MediaItem[] = [
  {
    id: '83631',
    imdbId: 'tt6473300',
    title: 'Mirzapur',
    type: 'tv',
    overview: 'The iron-fisted Akhandanand Tripathi is a millionaire carpet exporter and the mafia don of Mirzapur. His son Munna is an unworthy, power-hungry heir.',
    poster: 'https://image.tmdb.org/t/p/w500/qVbL6g5M1h4k4D9zr8b9N08kG3.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/7MRgJ0b1fX6yH8m9W8yF8k7O1.jpg',
    rating: 8.5,
    year: 2018,
    genre: 'Bollywood / Crime Drama',
    seasonsCount: 3,
    episodesPerSeason: 10,
    trending: true
  },
  {
    id: '79352',
    imdbId: 'tt6077448',
    title: 'Sacred Games',
    type: 'tv',
    overview: 'A link in their pasts leads an honest cop to a fugitive gang boss, whose cryptic warning spurs the officer on a quest to save Mumbai from cataclysm.',
    poster: 'https://image.tmdb.org/t/p/w500/vQ9xQ3N2v2M4a5g7r8b9N08kG3.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    rating: 8.6,
    year: 2018,
    genre: 'Bollywood / Mystery Thriller',
    seasonsCount: 2,
    episodesPerSeason: 8,
    trending: true
  },
  {
    id: '92749',
    imdbId: 'tt9544034',
    title: 'The Family Man',
    type: 'tv',
    overview: 'A middle-class man who works for a special cell of the National Investigation Agency must protect the nation from terrorists while protecting his family from his secretive job.',
    poster: 'https://image.tmdb.org/t/p/w500/nEufeZlyAOLqO2brrs0yeMu1QXO.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
    rating: 8.7,
    year: 2019,
    genre: 'Bollywood / Action Spy',
    seasonsCount: 2,
    episodesPerSeason: 9,
    trending: true
  },
  {
    id: '100757',
    imdbId: 'tt12004706',
    title: 'Panchayat',
    type: 'tv',
    overview: 'An engineering graduate takes up a job as a secretary of a Panchayat office in a remote village of Uttar Pradesh due to lack of better job options.',
    poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/m99F0P8wGdn4v7UuhPvhfUf40j.jpg',
    rating: 8.9,
    year: 2020,
    genre: 'Bollywood / Comedy Drama',
    seasonsCount: 3,
    episodesPerSeason: 8,
    trending: true
  },
  {
    id: '153496',
    imdbId: 'tt14235948',
    title: 'Farzi',
    type: 'tv',
    overview: 'A brilliant small-time artist is pulled into the high-stakes world of counterfeiting after he creates the ultimate fake currency note.',
    poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520b22.jpg',
    rating: 8.4,
    year: 2023,
    genre: 'Bollywood / Crime Thriller',
    seasonsCount: 1,
    episodesPerSeason: 8,
    trending: true
  },
  {
    id: '111803',
    imdbId: 'tt12925660',
    title: 'Scam 1992: The Harshad Mehta Story',
    type: 'tv',
    overview: 'Set in 1980\'s & 90\'s Bombay, follow the life of stockbroker Harshad Mehta, who took the stock market to dizzying heights and his catastrophic downfall.',
    poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/rAiYTsqJJR9asvkNxGmQ0Y0r9F5.jpg',
    rating: 9.3,
    year: 2020,
    genre: 'Bollywood / Financial Drama',
    seasonsCount: 1,
    episodesPerSeason: 10,
    trending: true
  }
];

// Korean Drama (K-Drama) Fallback Catalog
export const DEFAULT_KDRAMA_SERIES: MediaItem[] = [
  {
    id: '215720',
    title: 'Queen of Tears',
    type: 'tv',
    overview: 'The queen of department stores and the prince of supermarkets weather a marital crisis—until love miraculously begins to bloom again.',
    poster: 'https://image.tmdb.org/t/p/w500/7ZXLZ3KYL3IVvsSHBZaHjcNQzNU.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/wcP3FsRLog4GNEs9PFrDKKQdcof.jpg',
    rating: 8.4,
    year: 2024,
    genre: 'K-Drama / Romance',
    seasonsCount: 1,
    episodesPerSeason: 16,
    trending: true
  },
  {
    id: '93405',
    imdbId: 'tt10919420',
    title: 'Squid Game',
    type: 'tv',
    overview: 'Hundreds of cash-strapped players accept a strange invitation to compete in children\'s games. Inside, a tempting prize awaits — with deadly high stakes.',
    poster: 'https://image.tmdb.org/t/p/w500/1QdXdRYfktUSONkl1oD5gc6Be0s.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/5aE1kxWg6RhgQxJTXTxifv4uq7P.jpg',
    rating: 7.9,
    year: 2021,
    genre: 'K-Drama / Mystery Thriller',
    seasonsCount: 2,
    episodesPerSeason: 9,
    trending: true
  },
  {
    id: '94796',
    title: 'Crash Landing on You',
    type: 'tv',
    overview: 'A paragliding mishap drops a South Korean heiress in North Korea -- and into the life of an army officer, who decides he will help her hide.',
    poster: 'https://image.tmdb.org/t/p/w500/fgBNLPr6mC8pxuR79ENAJY4nBmj.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/3yEHM2HT2vrUtO93YzTJNgEfiZG.jpg',
    rating: 8.5,
    year: 2019,
    genre: 'K-Drama / Romance',
    seasonsCount: 1,
    episodesPerSeason: 16,
    trending: true
  },
  {
    id: '136283',
    title: 'The Glory',
    type: 'tv',
    overview: 'Years after surviving horrific abuse in high school, a woman puts an elaborate revenge scheme in motion to make the perpetrators pay for their crimes.',
    poster: 'https://image.tmdb.org/t/p/w500/uUM4LVlPgIrww07OoEKrGWlS1Ej.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/AjwoDj77HLlqcpwEGqsnvMXm5my.jpg',
    rating: 8.5,
    year: 2022,
    genre: 'K-Drama / Revenge Drama',
    seasonsCount: 1,
    episodesPerSeason: 16,
    trending: true
  },
  {
    id: '230923',
    title: 'Lovely Runner',
    type: 'tv',
    overview: 'Right after Ryu Sun-jae, a top star, ends his life, Im Sol, his top fan, somehow ends up at a time when they were in high school and tries to protect him.',
    poster: 'https://image.tmdb.org/t/p/w500/adcdNzLJ8LOjWJjNFrapXGzFco3.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/vbkpl0ps4s5tMTUnC7SFXNzWmVr.jpg',
    rating: 8.6,
    year: 2024,
    genre: 'K-Drama / Fantasy Romance',
    seasonsCount: 1,
    episodesPerSeason: 16,
    trending: true
  },
  {
    id: '212204',
    title: 'Twinkling Watermelon',
    type: 'tv',
    overview: 'A CODA student born with a gift for music crash lands at an unfamiliar place after time traveling through a suspicious music shop.',
    poster: 'https://image.tmdb.org/t/p/w500/bwTzW1wTgUxUOQruhT8DvinUYgR.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/efaMS00Fevc3fw2dbeP7rh22O6D.jpg',
    rating: 8.8,
    year: 2023,
    genre: 'K-Drama / Youth Fantasy',
    seasonsCount: 1,
    episodesPerSeason: 16,
    trending: true
  },
  {
    id: '154825',
    title: 'Business Proposal',
    type: 'tv',
    overview: 'In disguise as her friend, Ha-ri shows up to a blind date to scare him away. But plans go awry when he turns out to be her CEO — and makes a proposal.',
    poster: 'https://image.tmdb.org/t/p/w500/iLh7L8ZuvgdxFaM9sImyv2iKYLe.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/lq0YqJuffMuZhoKTiC5xDqvtCSn.jpg',
    rating: 8.5,
    year: 2022,
    genre: 'K-Drama / Rom-Com',
    seasonsCount: 1,
    episodesPerSeason: 12,
    trending: true
  },
  {
    id: '117376',
    title: 'Vincenzo',
    type: 'tv',
    overview: 'During a visit to his motherland, a Korean-Italian Mafia lawyer gives an unrivaled conglomerate a taste of its own medicine with a side of justice.',
    poster: 'https://image.tmdb.org/t/p/w500/qbkSS1cTjT4DzIwD44bdhTuYgdT.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/sf7NCqyVUNoyjYuwW5oJke1T1lH.jpg',
    rating: 8.5,
    year: 2021,
    genre: 'K-Drama / Crime Comedy',
    seasonsCount: 1,
    episodesPerSeason: 20,
    trending: true
  },
  {
    id: '135157',
    title: 'Alchemy of Souls',
    type: 'tv',
    overview: 'A powerful sorceress in a blind woman\'s body encounters a man from a prestigious family, who wants her help to change his destiny.',
    poster: 'https://image.tmdb.org/t/p/w500/gvOZN1NlAoL8iz9ghpES1zWA3w3.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/nBZyWSGAUEzCH7Mna0zUNTpBQlQ.jpg',
    rating: 8.6,
    year: 2022,
    genre: 'K-Drama / Fantasy Romance',
    seasonsCount: 2,
    episodesPerSeason: 10,
    trending: true
  },
  {
    id: '99966',
    title: 'All of Us Are Dead',
    type: 'tv',
    overview: 'A high school becomes ground zero for a zombie virus outbreak. Trapped students must fight their way out — or turn into one of the rabid infected.',
    poster: 'https://image.tmdb.org/t/p/w500/pTEFqAjLd5YTsMD6NSUxV6Dq7A6.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/8hp2CuGnw1iP5dLBVMAPUv23swx.jpg',
    rating: 8.3,
    year: 2022,
    genre: 'K-Drama / Action Horror',
    seasonsCount: 1,
    episodesPerSeason: 12,
    trending: true
  }
];

// Chinese Drama (C-Drama) Fallback Catalog
export const DEFAULT_CDRAMA_SERIES: MediaItem[] = [
  {
    id: '210733',
    title: 'Hidden Love',
    type: 'tv',
    overview: 'Since high school, Sang Zhi has had a crush on Duan Jiaxu. When fate brings them together again, they find a chance to embark on a sweet relationship.',
    poster: 'https://image.tmdb.org/t/p/w500/riGzESa9N9toumP9OhMmg0QvFPD.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/wQlJJJ50gKphCci0SmoetUXmJN4.jpg',
    rating: 8.5,
    year: 2023,
    genre: 'C-Drama / Modern Romance',
    seasonsCount: 1,
    episodesPerSeason: 25,
    trending: true
  },
  {
    id: '137206',
    title: 'Till The End of The Moon',
    type: 'tv',
    overview: 'To save the world from the Devil God, an immortal elder sends Li Susu back five hundred years in time to extract the evil bone before he transforms.',
    poster: 'https://image.tmdb.org/t/p/w500/kxKZyeAloZYZqLyLEoB7ckdMN5F.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/5fhS6Bh4VnF0SOZyZnhNpc0XHDb.jpg',
    rating: 8.3,
    year: 2023,
    genre: 'C-Drama / Xianxia Fantasy',
    seasonsCount: 1,
    episodesPerSeason: 40,
    trending: true
  },
  {
    id: '130368',
    title: 'Love Between Fairy and Devil',
    type: 'tv',
    overview: 'When a low-ranked fairy accidentally resurrects a powerful demon lord, their fates become cosmically entangled as the three realms are thrown into turmoil.',
    poster: 'https://image.tmdb.org/t/p/w500/mNgUuTGkOj19Z09zKa76bE6J5Di.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/pECcUE53TjkrR2VsAgF7JICzH7k.jpg',
    rating: 8.3,
    year: 2022,
    genre: 'C-Drama / Xianxia Romance',
    seasonsCount: 1,
    episodesPerSeason: 36,
    trending: true
  },
  {
    id: '90761',
    title: 'The Untamed',
    type: 'tv',
    overview: 'In a magical world of inter-clan rivalry, two soulmates face treacherous schemes and uncover a dark mystery linked to a tragic event in the past.',
    poster: 'https://image.tmdb.org/t/p/w500/8TZbpPpLQVS2i7P7yUVhrFlFsmW.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/ampkwvfwO7o5YMwYAVPKx1PLDaB.jpg',
    rating: 8.7,
    year: 2019,
    genre: 'C-Drama / Wuxia Fantasy',
    seasonsCount: 1,
    episodesPerSeason: 50,
    trending: true
  },
  {
    id: '207197',
    title: 'Story of Kunning Palace',
    type: 'tv',
    overview: 'A fallen queen who aspired to the highest power is reborn, determined to avoid past mistakes and rewrite her tragic fate in the imperial court.',
    poster: 'https://image.tmdb.org/t/p/w500/idcVj88MODVdBkaKpxNMiXwffLk.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/3OLeiLbTdNFovd2zyBn2xgR8UWY.jpg',
    rating: 7.7,
    year: 2023,
    genre: 'C-Drama / Historical Romance',
    seasonsCount: 1,
    episodesPerSeason: 38,
    trending: true
  },
  {
    id: '236033',
    title: 'The Double',
    type: 'tv',
    overview: 'Xue Fangfei, who lost everything after a major betrayal, assumes a new identity and seeks justice against the corrupt elites with the help of Duke Xiao Heng.',
    poster: 'https://image.tmdb.org/t/p/w500/u4zFeoSUlqp18yPbzppi5oZRlgH.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/f0i9Fg9Krg2oXONxDdaf2yAJmJ3.jpg',
    rating: 8.2,
    year: 2024,
    genre: 'C-Drama / Revenge Costume',
    seasonsCount: 1,
    episodesPerSeason: 40,
    trending: true
  },
  {
    id: '95842',
    title: 'Joy of Life',
    type: 'tv',
    overview: 'A young man with modern memories is born into an ancient kingdom, navigating political intrigue, martial arts clans, and uncovering his true origins.',
    poster: 'https://image.tmdb.org/t/p/w500/vlHJfLsduZiILN8eYdN57kHZTcQ.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/u1CqlLecfpcuOaugKi3ol9gDQHJ.jpg',
    rating: 8.0,
    year: 2019,
    genre: 'C-Drama / Historical Wuxia',
    seasonsCount: 2,
    episodesPerSeason: 36,
    trending: true
  },
  {
    id: '228547',
    title: 'When I Fly Towards You',
    type: 'tv',
    overview: 'Set off by a sweet chance encounter, 16-year-old Su Zaizai finds herself drawn to Zhang Lurang — her smart, charming yet distant schoolmate.',
    poster: 'https://image.tmdb.org/t/p/w500/mjCChwZcEZ9902tUAG1hWZlfOHm.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/3nWfjIBUyYUCABI7Fsl1AhNhDAr.jpg',
    rating: 8.8,
    year: 2023,
    genre: 'C-Drama / Youth Romance',
    seasonsCount: 1,
    episodesPerSeason: 24,
    trending: true
  },
  {
    id: '155441',
    title: 'Reset',
    type: 'tv',
    overview: 'The lives of a college student and a video game designer are repeatedly reset after an explosion on a bus. They must work together to break the time loop.',
    poster: 'https://image.tmdb.org/t/p/w500/ceAOKLPjGUbCOYtxXK7pQfpVVwb.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/c9rbvPGRWtm1RTZGNuxWfPjRAM3.jpg',
    rating: 8.1,
    year: 2022,
    genre: 'C-Drama / Sci-Fi Suspense',
    seasonsCount: 1,
    episodesPerSeason: 15,
    trending: true
  },
  {
    id: '95486',
    title: 'Falling Into Your Smile',
    type: 'tv',
    overview: 'After joining an all-male professional e-sports team, an elite amateur gamer proves herself and leads her squad to the world championships.',
    poster: 'https://image.tmdb.org/t/p/w500/tUZIA55rA44TazA11urdbHRtYJK.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/l3QyCntq6m4E7WTCLsq4DC7NLW1.jpg',
    rating: 7.9,
    year: 2021,
    genre: 'C-Drama / E-Sports Rom-Com',
    seasonsCount: 1,
    episodesPerSeason: 31,
    trending: true
  }
];

// Comprehensive Fallback Catalog (Used if completely offline)
export const FALLBACK_CATALOG: MediaItem[] = [
  {
    id: '693134',
    imdbId: 'tt15239678',
    title: 'Dune: Part Two',
    type: 'movie',
    overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.',
    poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520b22.jpg',
    rating: 8.3,
    year: 2024,
    genre: 'Sci-Fi',
    duration: '2h 46m',
    trending: true
  },
  {
    id: '533535',
    imdbId: 'tt6263850',
    title: 'Deadpool & Wolverine',
    type: 'movie',
    overview: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up.',
    poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/yDHYTjA3R0ne82juh4vyuh832jT.jpg',
    rating: 7.7,
    year: 2024,
    genre: 'Action',
    duration: '2h 8m',
    trending: true
  },
  {
    id: '872585',
    imdbId: 'tt15398776',
    title: 'Oppenheimer',
    type: 'movie',
    overview: 'The story of J. Robert Oppenheimer\'s role in the development of the atomic bomb during World War II.',
    poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    rating: 8.1,
    year: 2023,
    genre: 'Drama',
    duration: '3h 0m',
    trending: true
  },
  {
    id: '157336',
    imdbId: 'tt0816692',
    title: 'Interstellar',
    type: 'movie',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
    poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/rAiYTsqJJR9asvkNxGmQ0Y0r9F5.jpg',
    rating: 8.4,
    year: 2014,
    genre: 'Sci-Fi',
    duration: '2h 49m'
  },
  {
    id: '37854',
    imdbId: 'tt0388629',
    title: 'One Piece',
    type: 'tv',
    overview: 'Years ago, the fearsome Pirate King, Gol D. Roger was executed leaving behind a huge cache of riches and the famed One Piece. Monkey D. Luffy sets sail to become the new King of the Pirates!',
    poster: 'https://image.tmdb.org/t/p/w500/cMD9Ygz11yjrtv3fo9Jr4UkKfJ.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
    rating: 8.7,
    year: 1999,
    genre: 'Anime',
    seasonsCount: 23,
    episodesPerSeason: 61,
    totalEpisodes: 1180,
    trending: true
  },
  {
    id: '94605',
    imdbId: 'tt11126994',
    title: 'Arcane',
    type: 'tv',
    overview: 'Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and incompatible convictions.',
    poster: 'https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn397rHumw9mg.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
    rating: 8.7,
    year: 2021,
    genre: 'Anime',
    seasonsCount: 2,
    episodesPerSeason: 9,
    trending: true
  },
  {
    id: '85937',
    imdbId: 'tt9335498',
    title: 'Demon Slayer: Kimetsu no Yaiba',
    type: 'tv',
    overview: 'Tanjiro Kamado, joined with Inosuke Hashibira and Zenitsu Agatsuma, embarks on a mission with the Flame Hashira Kyojuro Rengoku aboard the Mugen Train.',
    poster: 'https://image.tmdb.org/t/p/w500/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/7MRgJ0b1fX6yH8m9W8yF8k7O1.jpg',
    rating: 8.7,
    year: 2019,
    genre: 'Anime',
    seasonsCount: 4,
    episodesPerSeason: 11,
    trending: true
  },
  {
    id: '1429',
    imdbId: 'tt2560140',
    title: 'Attack on Titan',
    type: 'tv',
    overview: 'Several hundred years ago, humans were nearly exterminated by titans. A small percentage of humanity survived by walling themselves in a city protected by extremely high walls.',
    poster: 'https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/m99F0P8wGdn4v7UuhPvhfUf40j.jpg',
    rating: 8.7,
    year: 2013,
    genre: 'Anime',
    seasonsCount: 4,
    episodesPerSeason: 25,
    trending: true
  },
  {
    id: '106379',
    imdbId: 'tt12637874',
    title: 'Fallout',
    type: 'tv',
    overview: 'The story of haves and have-nots in a world in which there’s almost nothing left to have. 200 years after the apocalypse, citizens of luxury fallout shelters return to the irradiated hellscape.',
    poster: 'https://image.tmdb.org/t/p/w500/AnsZu4cbtU8zS1Q1b9t9t8F8H9.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/yl2GfeBu0SSvtUPIIYao3Dxq0cp.jpg',
    rating: 8.3,
    year: 2024,
    genre: 'Sci-Fi',
    seasonsCount: 1,
    episodesPerSeason: 8,
    trending: true
  },
  {
    id: '66732',
    imdbId: 'tt4574334',
    title: 'Stranger Things',
    type: 'tv',
    overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    rating: 8.6,
    year: 2016,
    genre: 'Sci-Fi',
    seasonsCount: 4,
    episodesPerSeason: 9
  },
  {
    id: '1399',
    imdbId: 'tt0944947',
    title: 'Game of Thrones',
    type: 'tv',
    overview: 'Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war.',
    poster: 'https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg',
    rating: 8.4,
    year: 2011,
    genre: 'Fantasy',
    seasonsCount: 8,
    episodesPerSeason: 10
  },
  {
    id: '372058',
    imdbId: 'tt5311514',
    title: 'Your Name.',
    type: 'movie',
    overview: 'High schoolers Mitsuha and Taki are complete strangers living separate lives in different parts of Japan. But one night, they suddenly switch places.',
    poster: 'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6qFsPwaMis4C.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/7k2B07M2rMvQx2fE89k5dE5vO4d.jpg',
    rating: 8.5,
    year: 2016,
    genre: 'Anime',
    duration: '1h 47m'
  },
  {
    id: '155',
    imdbId: 'tt0468569',
    title: 'The Dark Knight',
    type: 'movie',
    overview: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.',
    poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/dqK9Hag1054tghRQSqLSfrkvQnA.jpg',
    rating: 8.5,
    year: 2008,
    genre: 'Action',
    duration: '2h 32m'
  },
  {
    id: '579974',
    imdbId: 'tt8178634',
    title: 'RRR (Rise Roar Revolt)',
    type: 'movie',
    overview: 'A fearless revolutionary and an officer in the British force, who once shared a deep bond, decide to join forces and chart out an inspiring path of freedom against the despotic rulers.',
    poster: 'https://image.tmdb.org/t/p/w500/nEufeZlyAOLqO2brrs0yeMu1QXO.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/m03jul0YcbEOuvUsGm4Q4gH92L.jpg',
    rating: 8.0,
    year: 2022,
    genre: 'Bollywood / Action',
    duration: '3h 7m',
    trending: true
  },
  {
    id: '20453',
    imdbId: 'tt1187043',
    title: '3 Idiots',
    type: 'movie',
    overview: 'Two friends embark on a quest for a lost buddy. On this journey, they encounter a forgotten bet, a wedding they must crash, and a funeral that goes impossibly out of control.',
    poster: 'https://image.tmdb.org/t/p/w500/66A9MqXOyVFCssoloscw79z8Tew.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/u7kuU08nF9T19k2a2eW4N7UoN8r.jpg',
    rating: 8.4,
    year: 2009,
    genre: 'Bollywood / Comedy',
    duration: '2h 50m'
  },
  {
    id: '872906',
    imdbId: 'tt15354916',
    title: 'Jawan',
    type: 'movie',
    overview: 'An emotional journey of a prison warden driven by a personal vendetta to rectify the wrongs in society, while keeping a promise made years ago.',
    poster: 'https://image.tmdb.org/t/p/w500/j1q9qF2y5s25nUq15s1b1b1b1b1.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/fm050720b22.jpg',
    rating: 7.6,
    year: 2023,
    genre: 'Bollywood / Action',
    duration: '2h 49m',
    trending: true
  }
];

export const BUILT_IN_CATALOG = FALLBACK_CATALOG;
