'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button, GlassCard, LinkButton } from '@/components/menarium';
import { apiGet } from '@/lib/api';
import { useSwipeFeed } from '@/hooks/useSwipeFeed';
import { SwipeStack } from '@/components/swipe/SwipeStack';

const SWIPE_CATEGORIES = [
  { value: 'ELECTRONICS', label: 'Электроника' },
  { value: 'CLOTHING', label: 'Одежда' },
  { value: 'FURNITURE', label: 'Мебель' },
  { value: 'TOOLS', label: 'Инструменты' },
  { value: 'KIDS', label: 'Детские товары' },
  { value: 'BOOKS', label: 'Книги' },
  { value: 'SPORTS', label: 'Спорт' },
  { value: 'AUTO', label: 'Авто' },
  { value: 'PETS', label: 'Животные' },
  { value: 'EDUCATION', label: 'Образование' },
  { value: 'HOUSEHOLD', label: 'Бытовые услуги' },
  { value: 'BEAUTY', label: 'Красота' },
  { value: 'REPAIR', label: 'Ремонт' },
  { value: 'DOCUMENTS', label: 'Документы' },
  { value: 'CREATIVE', label: 'Креатив' },
  { value: 'IT', label: 'IT / Технологии' },
];
const SWIPE_TYPES = [
  { value: 'THING', label: 'Вещь' },
  { value: 'SERVICE', label: 'Услуга' },
];
const SWIPE_CITIES = [
  'Москва',
  'Санкт-Петербург',
  'Новосибирск',
  'Екатеринбург',
  'Казань',
  'Челябинск',
  'Нижний Новгород',
  'Самара',
  'Омск',
  'Ростов-на-Дону',
  'Другой город',
];
const SWIPE_THRESHOLD_PX = 110;
const SWIPE_EXIT_OFFSET_PX = 480;

interface MyItem {
  id: string;
  title: string;
  type: string;
  category: string;
  status: string;
}

