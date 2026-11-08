export interface GenreOption {
  id: number;
  name: string;
}

export interface SortOption {
  id: 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc' | 'title.asc';
  label: string;
}

export interface CategoryDefinition {
  id: 'movie' | 'tv' | 'anime' | 'kdrama' | 'cdrama' | 'bollywood';
  title: string;
  subtitle: string;
  badge: string;
  genres: GenreOption[];
  sortOptions: SortOption[];
  defaultSort: 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc' | 'title.asc';
}

export const CATEGORY_DEFINITIONS: Record<'movie' | 'tv' | 'anime' | 'kdrama' | 'cdrama' | 'bollywood', CategoryDefinition> = {
  movie: {
    id: 'movie',
    title: 'Explore Movies',
    subtitle: 'Discover blockbuster hits, timeless classics and the latest releases.',
    badge: 'Movies Catalog',
    defaultSort: 'popularity.desc',
    sortOptions: [
      { id: 'popularity.desc', label: '🔥 Popularity' },
      { id: 'vote_average.desc', label: '⭐ Highest Rated' },
      { id: 'primary_release_date.desc', label: '✨ Release Date' },
      { id: 'title.asc', label: '🔤 Title A–Z' }
    ],
    genres: [
      { id: 0, name: 'All' },
      { id: 28, name: 'Action' },
      { id: 12, name: 'Adventure' },
      { id: 16, name: 'Animation' },
      { id: 35, name: 'Comedy' },
      { id: 80, name: 'Crime' },
      { id: 18, name: 'Drama' },
      { id: 27, name: 'Horror' },
      { id: 10749, name: 'Romance' },
      { id: 878, name: 'Sci-Fi' },
      { id: 53, name: 'Thriller' }
    ]
  },
  tv: {
    id: 'tv',
    title: 'Explore TV Shows',
    subtitle: 'Discover popular series, trending dramas and unforgettable stories.',
    badge: 'TV Shows & Series',
    defaultSort: 'popularity.desc',
    sortOptions: [
      { id: 'popularity.desc', label: '🔥 Popularity' },
      { id: 'vote_average.desc', label: '⭐ Highest Rated' },
      { id: 'primary_release_date.desc', label: '✨ Release Date' },
      { id: 'title.asc', label: '🔤 Title A–Z' }
    ],
    genres: [
      { id: 0, name: 'All' },
      { id: 10759, name: 'Action & Adventure' },
      { id: 16, name: 'Animation' },
      { id: 35, name: 'Comedy' },
      { id: 80, name: 'Crime' },
      { id: 18, name: 'Drama' },
      { id: 99, name: 'Documentary' },
      { id: 9648, name: 'Mystery' },
      { id: 10765, name: 'Sci-Fi & Fantasy' }
    ]
  },
  kdrama: {
    id: 'kdrama',
    title: 'Korean Drama Hub (K-Drama)',
    subtitle: 'Stream the most popular Korean series, romantic comedies, revenge thrillers, and Hallyu sensations.',
    badge: '🇰🇷 Korean Drama',
    defaultSort: 'popularity.desc',
    sortOptions: [
      { id: 'popularity.desc', label: '🔥 Popularity' },
      { id: 'vote_average.desc', label: '⭐ Highest Rated' },
      { id: 'primary_release_date.desc', label: '✨ Air Date' },
      { id: 'title.asc', label: '🔤 Title A–Z' }
    ],
    genres: [
      { id: 0, name: 'All' },
      { id: 10749, name: 'Romance & Love' },
      { id: 18, name: 'Drama & Life' },
      { id: 35, name: 'Romantic Comedy' },
      { id: 9648, name: 'Mystery & Thriller' },
      { id: 10765, name: 'Fantasy & Supernatural' },
      { id: 10759, name: 'Action & Crime' }
    ]
  },
  cdrama: {
    id: 'cdrama',
    title: 'Chinese Drama Hub (C-Drama)',
    subtitle: 'Discover sweeping historical epics, Xianxia fantasy, Wuxia martial arts, and modern romantic series.',
    badge: '🇨🇳 Chinese Drama',
    defaultSort: 'popularity.desc',
    sortOptions: [
      { id: 'popularity.desc', label: '🔥 Popularity' },
      { id: 'vote_average.desc', label: '⭐ Highest Rated' },
      { id: 'primary_release_date.desc', label: '✨ Air Date' },
      { id: 'title.asc', label: '🔤 Title A–Z' }
    ],
    genres: [
      { id: 0, name: 'All' },
      { id: 10749, name: 'Romance & Youth' },
      { id: 10765, name: 'Xianxia & Fantasy' },
      { id: 18, name: 'Historical & Costume' },
      { id: 10759, name: 'Wuxia & Martial Arts' },
      { id: 9648, name: 'Suspense & Mystery' },
      { id: 35, name: 'Comedy & Rom-Com' }
    ]
  },
  anime: {
    id: 'anime',
    title: 'Anime Collection',
    subtitle: 'Explore Japanese animation, trending anime and popular series.',
    badge: '🌸 Authentic Anime',
    defaultSort: 'popularity.desc',
    sortOptions: [
      { id: 'popularity.desc', label: '🔥 Popularity' },
      { id: 'vote_average.desc', label: '⭐ Highest Rated' },
      { id: 'primary_release_date.desc', label: '✨ Release Date' },
      { id: 'title.asc', label: '🔤 Title A–Z' }
    ],
    genres: [
      { id: 0, name: 'All' },
      { id: 10759, name: 'Action & Shonen' },
      { id: 12, name: 'Adventure' },
      { id: 35, name: 'Comedy' },
      { id: 14, name: 'Fantasy & Supernatural' },
      { id: 10749, name: 'Romance' },
      { id: 18, name: 'Slice of Life' },
      { id: 10765, name: 'Sci-Fi & Isekai' },
      { id: 9648, name: 'Mystery & Psychological' },
      { id: 99999, name: '🇨🇳 Donghua (Chinese)' }
    ]
  },
  bollywood: {
    id: 'bollywood',
    title: 'Bollywood Collection',
    subtitle: 'Discover Indian cinema, Hindi movies and popular web series.',
    badge: '🇮🇳 Indian Cinema',
    defaultSort: 'popularity.desc',
    sortOptions: [
      { id: 'popularity.desc', label: '🔥 Popularity' },
      { id: 'vote_average.desc', label: '⭐ Highest Rated' },
      { id: 'primary_release_date.desc', label: '✨ Release Date' },
      { id: 'title.asc', label: '🔤 Title A–Z' }
    ],
    genres: [
      { id: 0, name: 'All' },
      { id: 28, name: 'Action' },
      { id: 35, name: 'Comedy' },
      { id: 18, name: 'Drama' },
      { id: 10749, name: 'Romance' },
      { id: 53, name: 'Thriller' }
    ]
  }
};
