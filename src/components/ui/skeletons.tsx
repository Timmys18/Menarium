import { Skeleton } from "./skeleton";

export function CatalogCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden rounded-3xl border border-white/10">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-6 w-3/4 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
      </div>
    </div>
  );
}

export function CatalogGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CatalogCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ItemPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <Skeleton className="h-5 w-24" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <Skeleton className="w-full aspect-[4/3] rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full mt-4" />
        </div>
      </div>
    </div>
  );
}

export function ExchangeCardSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg border-l-4">
      <div className="flex-1 space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-3">
          <div className="flex gap-2">
            <Skeleton className="w-16 h-16 rounded-md" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-16 h-16 rounded-md" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex gap-2 min-w-[140px]">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-9 flex-1 rounded-md" />
      </div>
    </div>
  );
}

export function SwipeCardSkeleton() {
  return (
    <div className="glass-card w-full max-w-md overflow-hidden rounded-3xl border border-white/10">
      <Skeleton className="h-64 w-full rounded-none bg-white/10" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-6 w-3/4 rounded-md bg-white/10" />
        <Skeleton className="h-4 w-1/3 rounded-md bg-white/10" />
        <Skeleton className="h-4 w-1/2 rounded-md bg-white/10" />
      </div>
    </div>
  );
}

export function NotificationsListSkeleton() {
  return (
    <ul className="divide-y">
      {[1, 2, 3].map((i) => (
        <li key={i} className="px-4 py-3 space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-24" />
        </li>
      ))}
    </ul>
  );
}

export function ChatMessagesSkeleton() {
  return (
    <div className="space-y-2 p-3">
      <Skeleton className="h-10 w-3/4 rounded-lg" />
      <Skeleton className="h-10 w-2/3 ml-auto rounded-lg" />
      <Skeleton className="h-10 w-4/5 rounded-lg" />
    </div>
  );
}