export default function SwipePage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCity, setFilterCity] = useState('');

  const feedFilters = useMemo(
    () => ({
      type: filterType || undefined,
      category: filterCategory || undefined,
      city: filterCity || undefined,
    }),
    [filterType, filterCategory, filterCity],
  );

  const {
    items,
    currentIndex,
    hasMore,
    loading,
    loadingMore,
    error: feedError,
    skip,
    wantExchange,
    refresh,
  } = useSwipeFeed(feedFilters);

  const [myItems, setMyItems] = useState<MyItem[]>([]);
  const [myItemsLoading, setMyItemsLoading] = useState(false);
  const [exchangeSenderId, setExchangeSenderId] = useState<string>('');
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [exchangeBusy, setExchangeBusy] = useState(false);
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [gestureBusy, setGestureBusy] = useState(false);
  const dragStartXRef = useRef<number | null>(null);

  useEffect(() => {
    const loadMyItems = async () => {
      if (sessionStatus !== 'authenticated') return;
      setMyItemsLoading(true);
      const result = await apiGet<MyItem[] | { error?: string }>('/api/items/user');
      if (!result.ok) {
        setMyItems([]);
        setMyItemsLoading(false);
        return;
      }
      const list = Array.isArray(result.data) ? (result.data as MyItem[]) : [];
      setMyItems(list);
      setMyItemsLoading(false);
    };
    void loadMyItems();
  }, [sessionStatus]);

  const activeMyItems = useMemo(() => myItems.filter((i) => i.status === 'ACTIVE'), [myItems]);
  const hasActiveMyItems = activeMyItems.length > 0;

  const currentCard = currentIndex < items.length ? items[currentIndex] : null;
  const nextCard = currentIndex + 1 < items.length ? items[currentIndex + 1] : null;
  const nextNextCard = currentIndex + 2 < items.length ? items[currentIndex + 2] : null;
  const hasActiveFilters = Boolean(filterType || filterCategory || filterCity);
  const controlsLocked = gestureBusy || exchangeBusy || loading;

  const atEndOfFeed = items.length > 0 && currentIndex >= items.length;
  const waitingForMore = atEndOfFeed && (hasMore || loadingMore);

  const finishGesture = async (deltaX: number) => {
    setIsDragging(false);
    dragStartXRef.current = null;
    setExchangeError(null);

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) {
      setDragOffsetX(0);
      return;
    }

    if (deltaX > 0) {
      if (!hasActiveMyItems) {
        setDragOffsetX(0);
        setExchangeError('У вас нет активных объявлений для обмена.');
        return;
      }
      if (!exchangeSenderId) {
        setDragOffsetX(0);
        setExchangeError('Сначала выберите своё объявление для обмена.');
        return;
      }
    }

    setGestureBusy(true);
    setDragOffsetX(deltaX > 0 ? SWIPE_EXIT_OFFSET_PX : -SWIPE_EXIT_OFFSET_PX);
    await new Promise((resolve) => setTimeout(resolve, 140));

    if (deltaX > 0) {
      const res = await wantExchange(exchangeSenderId);
      if (!res.ok) {
        setExchangeError(res.error);
      } else {
        setExchangeSenderId('');
      }
    } else {
      skip();
    }

    setDragOffsetX(0);
    setGestureBusy(false);
  };

  const onStackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!currentCard || gestureBusy || exchangeBusy) return;
    dragStartXRef.current = e.clientX;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onStackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragStartXRef.current == null) return;
    const deltaX = e.clientX - dragStartXRef.current;
    setDragOffsetX(deltaX);
  };

  const onStackPointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragStartXRef.current == null) return;
    const deltaX = e.clientX - dragStartXRef.current;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    await finishGesture(deltaX);
  };

  const onStackPointerCancel = () => {
    setIsDragging(false);
    dragStartXRef.current = null;
    setDragOffsetX(0);
  };

  if (!loading && session && !myItemsLoading && !hasActiveMyItems) {
    return (
      <div className="container mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center px-4 py-8">
        <GlassCard className="w-full space-y-4 p-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="gradient-text-brand">Свайп-обмен</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            У вас нет активных объявлений для обмена.
          </p>
          <div className="flex justify-center">
            <LinkButton href="/new" variant="primary" className="w-full justify-center sm:w-auto">
              Создать объявление
            </LinkButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (feedError) {
    return (
      <div className="container mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-8">
        <GlassCard className="w-full space-y-4 p-8 text-center">
          <p className="text-sm text-destructive">{feedError}</p>
        {feedError === 'Необходимо войти в систему.' && (
          <div className="flex justify-center">
            <LinkButton href="/auth/login" variant="primary" className="w-full justify-center sm:w-auto">
              Войти
            </LinkButton>
          </div>
        )}
        </GlassCard>
      </div>
    );
  }

  if (atEndOfFeed) {
    if (waitingForMore) {
      return (
        <div className="container mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center px-4 py-8 text-center">
          <GlassCard className="w-full p-8">
            <p className="text-sm text-muted-foreground">Подгрузка ленты...</p>
          </GlassCard>
        </div>
      );
    }
    return (
      <div className="container mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center px-4 py-8 text-center">
        <GlassCard className="w-full space-y-4 p-8">
          <h1 className="text-2xl font-bold tracking-tight">Объявления закончились</h1>
          <p className="text-sm text-muted-foreground">
            Вы просмотрели всю ленту с текущими фильтрами. Можно обновить или открыть каталог.
          </p>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button variant="secondary" size="sm" onClick={() => void refresh()}>
              Обновить
            </Button>
            <LinkButton href="/catalog" variant="primary" className="justify-center">
              В каталог
            </LinkButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-[80vh] max-w-[520px] flex-col items-center px-4 py-8">
      <h1 className="mb-1 text-3xl font-bold tracking-tight md:text-4xl">
        <span className="gradient-text-brand">Свайп-обмен</span>
      </h1>
      <p className="mb-5 text-sm text-muted-foreground">Лента объявлений для обмена</p>

      <GlassCard className="mb-5 w-full max-w-[500px] p-2.5 sm:p-3">
        <div className="grid grid-cols-3 gap-2">
        <Select value={filterType || 'all'} onValueChange={(v) => setFilterType(v === 'all' ? '' : v)} disabled={controlsLocked}>
          <SelectTrigger className="h-10 w-full text-xs sm:text-sm">
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {SWIPE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory || 'all'} onValueChange={(v) => setFilterCategory(v === 'all' ? '' : v)} disabled={controlsLocked}>
          <SelectTrigger className="h-10 w-full text-xs sm:text-sm">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {SWIPE_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCity || 'all'} onValueChange={(v) => setFilterCity(v === 'all' ? '' : v)} disabled={controlsLocked}>
          <SelectTrigger className="h-10 w-full text-xs sm:text-sm">
            <SelectValue placeholder="Город" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все города</SelectItem>
            {SWIPE_CITIES.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
      </GlassCard>

      {loadingMore && (
        <p className="mb-3 w-full max-w-[500px] text-center text-xs text-muted-foreground">Догрузка...</p>
      )}

      {loading && items.length === 0 ? (
        <GlassCard className="mt-1 flex min-h-[42vh] w-full max-w-[500px] flex-col items-center justify-center p-8 text-center">
          <p className="text-sm text-muted-foreground">Обновляем ленту...</p>
        </GlassCard>
      ) : !loading && items.length === 0 ? (
        <GlassCard className="mt-1 flex min-h-[42vh] w-full max-w-[500px] flex-col items-center justify-center p-8 text-center">
          <h2 className="mb-2 text-2xl font-bold tracking-tight">Ты прошёл Менариум!</h2>
          <p className="mb-1 max-w-sm text-sm text-muted-foreground">
            Загляни позже — нас становится больше с каждым днём
          </p>
          {hasActiveFilters && (
            <p className="mb-5 text-xs text-muted-foreground/80">Активные фильтры могут сужать выдачу.</p>
          )}
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="glass-card w-full rounded-2xl border border-white/20 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/12"
              onClick={() => router.push('/catalog')}
              disabled={loading}
            >
              В каталог
            </button>
            <button
              type="button"
              className="w-full rounded-2xl border border-white/20 bg-gradient-to-r from-menarium-teal/80 to-menarium-purple/80 px-6 py-3 text-base font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
              onClick={() => void refresh()}
              disabled={loading}
            >
              {loading ? 'Обновляем...' : 'Обновить'}
            </button>
          </div>
        </GlassCard>
      ) : (
        <>
          <div
            className="w-full max-w-[500px] touch-pan-y"
            onPointerDown={onStackPointerDown}
            onPointerMove={onStackPointerMove}
            onPointerUp={onStackPointerUp}
            onPointerCancel={onStackPointerCancel}
          >
            <SwipeStack
              current={currentCard}
              next={nextCard}
              nextNext={nextNextCard}
              dragOffsetX={dragOffsetX}
              isDragging={isDragging}
            />
          </div>

          <div className="mt-5 w-full max-w-[500px] space-y-3">
            <Button variant="secondary" className="w-full" size="sm" onClick={skip} disabled={gestureBusy || exchangeBusy}>
              Пропустить
            </Button>

            <GlassCard className="space-y-2 rounded-xl p-4">
              <p className="text-xs text-muted-foreground">Обмен: выберите своё активное объявление</p>
              <Select value={exchangeSenderId} onValueChange={setExchangeSenderId} disabled={controlsLocked}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ваше объявление" />
                </SelectTrigger>
                <SelectContent>
                  {activeMyItems.map((my) => (
                    <SelectItem key={my.id} value={my.id}>
                      {my.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                size="sm"
                variant="primary"
                disabled={!exchangeSenderId || exchangeBusy || gestureBusy || !hasActiveMyItems}
                onClick={async () => {
                  setExchangeError(null);
                  if (!session) {
                    router.push('/auth/login');
                    return;
                  }
                  setExchangeBusy(true);
                  const res = await wantExchange(exchangeSenderId);
                  setExchangeBusy(false);
                  if (!res.ok) {
                    setExchangeError(res.error);
                    return;
                  }
                  setExchangeSenderId('');
                }}
              >
                {exchangeBusy ? 'Отправка...' : 'Предложить обмен'}
              </Button>
              {exchangeError && <p className="text-sm text-red-500">{exchangeError}</p>}
            </GlassCard>

            {currentCard && (
              <Link className="inline-flex w-full justify-center text-sm font-semibold text-brand-blue hover:text-brand-blue-light" href={`/item/${currentCard.id}?from=swipe`}>
                Подробнее
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
