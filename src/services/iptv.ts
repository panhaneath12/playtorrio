export interface IPTVChannel {
  id: string;
  name: string;
  khmerName?: string;
  category: 'Khmer TV' | 'News' | 'Sports' | 'Documentary' | 'Movies & Anime' | 'Music';
  logo: string;
  streamUrl: string;
  embedUrl?: string; // YouTube or direct Web Player embed fallback (100% CORS-safe)
  country: string;
  quality?: string;
  isKhmer?: boolean;
}

export const PLAYTORRIO_IPTV_CHANNELS: IPTVChannel[] = [
  // ==================== 🇰🇭 KHMER TV CHANNELS (CAMBODIA) ====================
  {
    id: 'tvk',
    name: 'TVK National',
    khmerName: 'ទូរទស្សន៍ជាតិកម្ពុជា',
    category: 'Khmer TV',
    logo: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200',
    streamUrl: 'https://live.kh.malimarcdn.com/live/tvk.stream/playlist.m3u8',
    country: 'Cambodia',
    quality: '720p HD',
    isKhmer: true
  },
  {
    id: 'tvk2',
    name: 'TVK 2 Education',
    khmerName: 'ទូរទស្សន៍ជាតិអប់រំ TVK2',
    category: 'Khmer TV',
    logo: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=200',
    streamUrl: 'https://live.kh.malimarcdn.com/live/tvk2.stream/playlist.m3u8',
    country: 'Cambodia',
    quality: '720p HD',
    isKhmer: true
  },
  {
    id: 'freshnews',
    name: 'Fresh News TV',
    khmerName: 'ទូរទស្សន៍ព័ត៌មាន Fresh News',
    category: 'Khmer TV',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200',
    streamUrl: 'http://streaming-android.freshnewsasia.tv:1935/live/ngrp:myStream_all/playlist.m3u8',
    embedUrl: 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCeT3_c6iYqXpQnF784s9Z7w&autoplay=1',
    country: 'Cambodia',
    quality: '1080p HD',
    isKhmer: true
  },
  {
    id: 'hangmeas',
    name: 'Hang Meas HDTV',
    khmerName: 'ទូរទស្សន៍ ហង្សមាស HD',
    category: 'Khmer TV',
    logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200',
    streamUrl: 'http://167.99.72.244:1935/hm_hdtv/_definst_/smil:HMHDTV.smil/chunklist_w422093947_b800000_sleng.m3u8',
    embedUrl: 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCm1syRy-B1uAkeecQS_2I3w&autoplay=1',
    country: 'Cambodia',
    quality: '1080p Full HD',
    isKhmer: true
  },
  {
    id: 'wikitv',
    name: 'Wiki TV Cambodia',
    khmerName: 'វីគីធីវី កម្ពុជា',
    category: 'Khmer TV',
    logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200',
    streamUrl: 'https://stream.wikitv.asia/live/ngrp:myStream_all/playlist.m3u8',
    country: 'Cambodia',
    quality: '720p HD',
    isKhmer: true
  },
  {
    id: 'towntv',
    name: 'Town TV Full HD',
    khmerName: 'ទូរទស្សន៍ ថោន Town TV',
    category: 'Khmer TV',
    logo: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200',
    streamUrl: 'https://stream.pdtvhd.com/LiveApp/streams/Townfullhd.m3u8',
    country: 'Cambodia',
    quality: '1080p HD',
    isKhmer: true
  },
  {
    id: 'eacnews',
    name: 'EAC News TV',
    khmerName: 'ទូរទស្សន៍ EAC News',
    category: 'Khmer TV',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200',
    streamUrl: 'https://live.eac-news.com/LiveApp/streams/eacnews.m3u8',
    country: 'Cambodia',
    quality: '1080p HD',
    isKhmer: true
  },
  {
    id: 'rasmeyhm',
    name: 'Rasmey Hang Meas TV',
    khmerName: 'រស្មីហង្សមាស RHM HDTV',
    category: 'Khmer TV',
    logo: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=200',
    streamUrl: 'http://111.92.240.134:1934/rhm_hdtv/smil:RHMHDTV.smil/chunklist.m3u8',
    embedUrl: 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCm1syRy-B1uAkeecQS_2I3w&autoplay=1',
    country: 'Cambodia',
    quality: '1080p HD',
    isKhmer: true
  },

  // ==================== 🌍 VERIFIED GLOBAL NEWS ====================
  {
    id: 'dw_news',
    name: 'DW News English',
    category: 'News',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200',
    streamUrl: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
    country: 'Germany / Global',
    quality: '1080p HD'
  },
  {
    id: 'skynews',
    name: 'Sky News Live HD',
    category: 'News',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=200',
    streamUrl: 'https://skynewsau-live.akamaized.net/hls/live/2002689/skynewsau-extra1/master.m3u8',
    country: 'UK / Global',
    quality: '1080p HD'
  },
  {
    id: 'france24',
    name: 'France 24 Live HD',
    category: 'News',
    logo: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=200',
    streamUrl: 'https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8',
    embedUrl: 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCQfwfsi5VrQ8yKZ-UWmAEFg&autoplay=1',
    country: 'France / Global',
    quality: '1080p HD'
  },
  {
    id: 'euronews',
    name: 'Euronews English',
    category: 'News',
    logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200',
    streamUrl: 'https://euronews-euronews-world-1-au.samsung.wurl.tv/playlist.m3u8',
    embedUrl: 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCSrZ3UV4jH3vtfBCNuBQZTw&autoplay=1',
    country: 'Europe / Global',
    quality: '1080p HD'
  },
  {
    id: 'aljazeera',
    name: 'Al Jazeera English Live',
    category: 'News',
    logo: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=200',
    streamUrl: 'https://live-hls-web-aje.getaj.net/AJE/01.m3u8',
    embedUrl: 'https://www.youtube-nocookie.com/embed/live_stream?channel=UCNye-wNBqNL5ZzHSJj3l8Bg&autoplay=1',
    country: 'Global',
    quality: '1080p HD'
  },

  // ==================== 🏆 SPORTS ====================
  {
    id: 'redbull',
    name: 'Red Bull TV Extreme Sports',
    category: 'Sports',
    logo: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=200',
    streamUrl: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
    country: 'Global',
    quality: '1080p 60fps'
  },

  // ==================== 🚀 SCIENCE & DOCUMENTARY ====================
  {
    id: 'nasa',
    name: 'NASA TV Live HD',
    category: 'Documentary',
    logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=200',
    streamUrl: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
    country: 'USA / Space',
    quality: '1080p HD'
  },

  // ==================== 🎵 MUSIC & RELAXATION ====================
  {
    id: 'lofi_girl',
    name: 'Lofi Girl 24/7 Chill Beats',
    category: 'Music',
    logo: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200',
    streamUrl: 'https://chilledcat.com/hls/live.m3u8',
    embedUrl: 'https://www.youtube-nocookie.com/embed/jfKfPfyJRdk?autoplay=1',
    country: 'Global',
    quality: '1080p Hi-Fi'
  }
];
