export interface StreamingServer {
  id: string;
  name: string;
  badge: string;
  quality: string;
  description: string;
  isPrimary?: boolean;
  isTorrent?: boolean;
  isNativePlayer?: boolean;
  isBollywood?: boolean;
  isAnime?: boolean;
  isAsian?: boolean;
  getMovieUrl: (tmdbId: string, imdbId?: string) => string;
  getSeriesUrl: (tmdbId: string, season: number, episode: number, imdbId?: string) => string;
}

export const STREAMING_SERVERS: StreamingServer[] = [
  {
    id: 'vidlink',
    name: 'Server 1 (VidLink 4K Fast)',
    badge: '4K • Ad-Free',
    quality: '4K / 1080p',
    description: 'High-speed bufferless direct player with adaptive bitrate, multi-language subs and zero ads',
    isPrimary: true,
    isAsian: true,
    getMovieUrl: (id: string) => `https://vidlink.pro/movie/${id}?primaryColor=E50914&autoplay=true`,
    getSeriesUrl: (id: string, s: number, e: number) => `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=E50914&autoplay=true`,
  },
  {
    id: 'nontongo',
    name: 'Server 2 (NonTonGo Asian VIP)',
    badge: '🇰🇷🇨🇳 Asian VIP',
    quality: '1080p Multi-Sub',
    description: 'Specialized Asian drama streaming engine with Korean, Chinese, Thai, Vietnamese, and English subtitles',
    isAsian: true,
    getMovieUrl: (id: string) => `https://www.nontongo.win/embed/movie/${id}`,
    getSeriesUrl: (id: string, s: number, e: number) => `https://www.nontongo.win/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidfast',
    name: 'Server 3 (VidFast Asian Fast)',
    badge: 'Fast Asian CDN',
    quality: '1080p Ultra',
    description: 'Ultra-fast direct bufferless player with complete K-Drama and C-Drama library',
    isAsian: true,
    getMovieUrl: (id: string) => `https://vidfast.pro/movie/${id}`,
    getSeriesUrl: (id: string, s: number, e: number) => `https://vidfast.pro/tv/${id}/${s}/${e}`,
  },
  {
    id: 'vidsrc_me',
    name: 'Server 4 (VidSrc Classic API)',
    badge: 'Asian Archives',
    quality: '1080p',
    description: 'Official multi-source TMDB resolver with complete Korean, Chinese, and Asian drama episodes',
    isAsian: true,
    getMovieUrl: (id: string) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
    getSeriesUrl: (id: string, s: number, e: number) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    id: 'vidsrc_to',
    name: 'Server 5 (VidSrc Ultra)',
    badge: '1080p Ultra',
    quality: '1080p',
    description: 'High-speed global cloud CDN with auto-captions and multi-source failover',
    isAsian: true,
    getMovieUrl: (id: string, imdbId?: string) => `https://vidsrc.to/embed/movie/${imdbId || id}`,
    getSeriesUrl: (id: string, s: number, e: number, imdbId?: string) => `https://vidsrc.to/embed/tv/${imdbId || id}/${s}/${e}`,
  },
  {
    id: 'vidsrc_pm',
    name: 'Server 6 (VidSrc Prime)',
    badge: 'Fast Mirror',
    quality: '1080p HD',
    description: 'Direct high-availability mirror with English and international multi-audio',
    isAsian: true,
    getMovieUrl: (id: string) => `https://vidsrc.pm/embed/movie/${id}`,
    getSeriesUrl: (id: string, s: number, e: number) => `https://vidsrc.pm/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'autoembed_me',
    name: 'Server 7 (AutoEmbed Global)',
    badge: 'Auto Captions',
    quality: '1080p',
    description: 'Smart multi-language audio selector and synchronized Asian language subtitles',
    isAsian: true,
    getMovieUrl: (id: string) => `https://autoembed.me/movie/tmdb/${id}`,
    getSeriesUrl: (id: string, s: number, e: number) => `https://autoembed.me/tv/tmdb/${id}-${s}-${e}`,
  },
  {
    id: 'twoembed_skin',
    name: 'Server 8 (2Embed Pro)',
    badge: 'Global CDN',
    quality: '1080p',
    description: 'Resilient multi-mirror streaming gateway with low latency',
    isAsian: true,
    getMovieUrl: (id: string) => `https://2embed.skin/embed/movie/${id}`,
    getSeriesUrl: (id: string, s: number, e: number) => `https://2embed.skin/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: 'embed123',
    name: 'Server 9 (123Embed Cloud)',
    badge: 'Fast Cloud',
    quality: '1080p',
    description: 'Optimized HTML5 video player with adaptive buffer management',
    getMovieUrl: (id: string) => `https://play2.123embed.net/movie/${id}`,
    getSeriesUrl: (id: string, s: number, e: number) => `https://play2.123embed.net/tv/${id}/${s}/${e}`,
  },
  {
    id: 'multiembed',
    name: 'Server 10 (MultiEmbed & Bollywood)',
    badge: 'Multi-Audio',
    quality: '720p/1080p',
    description: 'Specialized for Bollywood, South Indian Cinema, Asian dramas, and international dubs',
    isBollywood: true,
    isAsian: true,
    getMovieUrl: (id: string) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    getSeriesUrl: (id: string, s: number, e: number) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    id: 'vidsrc_sh',
    name: 'Server 11 (VidSrc SH Dual-Audio)',
    badge: 'Dual Audio',
    quality: '1080p',
    description: 'Dual-engine TMDB resolver with Japanese Anime & English Sub/Dub tracks',
    isAnime: true,
    getMovieUrl: (id: string, imdbId?: string) => {
      if (imdbId) return `https://vidsrc.sh/embed/movie?imdb=${imdbId}`;
      return `https://vidsrc.sh/embed/movie?tmdb=${id}`;
    },
    getSeriesUrl: (id: string, s: number, e: number, imdbId?: string) => {
      if (imdbId) return `https://vidsrc.sh/embed/tv?imdb=${imdbId}&sea=${s}&epi=${e}`;
      return `https://vidsrc.sh/embed/tv?tmdb=${id}&sea=${s}&epi=${e}`;
    },
  },
  {
    id: 'webtorrent',
    name: 'Server 12 (WebTorrent P2P)',
    badge: 'WebRTC P2P',
    quality: 'HD Stream',
    description: 'Native in-browser WebTorrent streaming engine (No iFrame blocking)',
    isTorrent: true,
    isNativePlayer: true,
    getMovieUrl: () => 'native-webtorrent',
    getSeriesUrl: () => 'native-webtorrent',
  }
];

export const DEFAULT_SERVER = STREAMING_SERVERS[0];
