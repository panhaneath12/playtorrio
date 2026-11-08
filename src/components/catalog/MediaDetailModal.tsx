import React, { useEffect, useState } from 'react';
import type { MediaItem, SeasonInfo, TVDetails } from '../../services/tmdb';
import { 
  fetchTVShowDetails,
  getAbsoluteEpisodeNumber,
  getSeasonAndEpisodeFromAbsolute
} from '../../services/tmdb';
import { STREAMING_SERVERS } from '../../config/servers';
import { PlayIcon, StarIcon, CloseIcon, ServerIcon, FilmIcon, TvIcon } from '../common/Icons';

interface MediaDetailModalProps {
  media: MediaItem;
  onPlay: (media: MediaItem, season?: number, episode?: number) => void;
  onClose: () => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  media,
  onPlay,
  onClose
}) => {
  const [tvDetails, setTvDetails] = useState<TVDetails | null>(() => {
    if (media.seasons && media.seasons.length > 0) {
      return {
        seasonsCount: media.seasonsCount || media.seasons.length,
        totalEpisodes: media.totalEpisodes || 0,
        seasons: media.seasons,
        imdbId: media.imdbId
      };
    }
    return null;
  });
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedChunk, setSelectedChunk] = useState<number>(0);
  const [detailViewMode, setDetailViewMode] = useState<'seasons' | 'absolute'>('seasons');
  const [absChunkIndex, setAbsChunkIndex] = useState<number>(0);

  useEffect(() => {
    // Auto-focus primary "Watch Now" button for instant remote control interaction
    const playBtn = document.getElementById('details-play-btn');
    if (playBtn) {
      setTimeout(() => playBtn.focus(), 50);
    }
  }, [media]);

  useEffect(() => {
    if (media.type === 'tv') {
      fetchTVShowDetails(media.id).then(details => {
        if (details) {
          setTvDetails(details);
        }
      }).catch(err => console.warn('Failed to fetch TV details in modal:', err));
    }
  }, [media.id, media.type]);

  const isAnime = Boolean(
    media.genre?.toLowerCase().includes('anime') ||
    media.genre?.toLowerCase().includes('animation')
  );

  const seasonsList: SeasonInfo[] = tvDetails?.seasons && tvDetails.seasons.length > 0
    ? tvDetails.seasons
    : media.seasons && media.seasons.length > 0
      ? media.seasons
      : Array.from({ length: media.seasonsCount || 1 }, (_, i) => ({
          seasonNumber: i + 1,
          name: `Season ${i + 1}`,
          episodeCount: media.episodesPerSeason || 10
        }));

  const activeSeasonInfo = seasonsList.find(s => s.seasonNumber === selectedSeason) || seasonsList[0];
  const episodesInActiveSeason = activeSeasonInfo?.episodeCount || media.episodesPerSeason || 10;
  const totalAllEpisodes = seasonsList.reduce((acc, s) => s.seasonNumber > 0 ? acc + s.episodeCount : acc, 0) || tvDetails?.totalEpisodes || media.totalEpisodes || episodesInActiveSeason;
  
  // Seasons mode chunks (25 eps)
  const chunkSize = 25;
  const totalChunks = Math.ceil(episodesInActiveSeason / chunkSize);
  const safeChunkIndex = Math.min(selectedChunk, Math.max(0, totalChunks - 1));
  const chunkStartEp = safeChunkIndex * chunkSize + 1;
  const chunkEndEp = Math.min(episodesInActiveSeason, (safeChunkIndex + 1) * chunkSize);

  // Absolute mode chunks (50 eps)
  const absChunkSize = 50;
  const totalAbsChunks = Math.ceil(totalAllEpisodes / absChunkSize);
  const safeAbsChunkIndex = Math.min(absChunkIndex, Math.max(0, totalAbsChunks - 1));
  const absChunkStart = safeAbsChunkIndex * absChunkSize + 1;
  const absChunkEnd = Math.min(totalAllEpisodes, (safeAbsChunkIndex + 1) * absChunkSize);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-12 animate-fadeIn"
      data-tv-scope="details"
    >
      <div className="relative w-full max-w-5xl bg-brand-surface border border-brand-border rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          data-tv-nav="true"
          data-tv-scope="details"
          onClick={onClose}
          className="tv-focus-target absolute top-4 sm:top-6 right-4 sm:right-6 z-20 w-11 h-11 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition"
          title="Close (Back)"
        >
          <CloseIcon size={18} />
        </button>

        {/* Left: Poster & Backdrop Art */}
        <div className="relative md:w-5/12 h-56 sm:h-72 md:h-auto overflow-hidden shrink-0 bg-brand-card">
          <img
            src={media.poster || media.backdrop}
            alt={media.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-brand-surface via-transparent to-transparent opacity-95" />
        </div>

        {/* Right: Metadata & Streaming Actions */}
        <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              {media.isNewRelease && (
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider shadow">
                  ✨ NEW RELEASE
                </span>
              )}

              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/60 text-amber-400 font-bold text-xs border border-white/10 shadow">
                <StarIcon size={13} className="fill-amber-400 text-amber-400" />
                <span>{media.rating > 0 ? media.rating : '7.5'} / 10</span>
              </span>

              <span className="flex items-center space-x-1 px-3 py-1 rounded-full bg-white/10 text-gray-200 text-xs font-semibold">
                {media.type === 'movie' ? <FilmIcon size={13} /> : <TvIcon size={13} />}
                <span className="capitalize">{media.type === 'movie' ? 'Movie' : 'TV Series'}</span>
              </span>

              <span className="text-gray-300 text-xs font-bold px-2 py-0.5 rounded bg-white/5">
                {media.year || '2024'}
              </span>

              {media.duration && (
                <span className="text-brand-muted text-xs font-semibold">{media.duration}</span>
              )}

              {media.imdbId && (
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20">
                  IMDb: {media.imdbId}
                </span>
              )}

              {media.type === 'tv' && (
                <span className="px-3 py-0.5 rounded-full bg-brand-accent/20 text-brand-accent text-xs font-bold border border-brand-accent/30 flex items-center space-x-1">
                  <span>📺 {tvDetails?.seasonsCount || media.seasonsCount || 1} Seasons</span>
                  {tvDetails?.totalEpisodes ? (
                    <span>• {tvDetails?.totalEpisodes ? tvDetails.totalEpisodes.toLocaleString() : media.totalEpisodes?.toLocaleString()} Episodes</span>
                  ) : media.totalEpisodes ? (
                    <span>• {tvDetails?.totalEpisodes ? tvDetails.totalEpisodes.toLocaleString() : media.totalEpisodes?.toLocaleString()} Episodes</span>
                  ) : null}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-2">
              {media.title}
            </h1>

            {/* Genre */}
            <p className="text-brand-accent text-xs sm:text-sm font-bold uppercase tracking-wider mb-4">
              {media.genre}
            </p>

            {/* Synopsis */}
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed line-clamp-4 mb-5">
              {media.overview}
            </p>

            {/* Anime Otaku Community Hub & Guide Toolbar */}
            {isAnime && (
              <div className="mb-6 p-4 rounded-2xl bg-brand-card/90 border border-brand-border/80">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-pink-400 flex items-center space-x-1.5">
                    <span>🎌 Otaku Community Hub & Guides</span>
                  </span>
                  <span className="text-[11px] text-brand-muted font-medium">Megathread Approved</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <a
                    data-tv-nav="true"
                    data-tv-scope="details"
                    href={`https://anilist.co/search/anime?search=${encodeURIComponent(media.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tv-focus-target px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center space-x-1.5 transition"
                    title="AniList - Community scores, voice actors & character tracking"
                  >
                    <span>📊 AniList</span>
                  </a>
                  <a
                    data-tv-nav="true"
                    data-tv-scope="details"
                    href={`https://myanimelist.net/anime.php?q=${encodeURIComponent(media.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tv-focus-target px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center space-x-1.5 transition"
                    title="MyAnimeList - World's largest anime community database & reviews"
                  >
                    <span>⭐ MyAnimeList</span>
                  </a>
                  <a
                    data-tv-nav="true"
                    data-tv-scope="details"
                    href="https://www.animefillerlist.com/shows"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tv-focus-target px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center space-x-1.5 transition"
                    title="AnimeFillerList - Filter Manga Canon vs Fillers"
                  >
                    <span>⚡ Skip Fillers</span>
                  </a>
                  <a
                    data-tv-nav="true"
                    data-tv-scope="details"
                    href="https://anichart.net"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tv-focus-target px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center space-x-1.5 transition"
                    title="AniChart - Seasonal Anime Air Calendar"
                  >
                    <span>📅 AniChart</span>
                  </a>
                </div>
              </div>
            )}

            {/* TV Show Seasons & Episode Browser */}
            {media.type === 'tv' && (
              <div className="mb-6 p-4 rounded-2xl bg-brand-card/90 border border-brand-border/80">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <button
                      data-tv-nav="true"
                      data-tv-scope="details"
                      onClick={() => setDetailViewMode('seasons')}
                      className={`tv-focus-target px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                        detailViewMode === 'seasons'
                          ? 'bg-brand-accent text-white shadow-cinema-glow ring-1 ring-white/30'
                          : 'bg-white/5 text-brand-muted hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <TvIcon size={14} />
                      <span>📁 Sagas / Arcs ({seasonsList.length})</span>
                    </button>
                    <button
                      data-tv-nav="true"
                      data-tv-scope="details"
                      onClick={() => setDetailViewMode('absolute')}
                      className={`tv-focus-target px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                        detailViewMode === 'absolute'
                          ? 'bg-pink-600 text-white shadow-cinema-glow ring-1 ring-white/30'
                          : 'bg-white/5 text-brand-muted hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>🎌 All Episodes (#1–{totalAllEpisodes})</span>
                    </button>
                  </div>
                  <span className="text-[11px] text-brand-muted font-mono font-medium">
                    {detailViewMode === 'seasons' 
                      ? `${activeSeasonInfo?.name || `Season ${selectedSeason}`} • ${episodesInActiveSeason} Episodes`
                      : `Total ${totalAllEpisodes} Episodes Available`}
                  </span>
                </div>

                {detailViewMode === 'seasons' ? (
                  <>
                    {/* Season selector horizontal tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scroll-smooth">
                      {seasonsList.map(s => {
                        const isSel = selectedSeason === s.seasonNumber;
                        return (
                          <button
                            key={`modal-season-${s.seasonNumber}`}
                            data-tv-nav="true"
                            data-tv-scope="details"
                            onClick={() => {
                              setSelectedSeason(s.seasonNumber);
                              setSelectedChunk(0);
                            }}
                            className={`tv-focus-target px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center space-x-1.5 ${
                              isSel
                                ? 'bg-brand-accent text-white shadow-cinema-glow ring-2 ring-white/30'
                                : 'bg-white/5 hover:bg-white/10 text-brand-muted hover:text-white border border-brand-border'
                            }`}
                          >
                            <span>{s.seasonNumber === 0 ? 'Specials' : `S${s.seasonNumber}`}</span>
                            {s.name && s.name !== `Season ${s.seasonNumber}` && (
                              <span className="hidden sm:inline text-[11px] opacity-80 max-w-[130px] truncate">
                                • {s.name}
                              </span>
                            )}
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              isSel ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-400'
                            }`}>
                              {s.episodeCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Episode Chunks (if > 25 eps) */}
                    {totalChunks > 1 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1 mb-2">
                        <span className="text-[11px] uppercase font-bold text-brand-muted shrink-0 mr-1">
                          Range:
                        </span>
                        {Array.from({ length: totalChunks }, (_, cIdx) => {
                          const cStart = cIdx * chunkSize + 1;
                          const cEnd = Math.min(episodesInActiveSeason, (cIdx + 1) * chunkSize);
                          const isChunkActive = cIdx === safeChunkIndex;
                          return (
                            <button
                              key={`modal-chunk-${cIdx}`}
                              data-tv-nav="true"
                              data-tv-scope="details"
                              onClick={() => setSelectedChunk(cIdx)}
                              className={`tv-focus-target px-2.5 py-0.5 rounded-md text-[11px] font-bold transition shrink-0 ${
                                isChunkActive
                                  ? 'bg-white/25 text-white ring-1 ring-white/50 shadow'
                                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {cStart}–{cEnd}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Episode Cards Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                      {Array.from(
                        { length: chunkEndEp - chunkStartEp + 1 },
                        (_, idx) => chunkStartEp + idx
                      ).map(epNum => {
                        const absNum = getAbsoluteEpisodeNumber(seasonsList, selectedSeason, epNum);
                        return (
                          <button
                            key={`modal-ep-${epNum}`}
                            data-tv-nav="true"
                            data-tv-scope="details"
                            onClick={() => onPlay(media, selectedSeason, epNum)}
                            className="tv-focus-target p-2 rounded-xl bg-white/5 hover:bg-brand-accent text-white border border-brand-border hover:border-brand-accent transition flex flex-col items-center justify-center group"
                            title={`Watch Season ${selectedSeason} Episode ${epNum} (Overall #${absNum})`}
                          >
                            <span className="text-xs font-black group-hover:scale-105 transition">Ep {epNum}</span>
                            {totalAllEpisodes > 60 && (
                              <span className="text-[9px] font-mono text-gray-400 group-hover:text-white/90">#{absNum}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  /* ABSOLUTE ALL-EPISODES VIEW (Anime Website Style: 1 to 1180) */
                  <>
                    {/* 50-Episode Chunk Picker */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 mb-2 scroll-smooth">
                      <span className="text-[11px] uppercase font-bold text-pink-400 shrink-0 mr-1">
                        Range:
                      </span>
                      {Array.from({ length: totalAbsChunks }, (_, cIdx) => {
                        const cStart = cIdx * absChunkSize + 1;
                        const cEnd = Math.min(totalAllEpisodes, (cIdx + 1) * absChunkSize);
                        const isChunkActive = cIdx === safeAbsChunkIndex;
                        return (
                          <button
                            key={`modal-abs-chunk-${cIdx}`}
                            data-tv-nav="true"
                            data-tv-scope="details"
                            onClick={() => setAbsChunkIndex(cIdx)}
                            className={`tv-focus-target px-2.5 py-0.5 rounded-md text-[11px] font-bold transition shrink-0 ${
                              isChunkActive
                                ? 'bg-pink-600 text-white ring-1 ring-white/50 shadow'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            #{cStart}–{cEnd}
                          </button>
                        );
                      })}
                    </div>

                    {/* Absolute Episode Cards Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                      {Array.from(
                        { length: absChunkEnd - absChunkStart + 1 },
                        (_, idx) => absChunkStart + idx
                      ).map(targetAbsNum => (
                        <button
                          key={`modal-abs-ep-${targetAbsNum}`}
                          data-tv-nav="true"
                          data-tv-scope="details"
                          onClick={() => {
                            const resolved = getSeasonAndEpisodeFromAbsolute(seasonsList, targetAbsNum);
                            onPlay(media, resolved.season, resolved.episode);
                          }}
                          className="tv-focus-target p-2 rounded-xl bg-white/5 hover:bg-pink-600 text-white border border-brand-border hover:border-pink-500 transition flex flex-col items-center justify-center group"
                          title={`Watch Episode #${targetAbsNum}`}
                        >
                          <span className="text-xs font-black group-hover:scale-105 transition">#{targetAbsNum}</span>
                          <span className="text-[9px] text-brand-muted group-hover:text-white/80">Play</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-brand-border">
            <button
              id="details-play-btn"
              data-tv-nav="true"
              data-tv-scope="details"
              onClick={() => onPlay(media, media.type === 'tv' ? selectedSeason : 1, 1)}
              className="tv-focus-target px-8 py-3.5 sm:py-4 rounded-2xl bg-brand-accent hover:bg-brand-accent-hover text-white font-black text-base sm:text-lg tracking-wide flex items-center space-x-3 shadow-cinema-glow transition"
            >
              <PlayIcon size={20} className="fill-white" />
              <span>{media.type === 'tv' ? `Watch S${selectedSeason} E1` : 'Watch Now'}</span>
            </button>

            <button
              data-tv-nav="true"
              data-tv-scope="details"
              onClick={() => onPlay(media)}
              className="tv-focus-target px-6 py-3.5 sm:py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm sm:text-base flex items-center space-x-2 border border-white/10 transition"
            >
              <ServerIcon size={17} className="text-emerald-400" />
              <span>{STREAMING_SERVERS.length} Servers Ready</span>
            </button>

            <button
              data-tv-nav="true"
              data-tv-scope="details"
              onClick={onClose}
              className="tv-focus-target px-6 py-3.5 sm:py-4 rounded-2xl bg-transparent hover:bg-white/5 text-brand-muted font-bold text-sm sm:text-base border border-white/10 transition"
            >
              <span>Back</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
