"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
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
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-6 text-center space-y-4">
        <h1 className="text-2xl font-bold">Swipe</h1>
        <p className="text-slate-600 text-sm max-w-md">
          У вас нет активных объявлений для обмена.
        </p>
        <Button asChild className="mt-2">
          <Link href="/new">Создать объявление</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center min-h-[60vh] px-4 py-6">
        <h1 className="text-2xl font-bold mb-1">Swipe</h1>
        <p className="text-slate-600 text-sm mb-4">Загрузка объявлений...</p>
        <SwipeCardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] px-4 text-center space-y-3">
        <p className="text-red-600">{error}</p>
        {error === "Необходимо войти в систему." && (
          <Button asChild>
            <Link href="/auth/login">Войти</Link>
          </Button>
        )}
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-6 text-center space-y-4">
        <h1 className="text-2xl font-bold">Нет подходящих объявлений</h1>
        <p className="text-slate-600 text-sm max-w-md">
          Измените фильтры или перейдите в каталог.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button asChild variant="outline" size="sm">
            <Link href="/catalog">Перейти в каталог</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (items.length > 0 && currentIndex >= items.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-6 text-center space-y-4">
        <h1 className="text-2xl font-bold">Объявления закончились</h1>
        <p className="text-slate-600 text-sm max-w-md">
          Вы просмотрели все подходящие объявления. Зайдите позже или измените фильтры.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={() => loadSwipeItems()}>
            Обновить ленту
          </Button>
          <Button asChild className="mt-2">
            <Link href="/catalog">Перейти в каталог</Link>
          </Button>
        </div>
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Swipe</h1>
      <p className="text-slate-600 text-sm mb-3">Листайте объявления для обмена</p>

      <div className="w-full max-w-md flex flex-wrap gap-2 mb-3">
        <Select value={filterType || "all"} onValueChange={(v) => setFilterType(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[120px] h-9 text-xs">
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
          <SelectTrigger className="w-[140px] h-9 text-xs">
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
          <SelectTrigger className="w-[140px] h-9 text-xs">
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

      {toastMessage && (
        <div className="mb-4 bg-blue-100 text-blue-800 rounded px-4 py-2 text-sm w-full max-w-md text-center">
          {toastMessage}
        </div>
      )}

      <div className="w-full max-w-md">
        <DndContext sensors={sensors} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
          <Card
            className="shadow-xl rounded-3xl overflow-hidden bg-white border border-blue-100 relative"
            style={{
              transform: `translateX(${dragOffsetX}px) rotate(${dragOffsetX / 25}deg)`,
              transition: actionLoading || dialogOpen ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <div className="h-64 bg-slate-100 flex items-center justify-center overflow-hidden relative">
              {image ? (
                <img src={image} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                  Нет фото
                </div>
              )}
              {/* Лёгкий визуальный фидбек свайпа */}
              {dragOffsetX > 30 && (
                <div className="absolute left-4 top-4 rounded-full bg-green-500/80 text-white text-xs px-3 py-1 flex items-center gap-1">
                  <span>❤️</span>
                  <span>Обмен</span>
                </div>
              )}
              {dragOffsetX < -30 && (
                <div className="absolute right-4 top-4 rounded-full bg-red-500/80 text-white text-xs px-3 py-1 flex items-center gap-1">
                  <span>❌</span>
                  <span>Пропустить</span>
                </div>
              )}
            </div>
            <div className="p-4 space-y-2">
              <div className="text-lg font-bold truncate">{item.title}</div>
              <div className="text-sm text-slate-500">{item.city}</div>
              <div className="text-xs text-slate-500">
                Категория: <span className="font-medium">{item.category}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 text-blue-600 hover:bg-blue-50 hover:text-blue-800 rounded-full px-3 py-1"
                asChild
              >
                <Link href={`/item/${item.id}?from=swipe`}>Подробнее</Link>
              </Button>
            </div>
          </Card>
        </DndContext>

        <div className="flex justify-between mt-6 gap-4">
          <Button
            variant="outline"
            size="lg"
            className="w-1/2 py-3 text-base"
            onClick={handleSkip}
          >
            ❌ Пропустить
          </Button>
          <Button
            variant="default"
            size="lg"
            className="w-1/2 py-3 text-base"
            onClick={handleWantExchange}
          >
            ❤️ Предложить обмен
          </Button>
        </div>
      </div>

      {/* Модал выбора собственного объявления */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выберите своё объявление для обмена</DialogTitle>
          </DialogHeader>
          {myItemsLoading ? (
            <div className="py-4 text-sm text-slate-500">Загрузка ваших объявлений...</div>
          ) : myItemsError ? (
            <div className="py-4 text-sm text-red-600">{myItemsError}</div>
          ) : !hasActiveMyItems ? (
            <div className="py-4 text-sm text-slate-500">
              У вас нет активных объявлений для обмена.
            </div>
          ) : (
            <Select value={selectedMyItemId} onValueChange={setSelectedMyItemId}>
              <SelectTrigger className="w-full">
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
          <DialogFooter>
            <Button
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