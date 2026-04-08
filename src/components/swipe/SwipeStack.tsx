'use client';

import type { SwipeFeedItem } from '@/hooks/useSwipeFeed';

export type SwipeStackProps = {
  current: SwipeFeedItem | null;
  next: SwipeFeedItem | null;
  nextNext: SwipeFeedItem | null;
  dragOffsetX?: number;
  isDragging?: boolean;
};

function primaryImage(images: string[] | undefined): string | undefined {
  if (!Array.isArray(images) || images.length === 0) return undefined;
  return typeof images[0] === 'string' ? images[0] : undefined;
}

/**
 * Три слоя карточек (текущая и два следующих). Только отображение, без жестов и логики загрузки.
 */
export function SwipeStack({
  current,
  next,
  nextNext,
  dragOffsetX = 0,
  isDragging = false,
}: SwipeStackProps) {
  const layers: { card: SwipeFeedItem | null; z: number; top: number; scale: number }[] = [
    { card: nextNext, z: 1, top: 16, scale: 0.94 },
    { card: next, z: 2, top: 8, scale: 0.97 },
    { card: current, z: 3, top: 0, scale: 1 },
  ];

  return (
    <div className="relative mx-auto h-80 w-full max-w-md">
      {layers.map(({ card, z, top, scale }) => {
        const isCurrentLayer = z === 3;
        const transform = isCurrentLayer
          ? `translateX(${dragOffsetX}px) rotate(${dragOffsetX / 24}deg) scale(${scale})`
          : `scale(${scale})`;
        return (
        <div
          key={card?.id ?? `slot-${z}`}
          className="absolute inset-x-0 overflow-hidden rounded-xl border border-neutral-600 bg-neutral-900"
          style={{
            zIndex: z,
            top,
            transform,
            transformOrigin: 'top center',
            transition: isCurrentLayer
              ? isDragging
                ? 'none'
                : 'transform 0.16s ease-out'
              : 'transform 0.16s ease-out',
          }}
        >
          {card ? (
            <>
              <div className="relative h-48 w-full bg-neutral-800">
                {primaryImage(card.images) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- архитектурный слой без оптимизации изображений
                  <img
                    src={primaryImage(card.images)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-neutral-500">
                    Нет фото
                  </div>
                )}
              </div>
              <div className="space-y-1 p-3 text-left">
                <div className="truncate text-base font-semibold text-neutral-100">{card.title}</div>
                <div className="text-sm text-neutral-400">{card.city}</div>
                <div className="text-xs text-neutral-500">
                  Категория: <span className="text-neutral-300">{card.category}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-neutral-600">
              Нет карточки
            </div>
          )}
        </div>
      )})}
    </div>
  );
}
