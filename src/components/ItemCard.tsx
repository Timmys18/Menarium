// src/components/ItemCard.tsx

'use client';

import Link from 'next/link';
import { Item } from '@prisma/client';
import { Image as ImageIcon, Pencil } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Badge, GlassCard } from '@/components/menarium';

interface ItemCardProps {
  item: Item;
  currentUserId?: string | null;
  from?: 'my-items' | 'catalog';
  isDragging?: boolean;
}

function getPrimaryImage(rawImages: unknown): string {
  if (Array.isArray(rawImages)) {
    return typeof rawImages[0] === 'string' ? rawImages[0] : '';
  }

  if (typeof rawImages === 'string') {
    try {
      const parsed = JSON.parse(rawImages);
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
        return parsed[0];
      }
    } catch {
      return '';
    }
  }

  return '';
}

export default function ItemCard({
  item,
  currentUserId,
  from,
  isDragging = false,
}: ItemCardProps) {
  const isOwner = currentUserId === item.userId;
  const dragBlocked = useRef(false);
  const clickAllowed = useRef(true);

  useEffect(() => {
    if (isDragging) {
      dragBlocked.current = true;
      setTimeout(() => (dragBlocked.current = false), 50);
    }
  }, [isDragging]);

  const handlePointerDown = () => {
    clickAllowed.current = true;
  };

  const handlePointerMove = () => {
    clickAllowed.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!clickAllowed.current || dragBlocked.current) {
      e.preventDefault();
    }
  };

  const url =
    from === 'my-items' ? `/item/${item.id}?from=my-items` : `/item/${item.id}`;

  const image = getPrimaryImage((item as any).images);

  const isInDeal = item.status === 'IN_DEAL';
  const isArchived = item.status === 'ARCHIVED';

  return (
    <GlassCard
      variant="hover"
      className="group/card relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-[box-shadow,transform] duration-300 hover:border-primary/30 hover:shadow-glow-blue"
    >
      {isInDeal && (
        <div className="absolute left-2 top-2 z-10">
          <Badge
            variant="gradient"
            className="border-0 bg-gradient-to-r from-amber-500/90 to-orange-600/90 text-white"
          >
            В сделке
          </Badge>
        </div>
      )}
      {isArchived && (
        <div className="absolute left-2 top-2 z-10">
          <Badge variant="default" className="bg-white/10 text-white/90">
            Завершено
          </Badge>
        </div>
      )}

      <Link
        href={url}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        className="relative z-0 block"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/[0.03]">
          {image ? (
            <img
              src={image}
              alt={item.title}
              className="h-full w-full object-cover transition duration-500 group-hover/card:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full min-h-[180px] w-full items-center justify-center bg-white/5">
              <ImageIcon className="size-8 text-muted-foreground/60" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-h-[78px] space-y-1 p-4">
          <h3 className="truncate text-lg font-semibold tracking-tight text-foreground">{item.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        </div>
      </Link>

      {isOwner && !isInDeal && !isArchived && (
        <Link
          href={`/item/${item.id}/edit`}
          className="absolute right-2 top-2 z-30 flex size-10 items-center justify-center rounded-xl border-2 border-black bg-white/12 text-brand-blue shadow-[0_4px_20px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.12)_inset] backdrop-blur-xl backdrop-saturate-150 transition hover:bg-white/18 hover:text-brand-blue-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          title="Редактировать"
          onClick={(e) => e.stopPropagation()}
          aria-label="Редактировать объявление"
        >
          <Pencil className="size-[18px] shrink-0 text-brand-blue" strokeWidth={2.5} aria-hidden />
        </Link>
      )}
    </GlassCard>
  );
}
