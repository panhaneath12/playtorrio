import type { TvChannel, TvCountry, TvCategory } from './types';

export const SEED_COUNTRIES: TvCountry[] = [
  { code: 'ALL', name: 'All Worldwide', flag: '🌍', channelCount: 50 },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭', channelCount: 24, languages: ['khm'] },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', channelCount: 67, languages: ['tha'] },
  { code: 'US', name: 'United States', flag: '🇺🇸', channelCount: 450, languages: ['eng'] },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', channelCount: 180, languages: ['eng'] },
  { code: 'FR', name: 'France', flag: '🇫🇷', channelCount: 120, languages: ['fra'] },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', channelCount: 95, languages: ['jpn'] },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', channelCount: 80, languages: ['kor'] },
  { code: 'IN', name: 'India', flag: '🇮🇳', channelCount: 210, languages: ['hin', 'eng'] },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', channelCount: 110, languages: ['deu'] },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', channelCount: 90, languages: ['eng', 'fra'] },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', channelCount: 75, languages: ['eng'] },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', channelCount: 55, languages: ['vie'] }
];

export const SEED_CATEGORIES: TvCategory[] = [
  { id: 'all', name: 'All Channels', icon: '📺', channelCount: 50 },
  { id: 'news', name: 'News & Info', icon: '📰', channelCount: 15 },
  { id: 'sports', name: 'Live Sports', icon: '🏆', channelCount: 12 },
  { id: 'movies', name: 'Movies & Cinema', icon: '🎬', channelCount: 10 },
  { id: 'entertainment', name: 'Entertainment', icon: '🎭', channelCount: 14 },
  { id: 'music', name: 'Music & Vibes', icon: '🎵', channelCount: 8 },
  { id: 'kids', name: 'Kids & Animation', icon: '🧸', channelCount: 6 },
  { id: 'documentary', name: 'Documentary', icon: '🚀', channelCount: 7 },
  { id: 'education', name: 'Education', icon: '🎓', channelCount: 5 },
  { id: 'general', name: 'General', icon: '📡', channelCount: 20 }
];

