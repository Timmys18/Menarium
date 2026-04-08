'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiGet, apiPost } from '@/lib/api';
import { pickArray } from '@/lib/guards';

export const SWIPE_PAGE_LIMIT = 20;

export type SwipeFeedItem = {
  id: string;
  title: string;
  city: string;
  category: string;
  images: string[];
  userId: string;
  status: string;
};

export type SwipeFeedFilters = {
  type?: string;
  category?: string;
  city?: string;
};

type SwipeListPayload = {
  items?: SwipeFeedItem[];
  hasMore?: boolean;
  limit?: number;
  offset?: number;
};

function buildSearchParams(filters: SwipeFeedFilters, offset: number, limit: number) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  if (filters.type) params.set('type', filters.type);
  if (filters.category) params.set('category', filters.category);
  if (filters.city) params.set('city', filters.city);
  return params;
}

/**
 * Лента swipe: пагинация, смещение индекса, догрузка без пересечения с уже загруженными id.
 * Без UI, без drag, без модалок.
 */
export function useSwipeFeed(filters: SwipeFeedFilters) {
  const { data: session, status: sessionStatus } = useSession();
  const stableFilters = useMemo(
    () => ({
      type: filters.type,
      category: filters.category,
      city: filters.city,
    }),
    [filters.type, filters.category, filters.city],
  );
  const [items, setItems] = useState<SwipeFeedItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const loadingMoreGuard = useRef(false);
  const loadGeneration = useRef(0);

  const filterKey = `${stableFilters.type ?? ''}|${stableFilters.category ?? ''}|${stableFilters.city ?? ''}`;

  const fetchPage = useCallback(
    async (offset: number) => {
      if (!session?.user?.id) return null;
      const params = buildSearchParams(stableFilters, offset, SWIPE_PAGE_LIMIT);
      const result = await apiGet<SwipeListPayload & Record<string, unknown>>(
        `/api/items/swipe?${params.toString()}`,
      );
      if (!result.ok) {
        return {
          ok: false as const,
          status: result.status,
          message:
            result.status === 401
              ? 'Необходимо войти в систему.'
              : result.error || 'Не удалось загрузить объявления.',
        };
      }
      const payload = result.data as SwipeListPayload;
      const pageItems = pickArray<SwipeFeedItem>(payload, ['items']);
      return {
        ok: true as const,
        pageItems,
        hasMore: Boolean(payload.hasMore),
      };
    },
    [session?.user?.id, stableFilters],
  );

  const resetAndLoadFirstPage = useCallback(async () => {
    if (!session?.user?.id) return;
    const gen = ++loadGeneration.current;
    setLoading(true);
    setError(null);
    setItems([]);
    setCurrentIndex(0);
    setHasMore(true);

    const res = await fetchPage(0);
    if (gen !== loadGeneration.current) return;
    if (!res) {
      setLoading(false);
      return;
    }
    if (!res.ok) {
      setItems([]);
      setError(res.message);
      setHasMore(false);
      setLoading(false);
      return;
    }
    setItems(res.pageItems);
    setHasMore(res.hasMore);
    setLoading(false);
  }, [session?.user?.id, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!session?.user?.id || !hasMore || loadingMoreGuard.current) return;
    loadingMoreGuard.current = true;
    setLoadingMore(true);
    setError(null);
    const requestOffset = itemsRef.current.length;
    const res = await fetchPage(requestOffset);
    if (!res) {
      setLoadingMore(false);
      loadingMoreGuard.current = false;
      return;
    }
    if (!res.ok) {
      setError(res.message);
      setLoadingMore(false);
      loadingMoreGuard.current = false;
      return;
    }
    setItems((prev) => {
      const ids = new Set(prev.map((i) => i.id));
      const addition = res.pageItems.filter((i) => !ids.has(i.id));
      return [...prev, ...addition];
    });
    setHasMore(res.hasMore);
    setLoadingMore(false);
    loadingMoreGuard.current = false;
  }, [session?.user?.id, hasMore, fetchPage]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      setLoading(false);
      setItems([]);
      setError('Необходимо войти в систему.');
      setHasMore(false);
      return;
    }
    if (session?.user?.id) {
      void resetAndLoadFirstPage();
    } else {
      setLoading(false);
    }
  }, [session?.user?.id, sessionStatus, filterKey, resetAndLoadFirstPage]);

  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;
    if (items.length === 0) return;
    if (currentIndex + 2 >= items.length) {
      void loadMore();
    }
  }, [currentIndex, items.length, hasMore, loading, loadingMore, loadMore]);

  const skip = useCallback(() => {
    setCurrentIndex((i) => i + 1);
  }, []);

  const indexRef = useRef(currentIndex);
  indexRef.current = currentIndex;

  /** Создание предложения обмена по текущей карте; без UI. */
  const wantExchange = useCallback(
    async (senderItemId: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      const idx = indexRef.current;
      const cur = itemsRef.current[idx];
      if (!cur) return { ok: false, error: 'Нет текущего объявления.' };
      if (!senderItemId) return { ok: false, error: 'Не выбрано ваше объявление.' };

      const result = await apiPost<{ receiverItemId: string; senderItemId: string }, unknown>(
        '/api/exchange',
        {
          receiverItemId: cur.id,
          senderItemId,
        },
      );

      if (!result.ok) {
        if (result.status === 401) {
          return { ok: false, error: 'Необходимо войти в систему.' };
        }
        if (result.status === 409) {
          return {
            ok: false,
            error: result.error || 'Нельзя создать обмен: объявление недоступно.',
          };
        }
        return { ok: false, error: result.error || 'Не удалось создать обмен.' };
      }

      setCurrentIndex((i) => i + 1);
      return { ok: true };
    },
    [],
  );

  return {
    items,
    currentIndex,
    hasMore,
    loading,
    loadingMore,
    error,
    skip,
    loadMore,
    wantExchange,
    refresh: resetAndLoadFirstPage,
  };
}
