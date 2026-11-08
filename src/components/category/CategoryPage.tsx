import React, { useState, useEffect, useMemo } from 'react';
import type { MediaItem } from '../../services/tmdb';
import { fetchCategoryBrowseMedia } from '../../services/tmdb';
import { CATEGORY_DEFINITIONS } from '../../config/categoryConfig';
import { CategoryHeader } from './CategoryHeader';
import { GenreFilter } from './GenreFilter';
import { CategoryToolbar } from './CategoryToolbar';
import { MediaGrid } from './MediaGrid';
import { LoadMoreButton } from './LoadMoreButton';

interface CategoryPageProps {
  category: 'movie' | 'tv' | 'anime' | 'kdrama' | 'cdrama' | 'bollywood';
  initialGenreId?: number;
  initialItems?: MediaItem[];
  onSelectMedia: (media: MediaItem) => void;
  onPlayMedia: (media: MediaItem) => void;
  onBackToHome: () => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  category,
  initialGenreId = 0,
  initialItems = [],
  onSelectMedia,
  onPlayMedia,
  onBackToHome
}) => {
  const def = CATEGORY_DEFINITIONS[category];

  const [selectedGenreId, setSelectedGenreId] = useState<number>(initialGenreId);
  const [selectedSort, setSelectedSort] = useState<'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc' | 'title.asc'>(def.defaultSort);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync genre if prop changes
  useEffect(() => {
    if (initialGenreId !== undefined) {
      setSelectedGenreId(initialGenreId);
    }
  }, [initialGenreId]);

  // Load Page 1 whenever category, genre, sort, or search changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setPage(1);

    const timer = setTimeout(() => {
      fetchCategoryBrowseMedia({
        category,
        genreId: selectedGenreId,
        sortBy: selectedSort,
        page: 1,
        searchQuery
      })
        .then((res) => {
          if (isMounted) {
            setItems(res.items);
            setHasMore(res.items.length >= 10);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            console.warn('Category fetch error:', err);
            setError('Failed to load catalog. Please try again.');
            setIsLoading(false);
          }
        });
    }, searchQuery ? 350 : 0); // Debounce search

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [category, selectedGenreId, selectedSort, searchQuery]);

  // Load More (Pagination)
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setError(null);

    const nextPage = page + 1;
    try {
      const res = await fetchCategoryBrowseMedia({
        category,
        genreId: selectedGenreId,
        sortBy: selectedSort,
        page: nextPage,
        searchQuery
      });

      if (res.items.length === 0) {
        setHasMore(false);
      } else {
        setPage(nextPage);
        setItems((prev) => {
          // Deduplicate by ID
          const existingIds = new Set(prev.map((i) => i.id));
          const newUnique = res.items.filter((i) => !existingIds.has(i.id));
          return [...prev, ...newUnique];
        });
        setHasMore(res.items.length >= 12);
      }
    } catch (err) {
      console.warn('Load more error:', err);
      setError('Could not fetch additional titles.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Featured Media for Header Backdrop
  const featuredMedia = useMemo(() => {
    return items.find((i) => i.backdrop && i.overview) || items[0] || null;
  }, [items]);

  return (
    <div className="w-full px-4 sm:px-8 md:px-14 py-4 animate-fadeIn select-none">
      {/* 1. Category Header Banner */}
      <CategoryHeader
        title={def.title}
        subtitle={def.subtitle}
        badge={def.badge}
        totalCount={items.length}
        featuredMedia={featuredMedia}
        onBackToHome={onBackToHome}
      />

      {/* 2. Horizontal Genre Filter Chips */}
      <GenreFilter
        genres={def.genres}
        selectedGenreId={selectedGenreId}
        onSelectGenre={(gId) => setSelectedGenreId(gId)}
      />

      {/* 3. Search & Sorting Toolbar */}
      <CategoryToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOptions={def.sortOptions}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
        totalDisplayCount={items.length}
      />

      {/* 4. Responsive Poster Grid */}
      <MediaGrid
        items={items}
        onSelectMedia={onSelectMedia}
        onPlayMedia={onPlayMedia}
        isLoading={isLoading}
      />

      {/* 5. Load More Pagination Button */}
      {items.length > 0 && !isLoading && (
        <LoadMoreButton
          isLoading={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          error={error}
        />
      )}
    </div>
  );
};