export const SEED_CHANNELS: TvChannel[] = [
  // ==================== 🇰🇭 CAMBODIA (KHMER LIVE CHANNELS) ====================
  {
    id: 'tvk.kh',
    name: 'TVK National',
    altNames: ['ទូរទស្សន៍ជាតិកម្ពុជា', 'National Television of Cambodia'],
    network: 'National Television of Cambodia',
    country: 'KH',
    countryName: 'Cambodia',
    countryFlag: '🇰🇭',
    categories: ['general', 'news'],
    languages: ['khm'],
    logo: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=240',
    streams: [
      { url: 'https://live.kh.malimarcdn.com/live/tvk.stream/playlist.m3u8', quality: '720p HD', title: 'Malimar CDN 720p' }
    ],
    isNsfw: false,
    isClosed: false,
    featured: true,
    trendingRank: 1,
    currentProgram: {
      id: 'tvk-p1',
      channelId: 'tvk.kh',
      title: 'ព័ត៌មានជាតិ និងអន្តរជាតិ (National & World News)',
      start: new Date(Date.now() - 30 * 60000).toISOString(),
      end: new Date(Date.now() + 60 * 60000).toISOString(),
      category: 'News'
    },
    nextProgram: {
      id: 'tvk-p2',
      channelId: 'tvk.kh',
      title: 'កម្មវិធីវប្បធម៌ខ្មែរ (Khmer Heritage & Culture)',
      start: new Date(Date.now() + 60 * 60000).toISOString(),
      end: new Date(Date.now() + 120 * 60000).toISOString(),
      category: 'Culture'
    }
  },
  {
    id: 'tvk2.kh',
    name: 'TVK 2 Education',
    altNames: ['ទូរទស្សន៍ជាតិអប់រំ TVK2', 'TVK Education'],
    country: 'KH',
    countryName: 'Cambodia',
    countryFlag: '🇰🇭',
    categories: ['education', 'general'],
    languages: ['khm'],
    logo: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=240',
    streams: [
      { url: 'https://live.kh.malimarcdn.com/live/tvk2.stream/playlist.m3u8', quality: '720p HD', title: 'TVK2 Official Stream' }
    ],
    isNsfw: false,
    isClosed: false,
    featured: false,
    trendingRank: 8,
    currentProgram: {
      id: 'tvk2-p1',
      channelId: 'tvk2.kh',
      title: 'ការបង្រៀនគណិតវិទ្យា និងវិទ្យាសាស្ត្រ (STEM Education)',
      start: new Date(Date.now() - 15 * 60000).toISOString(),
      end: new Date(Date.now() + 45 * 60000).toISOString(),
      category: 'Education'
    }
  },
  {
    id: 'freshnews.kh',
    name: 'Fresh News TV',
    altNames: ['ទូរទស្សន៍ព័ត៌មាន Fresh News'],
    country: 'KH',
    countryName: 'Cambodia',
    countryFlag: '🇰🇭',
    categories: ['news'],
    languages: ['khm'],
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=240',
    streams: [
      { url: 'http://streaming-android.freshnewsasia.tv:1935/live/ngrp:myStream_all/playlist.m3u8', quality: '1080p HD', title: 'Fresh News 1080p' }
    ],
    isNsfw: false,
    isClosed: false,
    featured: true,
    trendingRank: 2,
    currentProgram: {
      id: 'fn-p1',
      channelId: 'freshnews.kh',
      title: 'ព័ត៌មានទាន់ហេតុការណ៍ ២៤/៧ (Breaking News 24/7)',
      start: new Date(Date.now() - 20 * 60000).toISOString(),
      end: new Date(Date.now() + 40 * 60000).toISOString(),
      category: 'News'
    }
  },
  {
    id: 'hangmeas.kh',
    name: 'Hang Meas HDTV',
    altNames: ['ទូរទស្សន៍ ហង្សមាស HD', 'HM HDTV'],
    country: 'KH',
    countryName: 'Cambodia',
    countryFlag: '🇰🇭',
    categories: ['entertainment', 'music', 'general'],
    languages: ['khm'],
    logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=240',
    streams: [
      { url: 'http://167.99.72.244:1935/hm_hdtv/_definst_/smil:HMHDTV.smil/chunklist_w422093947_b800000_sleng.m3u8', quality: '1080p HD', title: 'Hang Meas 1080p' }
    ],
    isNsfw: false,
    isClosed: false,
    featured: true,
    trendingRank: 3,
    currentProgram: {
      id: 'hm-p1',
      channelId: 'hangmeas.kh',
      title: 'តន្ត្រី និងការកម្សាន្ត ហង្សមាស (Hang Meas Prime Music)',
      start: new Date(Date.now() - 30 * 60000).toISOString(),
      end: new Date(Date.now() + 60 * 60000).toISOString(),
      category: 'Music'
    }
  },
  {
    id: 'towntv.kh',
    name: 'Town TV Full HD',
    altNames: ['ទូរទស្សន៍ ថោន Town TV'],
    country: 'KH',
    countryName: 'Cambodia',
    countryFlag: '🇰🇭',
    categories: ['sports', 'entertainment'],
    languages: ['khm'],
    logo: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=240',
    streams: [
      { url: 'https://stream.pdtvhd.com/LiveApp/streams/Townfullhd.m3u8', quality: '1080p HD', title: 'Town Full HD' }
    ],
    isNsfw: false,
    isClosed: false,
    featured: true,
    trendingRank: 4,
    currentProgram: {
      id: 'town-p1',
      channelId: 'towntv.kh',
      title: 'សង្វៀនប្រដាល់គុនខ្មែរ (Kun Khmer Fight Live)',
      start: new Date(Date.now() - 40 * 60000).toISOString(),
      end: new Date(Date.now() + 50 * 60000).toISOString(),
      category: 'Sports'
    }
  },
  {
    id: 'eacnews.kh',
    name: 'EAC News TV',
    altNames: ['ទូរទស្សន៍ EAC News'],
    country: 'KH',
    countryName: 'Cambodia',
    countryFlag: '🇰🇭',
    categories: ['news', 'general'],
    languages: ['khm'],
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=240',
    streams: [
      { url: 'https://live.eac-news.com/LiveApp/streams/eacnews.m3u8', quality: '1080p HD', title: 'EAC News Stream' }
    ],
    isNsfw: false,
    isClosed: false,
    featured: false,
    trendingRank: 7
  },
  {
    id: 'wikitv.kh',
    name: 'Wiki TV Cambodia',
    altNames: ['វីគីធីវី កម្ពុជា'],
    country: 'KH',
    countryName: 'Cambodia',
    countryFlag: '🇰🇭',
    categories: ['entertainment', 'general'],
    languages: ['khm'],
    logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=240',
    streams: [
      { url: 'https://stream.wikitv.asia/live/ngrp:myStream_all/playlist.m3u8', quality: '720p HD', title: 'Wiki TV Live' }
    ],
    isNsfw: false,
    isClosed: false,
    featured: false,
    trendingRank: 9
  },

  // ==================== 🇹🇭 THAILAND LIVE CHANNELS ====================
  {
    id: 'thaipbs.th',
    name: 'Thai PBS HD',
    altNames: ['ไทยพีบีเอส'],
    country: 'TH',
    countryName: 'Thailand',
    countryFlag: '🇹🇭',
    categories: ['news', 'general', 'education'],
    languages: ['tha'],
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=240',
    streams: [
      { url: 'https://thaipbs-live.cdn.byteark.com/live/playlist.m3u8', quality: '1080p HD', title: 'Thai PBS 1080p' }
    ],
    isNsfw: false,
    isClosed: false,
    featured: true,
    trendingRank: 5,
    currentProgram: {
      id: 'tpbs-p1',
      channelId: 'thaipbs.th',
      title: 'ข่าวค่ำ มิติใหม่ทั่วไทย (Evening Prime News)',
      start: new Date(Date.now() - 25 * 60000).toISOString(),
      end: new Date(Date.now() + 65 * 60000).toISOString(),
      category: 'News'
    }
  },
  {
    id: 'workpoint.th',
    name: 'Workpoint TV 23',
    altNames: ['เวิร์คพอยท์'],
    country: 'TH',
    countryName: 'Thailand',
    countryFlag: '🇹🇭',
    categories: ['entertainment', 'general'],
    languages: ['tha'],
    logo: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=240',
    streams: [
      { url: 'https://edge1.thaisat.tv/workpoint/live.m3u8', quality: '720p HD', title: 'Workpoint 23' }
    ],
    isNsfw: false,
    isClosed: false,
    featured: false,
    trendingRank: 10
  },

  // ==================== 🌍 GLOBAL NEWS CHANNELS ====================
  {
    id: 'dwnews.de',
    name: 'DW News English',
    network: 'Deutsche Welle',
    country: 'DE',
    countryName: 'Germany',
    countryFlag: '🇩🇪',
    categories: ['news', 'documentary'],
    languages: ['eng'],
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=240',
    streams: [
      { url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8', quality: '1080p HD', title: 'DW Global 1080p' }
    ],
    isNsfw: false,
    isClosed: false,
    featured: true,
    trendingRank: 6,
    currentProgram: {
      id: 'dw-p1',
      channelId: 'dwnews.de',
      title: 'DW News: World in 60 Minutes',
      start: new Date(Date.now() - 10 * 60000).toISOString(),
      end: new Date(Date.now() + 50 * 60000).toISOString(),
      category: 'News'
    }
  },
  {
    id: 'france24.fr',
    name: 'France 24 Live English',
    network: 'France Médias Monde',
    country: 'FR',
    countryName: 'France',
    countryFlag: '🇫🇷',
    categories: ['news'],
    languages: ['eng'],
    logo: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=240',
    streams: [
      { url: 'https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8', quality: '1080p HD', title: 'France 24 HD' }
    ],
    isNsfw: false,
    isClosed: false,
    featured: false,
    trendingRank: 11
  },
  {
    id: 'aljazeera.qa',
    name: 'Al Jazeera English',
    network: 'Al Jazeera Media Network',
    country: 'QA',
    countryName: 'Qatar / Global',
    countryFlag: '🌍',
    categories: ['news', 'documentary'],
    languages: ['eng'],
    logo: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=240',
    streams: [
      { url: 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8', quality: '1080p HD', title: 'Al Jazeera Direct HLS' }
    ],
    isNsfw: false,
    isClosed: false,
    featured: true,
    trendingRank: 12
  },

  // ==================== 🏆 LIVE SPORTS ====================
  {
    id: 'redbull.at',
    name: 'Red Bull TV Extreme Sports',
    country: 'AT',
    countryName: 'Austria / Global',
    countryFlag: '🌍',
    categories: ['sports', 'entertainment'],
    languages: ['eng'],
    logo: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=240',
    streams: [
      { url: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8', quality: '1080p 60fps', title: 'Red Bull 60fps HD' }
    ],
    isNsfw: false,
    isClosed: false,
    featured: true,
    trendingRank: 13,
    currentProgram: {
      id: 'rb-p1',
      channelId: 'redbull.at',
      title: 'Red Bull Rampage & UCI Mountain Bike World Cup',
      start: new Date(Date.now() - 35 * 60000).toISOString(),
      end: new Date(Date.now() + 85 * 60000).toISOString(),
      category: 'Sports'
    }
  },

  // ==================== 🚀 SCIENCE & SPACE ====================
  {
    id: 'nasa.us',
    name: 'NASA TV Live HD',
    country: 'US',
    countryName: 'United States',
    countryFlag: '🇺🇸',
    categories: ['documentary', 'education'],
    languages: ['eng'],
    logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=240',
    streams: [
      { url: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8', quality: '1080p HD', title: 'NASA Media Feed' }
    ],
    isNsfw: false,
    isClosed: false,
    featured: true,
    trendingRank: 14,
    currentProgram: {
      id: 'nasa-p1',
      channelId: 'nasa.us',
      title: 'ISS Live Views & Space Station Operations',
      start: new Date(Date.now() - 60 * 60000).toISOString(),
      end: new Date(Date.now() + 60 * 60000).toISOString(),
      category: 'Documentary'
    }
  },

  // ==================== 🎵 MUSIC ====================
  {
    id: 'lofigirl.global',
    name: 'Lofi Girl 24/7 Chill Beats',
    country: 'FR',
    countryName: 'Global Beats',
    countryFlag: '🎵',
    categories: ['music', 'entertainment'],
    languages: ['eng'],
    logo: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=240',
    streams: [
      { url: 'https://chilledcat.com/hls/live.m3u8', quality: '1080p Hi-Fi', title: 'Lofi Chilled Cat Stream' }
    ],
    isNsfw: false,
    isClosed: false,
    featured: true,
    trendingRank: 15,
    currentProgram: {
      id: 'lofi-p1',
      channelId: 'lofigirl.global',
      title: 'Beats to Relax / Study to • 24/7 Chillout Zone',
      start: new Date(Date.now() - 120 * 60000).toISOString(),
      end: new Date(Date.now() + 240 * 60000).toISOString(),
      category: 'Music'
    }
  }
];
