"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Badge, Button, GlassCard, LinkButton } from '@/components/menarium';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { apiGet, apiPost } from '@/lib/api';
import { pickArray } from '@/lib/guards';
import { SwipeCardSkeleton } from '@/components/ui/skeletons';
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent, DragMoveEvent } from '@dnd-kit/core';

const SWIPE_CATEGORIES = [
  { value: "FURNITURE", label: "Мебель" },
  { value: "CLOTHES", label: "Одежда" },
  { value: "BOOKS", label: "Книги" },
  { value: "ELECTRONICS", label: "Электроника" },
  { value: "TOOLS", label: "Инструменты" },
  { value: "TOYS", label: "Игрушки" },
  { value: "SPORT", label: "Спорт" },
  { value: "OTHER", label: "Другое" },
];
const SWIPE_TYPES = [
  { value: "THING", label: "Вещь" },
  { value: "SERVICE", label: "Услуга" },
];
const SWIPE_CITIES = [
  "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань", "Челябинск", "Нижний Новгород", "Самара", "Омск", "Ростов-на-Дону", "Другой город",
];

interface SwipeItem {
  id: string;
  title: string;
  city: string;
  category: string;
  images: string[];
  userId: string;
  status: string;
}

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

  const [items, setItems] = useState<SwipeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterCity, setFilterCity] = useState<string>("");

  const [myItems, setMyItems] = useState<MyItem[]>([]);
  const [myItemsLoading, setMyItemsLoading] = useState(false);
  const [myItemsError, setMyItemsError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMyItemId, setSelectedMyItemId] = useState<string | undefined>();
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentItem = useMemo(
    () => (currentIndex < items.length ? items[currentIndex] : null),
    [items, currentIndex],
  );

  const loadSwipeItems = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (filterCategory) params.set("category", filterCategory);
    if (filterCity) params.set("city", filterCity);
    const query = params.toString();
    const url = query ? `/api/items/swipe?${query}` : "/api/items/swipe";
    const result = await apiGet<{ items: SwipeItem[] } | { items?: SwipeItem[]; error?: string }>(url);
    if (!result.ok) {
      setItems([]);
      setError(result.status === 401 ? "Необходимо войти в систему." : (result.error || "Не удалось загрузить объявления. Попробуйте обновить страницу."));
      setLoading(false);
      return;
    }
    const list = pickArray<SwipeItem>(result.data, ["items"]);
    setItems(list);
    setCurrentIndex(0);
    setLoading(false);
  }, [session?.user?.id, filterType, filterCategory, filterCity]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      setLoading(false);
      setItems([]);
      setError("Необходимо войти в систему.");
      return;
    }
    if (session?.user?.id) loadSwipeItems();
    else setLoading(false);
  }, [session?.user?.id, sessionStatus, loadSwipeItems]);

  // Загрузка собственных активных объявлений
  useEffect(() => {
    const loadMyItems = async () => {
      if (sessionStatus !== 'authenticated') return;

      setMyItemsLoading(true);
      setMyItemsError(null);

      const result = await apiGet<MyItem[] | { error?: string }>('/api/items/user');

      if (!result.ok) {
        if (result.status === 401) {
          setMyItemsError('Необходимо войти в систему.');
        } else {
          setMyItemsError(result.error || 'Не удалось загрузить ваши объявления.');
        }
        setMyItems([]);
        setMyItemsLoading(false);
        return;
      }

      const list = Array.isArray(result.data) ? (result.data as MyItem[]) : [];
      setMyItems(list);
      setMyItemsLoading(false);
    };

    loadMyItems();
  }, [sessionStatus]);

  const hasActiveMyItems = useMemo(
    () => myItems.some((i) => i.status === 'ACTIVE'),
    [myItems],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const [dragOffsetX, setDragOffsetX] = useState(0);

  function handleSkip() {
    setToastMessage(null);
    setCurrentIndex((prev) => prev + 1);
    setDragOffsetX(0);
  }

  function handleWantExchange() {
    if (actionLoading || dialogOpen) return;
    setToastMessage(null);

    if (!session) {
      router.push('/auth/login');
      return;
    }

    if (!hasActiveMyItems) {
      setToastMessage('У вас нет активных объявлений для обмена.');
      return;
    }

    setDialogOpen(true);
  }

  async function handleExchange() {
    if (!currentItem || !selectedMyItemId) return;
    setActionLoading(true);
    setToastMessage(null);

    const result = await apiPost<{ receiverItemId: string; senderItemId: string }, any>('/api/exchange', {
      receiverItemId: currentItem.id,
      senderItemId: selectedMyItemId,
    });

    if (!result.ok) {
      if (result.status === 401) {
        setToastMessage('Необходимо войти в систему.');
      } else if (result.status === 409) {
        setToastMessage(result.error || 'Нельзя создать обмен: объявление недоступно.');
      } else {
        setToastMessage(result.error || 'Не удалось создать обмен. Попробуйте ещё раз.');
      }
      setActionLoading(false);
      return;
    }

    setToastMessage('Предложение отправлено.');
    setDialogOpen(false);
    setSelectedMyItemId(undefined);
    setActionLoading(false);
    setCurrentIndex((prev) => prev + 1);
    setDragOffsetX(0);
  }

  // Гейтинг: у авторизованного пользователя нет активных объявлений
  if (!loading && session && !myItemsLoading && !hasActiveMyItems) {
    return (
      <div className="container mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center px-4 py-10">
        <GlassCard className="w-full space-y-4 p-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="gradient-text-brand">Swipe</span>
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            У вас нет активных объявлений для обмена.
          </p>
          <LinkButton href="/new" variant="primary" className="w-full justify-center sm:w-auto">
            Создать объявление
          </LinkButton>
        </GlassCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-[60vh] max-w-lg flex-col items-center px-4 py-10">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="gradient-text-brand">Swipe</span>
          </h1>
          <p className="text-sm text-muted-foreground">Загрузка объявлений...</p>
        </div>
        <SwipeCardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-10">
        <GlassCard className="w-full space-y-4 p-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
          {error === "Необходимо войти в систему." && (
            <LinkButton href="/auth/login" variant="primary" className="justify-center">
              Войти
            </LinkButton>
          )}
        </GlassCard>
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center px-4 py-10">
        <GlassCard className="w-full space-y-4 p-8 text-center">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Нет подходящих объявлений</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Измените фильтры или перейдите в каталог.
          </p>
          <LinkButton href="/catalog" variant="secondary" className="justify-center">
            Перейти в каталог
          </LinkButton>
        </GlassCard>
      </div>
    );
  }

  if (items.length > 0 && currentIndex >= items.length) {
    return (
      <div className="container mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center px-4 py-10">
        <GlassCard className="w-full space-y-4 p-8 text-center">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Объявления закончились</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Вы просмотрели все подходящие объявления. Зайдите позже или измените фильтры.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={() => loadSwipeItems()}>
              Обновить ленту
            </Button>
            <LinkButton href="/catalog" variant="primary" className="w-full justify-center sm:w-auto">
              Перейти в каталог
            </LinkButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  const item = currentItem!;
  const image = Array.isArray(item.images) && item.images.length ? item.images[0] : '';

  function handleDragMove(event: DragMoveEvent) {
    if (actionLoading || dialogOpen) return;
    setDragOffsetX(event.delta.x);
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (actionLoading || dialogOpen) {
      setDragOffsetX(0);
      return;
    }

    const threshold = 120;
    const deltaX = event.delta.x;

    if (deltaX > threshold) {
      // свайп вправо = предложить обмен
      handleWantExchange();
    } else if (deltaX < -threshold) {
      // свайп влево = пропустить
      handleSkip();
    } else {
      // недостаточно смещения — вернуть карточку на место
      setDragOffsetX(0);
    }
  }

  const toastIsError =
    toastMessage != null &&
    (toastMessage.includes('Нельзя') ||
      toastMessage.includes('Необходимо войти') ||
      toastMessage.includes('Не удалось'));

  return (
    <div className="container mx-auto flex min-h-[80vh] max-w-lg flex-col items-center px-4 py-8 md:py-10">
      <div className="mb-6 w-full space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          <span className="gradient-text-brand">Swipe</span>
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">Листайте объявления для обмена</p>
      </div>

      <GlassCard className="mb-4 w-full max-w-md space-y-3 p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Фильтры</p>
        <div className="flex flex-wrap gap-2">
          <Select value={filterType || "all"} onValueChange={(v) => setFilterType(v === "all" ? "" : v)}>
            <SelectTrigger className="h-10 min-w-[124px] flex-1 text-xs sm:text-sm">
              <SelectValue placeholder="Тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              {SWIPE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory || "all"} onValueChange={(v) => setFilterCategory(v === "all" ? "" : v)}>
            <SelectTrigger className="h-10 min-w-[140px] flex-1 text-xs sm:text-sm">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {SWIPE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCity || "all"} onValueChange={(v) => setFilterCity(v === "all" ? "" : v)}>
            <SelectTrigger className="h-10 min-w-[140px] w-full flex-[1_1_100%] text-xs sm:w-auto sm:flex-1 sm:text-sm">
              <SelectValue placeholder="Город" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все города</SelectItem>
              {SWIPE_CITIES.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {toastMessage && (
        <div
          className={cn(
            'mb-4 w-full max-w-md rounded-2xl border px-4 py-3 text-center text-sm',
            toastIsError
              ? 'border-destructive/40 bg-destructive/10 text-destructive'
              : 'border-brand-blue/35 bg-brand-blue/10 text-brand-blue-light',
          )}
        >
          {toastMessage}
        </div>
      )}

      <div className="w-full max-w-md">
        <DndContext sensors={sensors} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
          <GlassCard
            variant="hover"
            className="relative overflow-hidden rounded-3xl border-white/15 shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
            style={{
              transform: `translateX(${dragOffsetX}px) rotate(${dragOffsetX / 25}deg)`,
              transition: actionLoading || dialogOpen ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <div className="relative flex h-64 items-center justify-center overflow-hidden bg-white/5">
              {image ? (
                <img src={image} alt={item.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  Нет фото
                </div>
              )}
              {dragOffsetX > 30 && (
                <Badge
                  variant="gradient"
                  className="absolute left-3 top-3 border-0 bg-gradient-to-r from-menarium-teal/95 to-menarium-cyan/95 text-xs font-semibold text-white shadow-lg"
                >
                  Обмен
                </Badge>
              )}
              {dragOffsetX < -30 && (
                <Badge
                  variant="default"
                  className="absolute right-3 top-3 border border-white/15 bg-destructive/90 text-xs font-semibold text-white"
                >
                  Пропустить
                </Badge>
              )}
            </div>
            <div className="space-y-2 p-4 sm:p-5">
              <div className="truncate text-lg font-semibold text-foreground">{item.title}</div>
              <div className="text-sm text-muted-foreground">{item.city}</div>
              <div className="text-xs text-muted-foreground">
                Категория:{' '}
                <span className="font-medium text-foreground/90">{item.category}</span>
              </div>
              <Link
                href={`/item/${item.id}?from=swipe`}
                className="mt-2 inline-flex text-sm font-semibold text-brand-blue transition hover:text-brand-blue-light"
              >
                Подробнее
              </Link>
            </div>
          </GlassCard>
        </DndContext>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button variant="secondary" size="md" className="min-h-[52px] w-full flex-1 touch-manipulation" onClick={handleSkip}>
            Пропустить
          </Button>
          <Button variant="primary" size="md" className="min-h-[52px] w-full flex-1 touch-manipulation" onClick={handleWantExchange}>
            Предложить обмен
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card max-w-md border-white/15 text-foreground sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Выберите своё объявление для обмена</DialogTitle>
          </DialogHeader>
          {myItemsLoading ? (
            <div className="py-4 text-sm text-muted-foreground">Загрузка ваших объявлений...</div>
          ) : myItemsError ? (
            <div className="py-4 text-sm text-destructive">{myItemsError}</div>
          ) : !hasActiveMyItems ? (
            <div className="py-4 text-sm text-muted-foreground">
              У вас нет активных объявлений для обмена.
            </div>
          ) : (
            <Select value={selectedMyItemId} onValueChange={setSelectedMyItemId}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Выберите объявление" />
              </SelectTrigger>
              <SelectContent>
                {myItems.map((my) => (
                  <SelectItem key={my.id} value={my.id}>
                    {my.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button
              variant="primary"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleExchange}
              disabled={!selectedMyItemId || actionLoading || !hasActiveMyItems}
            >
              {actionLoading ? 'Отправка...' : 'Подтвердить обмен'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}