"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ItemCard from '@/components/ItemCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { CatalogGridSkeleton } from '@/components/ui/skeletons';
import { apiGet } from '@/lib/api';
import { pickArray } from '@/lib/guards';

const categories = [
  { value: "FURNITURE", label: "Мебель" },
  { value: "CLOTHES", label: "Одежда" },
  { value: "BOOKS", label: "Книги" },
  { value: "ELECTRONICS", label: "Электроника" },
  { value: "TOOLS", label: "Инструменты" },
  { value: "TOYS", label: "Игрушки" },
  { value: "SPORT", label: "Спорт" },
  { value: "OTHER", label: "Другое" },
];
const types = [
  { value: "THING", label: "Вещь" },
  { value: "SERVICE", label: "Услуга" },
];
const cities = [
  "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань", "Челябинск", "Нижний Новгород", "Самара", "Омск", "Ростов-на-Дону", "Другой город"
];
const sortOptions = [
  { value: "createdAt_desc", label: "Сначала новые" },
  { value: "createdAt_asc", label: "Сначала старые" },
  { value: "title_asc", label: "По алфавиту (А-Я)" },
  { value: "title_desc", label: "По алфавиту (Я-А)" },
];

function getQueryString(params: Record<string, string | boolean | undefined>) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
}

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Состояния фильтров
  const [type, setType] = useState<string | undefined>(searchParams.get("type") || undefined);
  const [category, setCategory] = useState<string | undefined>(searchParams.get("category") || undefined);
  const [city, setCity] = useState<string | undefined>(searchParams.get("city") || undefined);
  const [acceptsAnything, setAcceptsAnything] = useState<boolean>(searchParams.get("acceptsAnything") === "true");
  const [sort, setSort] = useState<string>(searchParams.get("sort") || "createdAt_desc");

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  // Обновление URL и фильтров
  function updateFilters(newFilters: Partial<{ type: string; category: string; city: string; acceptsAnything: boolean; sort: string; }>) {
    const next = {
      type,
      category,
      city,
      acceptsAnything,
      sort,
      ...newFilters,
    };
    // Удаляем пустые значения
    Object.keys(next).forEach((k) => {
      if (next[k as keyof typeof next] === undefined || next[k as keyof typeof next] === "") delete next[k as keyof typeof next];
    });
    const query = getQueryString(next);
    router.replace(`/catalog${query ? `?${query}` : ""}`);
    // Обновляем локальное состояние
    if (newFilters.type !== undefined) setType(newFilters.type);
    if (newFilters.category !== undefined) setCategory(newFilters.category);
    if (newFilters.city !== undefined) setCity(newFilters.city);
    if (newFilters.acceptsAnything !== undefined) setAcceptsAnything(newFilters.acceptsAnything);
    if (newFilters.sort !== undefined) setSort(newFilters.sort);
  }

  // Получение объявлений с фильтрами
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setErrorMessage(null);
      setErrorDetails(null);

      try {
        const params = getQueryString({ type, category, city, acceptsAnything, sort });
        const result = await apiGet<{ items: any[]; total: number } | { items?: any[]; total?: number; error?: string }>(`/api/items?${params}`);

        if (!result.ok) {
          setItems([]);
          setErrorMessage("Не удалось загрузить объявления. Попробуйте обновить страницу.");
          setErrorDetails(result.error || null);
          setTotal(0);
          return;
        }

        const rawItems = pickArray<any>(result.data, ['items']);
        setItems(rawItems);
        const totalFromApi =
          (result.data as any)?.total && typeof (result.data as any).total === "number"
            ? (result.data as any).total
            : rawItems.length;
        setTotal(totalFromApi);
      } catch {
        setItems([]);
        setErrorMessage("Не удалось загрузить объявления. Попробуйте обновить страницу.");
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [type, category, city, acceptsAnything, sort]);

  // Сброс фильтров
  function resetFilters() {
    setType(undefined);
    setCategory(undefined);
    setCity(undefined);
    setAcceptsAnything(false);
    setSort("createdAt_desc");
    router.replace("/catalog");
  }

  // Плашки выбранных фильтров
  const activeFilters = [
    type && types.find((t) => t.value === type)?.label,
    category && categories.find((c) => c.value === category)?.label,
    city,
    acceptsAnything ? "Готов на всё" : null,
  ].filter(Boolean);

  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="max-w-6xl mx-auto px-2 py-4 space-y-4">
      <h1 className="text-2xl font-bold mb-2">Каталог объявлений</h1>
      {/* Фильтры */}
      <div className="flex flex-wrap gap-2 items-center bg-white rounded-xl p-3 shadow-sm">
        <Select value={type} onValueChange={(v) => updateFilters({ type: v })}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent>
            {types.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={(v) => updateFilters({ category: v })}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={city} onValueChange={(v) => updateFilters({ city: v })}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Город" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Checkbox id="acceptsAnything" checked={acceptsAnything} onCheckedChange={(v) => updateFilters({ acceptsAnything: !!v })} />
          <label htmlFor="acceptsAnything" className="text-sm">Готов на всё</label>
        </div>
        <Select value={sort} onValueChange={(v) => updateFilters({ sort: v })}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={resetFilters} className="ml-auto">Сбросить</Button>
      </div>
      {/* Плашки выбранных фильтров */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center text-xs text-blue-700">
          {activeFilters.map((f, i) => (
            <span key={i} className="bg-blue-100 rounded px-2 py-1">{f}</span>
          ))}
        </div>
      )}
      {/* Число найденных результатов */}
      <div className="text-sm text-slate-500 mb-2">
        Найдено: {typeof total === "number" ? total : safeItems.length} объявлений
      </div>
      {/* Список объявлений */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? (
          <CatalogGridSkeleton count={6} />
        ) : errorMessage ? (
          <div className="col-span-full">
            <EmptyState
              title="Не удалось загрузить объявления"
              description={errorDetails ?? "Попробуйте обновить страницу."}
              actionLabel="Обновить"
              onAction={() => window.location.reload()}
            />
          </div>
        ) : safeItems.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              title={type || category || city || acceptsAnything ? "Нет объявлений по выбранным фильтрам" : "Нет объявлений"}
              description={type || category || city || acceptsAnything ? "Измените фильтры или сбросьте их." : "Создайте первое объявление или зайдите позже."}
              actionLabel={type || category || city || acceptsAnything ? "Сбросить фильтры" : "Создать объявление"}
              onAction={type || category || city || acceptsAnything ? resetFilters : undefined}
              actionHref={!type && !category && !city && !acceptsAnything ? "/new" : undefined}
            />
          </div>
        ) : (
          safeItems.map((item) => (
            <ItemCard key={item.id} item={item} from="catalog" />
          ))
        )}
      </div>
    </div>
  );
}
