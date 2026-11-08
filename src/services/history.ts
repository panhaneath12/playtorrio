import type { MediaItem } from './tmdb';

export interface PlaybackRecord {
  id: string; // TMDB ID
  title: string;
  type: 'movie' | 'tv';
  poster: string;
  backdrop: string;
  year: number;
  genre: string;
  rating: number;
  season?: number;
  episode?: number;
  currentTime: number; // in seconds
  duration: number; // in seconds
  progress: number; // percentage 1 - 100
  lastWatched: number; // timestamp
  overview: string;
  imdbId?: string;
}

const STORAGE_KEY = 'playtorrio_playback_history_v3';
const MAX_HISTORY_ITEMS = 20;

export function getPlaybackHistory(): PlaybackRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: PlaybackRecord[] = JSON.parse(raw);
    return Array.isArray(list) ? list.sort((a, b) => b.lastWatched - a.lastWatched) : [];
  } catch (err) {
    console.warn('Failed to load playback history:', err);
    return [];
  }
}

export function savePlaybackProgress(
  media: MediaItem,
  season: number = 1,
  episode: number = 1,
  elapsedSeconds: number = 120, // default minimum 2 mins watched
  durationSeconds: number = media.type === 'movie' ? 7200 : 2700 // default 2hr movie, 45m tv
): PlaybackRecord {
  const history = getPlaybackHistory();
  const existingIdx = history.findIndex(h => h.id === media.id);

  // If already exists, accumulate or update elapsed time
  let currentTime = elapsedSeconds;
  let duration = durationSeconds;

  if (existingIdx >= 0) {
    const existing = history[existingIdx];
    if (media.type === 'tv' && (existing.season !== season || existing.episode !== episode)) {
      currentTime = elapsedSeconds; // new episode started
    } else {
      currentTime = Math.min(existing.currentTime + elapsedSeconds, duration);
    }
  }

  const progress = Math.min(100, Math.max(5, Math.round((currentTime / duration) * 100)));

  const record: PlaybackRecord = {
    id: media.id,
    title: media.title,
    type: media.type,
    poster: media.poster,
    backdrop: media.backdrop,
    year: media.year,
    genre: media.genre,
    rating: media.rating,
    season: media.type === 'tv' ? season : undefined,
    episode: media.type === 'tv' ? episode : undefined,
    currentTime,
    duration,
    progress,
    lastWatched: Date.now(),
    overview: media.overview,
    imdbId: media.imdbId
  };

  // Prepend new record, filter out duplicate
  const updated = [record, ...history.filter(h => h.id !== media.id)].slice(0, MAX_HISTORY_ITEMS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('playtorrio_history_updated'));
  } catch (err) {
    console.warn('Failed to save playback progress:', err);
  }

  return record;
}

export function removeFromPlaybackHistory(id: string): PlaybackRecord[] {
  const history = getPlaybackHistory().filter(h => h.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event('playtorrio_history_updated'));
  } catch (err) {
    console.warn('Failed to remove playback record:', err);
  }
  return history;
}

export function toMediaItem(record: PlaybackRecord): MediaItem {
  return {
    id: record.id,
    imdbId: record.imdbId,
    title: record.title,
    type: record.type,
    overview: record.overview,
    poster: record.poster,
    backdrop: record.backdrop,
    rating: record.rating,
    year: record.year,
    genre: record.genre
  };
}
