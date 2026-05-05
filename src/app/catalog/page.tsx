"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import ItemCard from '@/components/ItemCard';
import { Badge, Button as MButton, GlassCard } from '@/components/menarium';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { CatalogGridSkeleton } from '@/components/ui/skeletons';
import { apiGet } from '@/lib/api';
import { pickArray } from '@/lib/guards';
import { cn } from '@/lib/utils';

const filterTriggerClass =
  "h-10 border-white/10 bg-white/5 text-foreground shadow-none backdrop-blur-xl hover:bg-white/10 focus:ring-menarium-purple/40";

const categories = [
  { value: "ELECTRONICS", label: "Электроника" },
  { value: "CLOTHING", label: "Одежда" },
  { value: "FURNITURE", label: "Мебель" },
  { value: "TOOLS", label: "Инструменты" },
  { value: "KIDS", label: "Детские товары" },
  { value: "BOOKS", label: "Книги" },
  { value: "SPORTS", label: "Спорт" },
  { value: "AUTO", label: "Авто" },
  { value: "PETS", label: "Животные" },
  { value: "EDUCATION", label: "Образование" },
  { value: "HOUSEHOLD", label: "Бытовые услуги" },
  { value: "BEAUTY", label: "Красота" },
  { value: "REPAIR", label: "Ремонт" },
  { value: "DOCUMENTS", label: "Документы" },
  { value: "CREATIVE", label: "Креатив" },
  { value: "IT", label: "IT / Технологии" },
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
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
    router.replace(`/catalog${query ? `?${query}` : ""}`, { scroll: false });
    // Обновляем локальное состояние
    if (newFilters.type !== undefined && newFilters.type !== type) setType(newFilters.type);
    if (newFilters.category !== undefined && newFilters.category !== category) setCategory(newFilters.category);
    if (newFilters.city !== undefined && newFilters.city !== city) setCity(newFilters.city);
    if (newFilters.acceptsAnything !== undefined && newFilters.acceptsAnything !== acceptsAnything) {
      setAcceptsAnything(newFilters.acceptsAnything);
    }
    if (newFilters.sort !== undefined && newFilters.sort !== sort) setSort(newFilters.sort);
  }

  // Получение объявлений с фильтрами
  useEffect(() => {
    const fetchItems = async () => {
      const hasCurrentItems = items.length > 0;
      setLoading(true);
      setIsRefreshing(hasCurrentItems);
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
        setIsRefreshing(false);
        setHasLoadedOnce(true);
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
    router.replace("/catalog", { scroll: false });
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
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-6 md:py-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent p-5 md:p-7">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(59,127,255,0.2),transparent_65%)]"
          aria-hidden
        />
        <div className="relative space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/60">Обменный каталог</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Каталог</h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">Найди идеальный обмен</p>
        </div>
      </div>
      {/* Фильтры — логика без изменений */}
      <GlassCard className="space-y-4 p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.08em] text-white/70">
            <SlidersHorizontal className="size-3.5 text-primary" />
            Фильтры
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground">
            <Search className="size-3.5" />
            <span>Найдено: {typeof total === "number" ? total : safeItems.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Select value={type} onValueChange={(v) => updateFilters({ type: v })}>
            <SelectTrigger className={cn("w-full", filterTriggerClass)}>
              <SelectValue placeholder="Тип" />
            </SelectTrigger>
            <SelectContent>
              {types.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={(v) => updateFilters({ category: v })}>
            <SelectTrigger className={cn("w-full", filterTriggerClass)}>
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={city} onValueChange={(v) => updateFilters({ city: v })}>
            <SelectTrigger className={cn("w-full", filterTriggerClass)}>
              <SelectValue placeholder="Город" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => updateFilters({ sort: v })}>
            <SelectTrigger className={cn("w-full", filterTriggerClass)}>
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
            <Checkbox id="acceptsAnything" checked={acceptsAnything} onCheckedChange={(v) => updateFilters({ acceptsAnything: !!v })} />
            <label htmlFor="acceptsAnything" className="cursor-pointer text-sm text-muted-foreground">
              Готов на всё
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <MButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={resetFilters}
            disabled={loading || isRefreshing}
            className="shrink-0 touch-manipulation"
          >
            Сбросить фильтры
          </MButton>
        </div>
      </GlassCard>
      {/* Плашки выбранных фильтров */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f, i) => (
            <Badge key={i} variant="default" className="max-w-full truncate">
              {f}
            </Badge>
          ))}
        </div>
      )}
      {/* Список объявлений */}
      <div className="relative min-h-[440px]">
        {isRefreshing && (
          <div className="pointer-events-none absolute inset-0 z-10 rounded-3xl bg-background/35 backdrop-blur-[1px]" />
        )}

        {loading && !hasLoadedOnce ? (
          <CatalogGridSkeleton count={6} />
        ) : errorMessage ? (
          <GlassCard className="flex min-h-[340px] items-center justify-center p-6 md:p-8">
            <EmptyState
              title="Не удалось загрузить объявления"
              description={errorDetails ?? "Попробуйте обновить страницу."}
              actionLabel="Обновить"
              onAction={() => window.location.reload()}
            />
          </GlassCard>
        ) : safeItems.length === 0 ? (
          <GlassCard className="flex min-h-[340px] items-center justify-center p-6 md:p-8">
            <EmptyState
              title={type || category || city || acceptsAnything ? "Нет объявлений по выбранным фильтрам" : "Нет объявлений"}
              description={type || category || city || acceptsAnything ? "Измените фильтры или сбросьте их." : "Создайте первое объявление или зайдите позже."}
              actionLabel={type || category || city || acceptsAnything ? "Сбросить фильтры" : "Создать объявление"}
              onAction={type || category || city || acceptsAnything ? resetFilters : undefined}
              actionHref={!type && !category && !city && !acceptsAnything ? "/new" : undefined}
            />
          </GlassCard>
        ) : (
          <div
            className={cn(
              "grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 md:gap-6",
              isRefreshing && "opacity-85 transition-opacity"
            )}
          >
            {safeItems.map((item) => (
              <ItemCard key={item.id} item={item} from="catalog" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
