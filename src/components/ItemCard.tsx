// src/components/ItemCard.tsx

'use client';

import Link from 'next/link';
import { Item } from '@prisma/client';
import { Pencil } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Badge, GlassCard, IconContainer } from '@/components/menarium';

interface ItemCardProps {
  item: Item;
  currentUserId?: string | null;
  from?: 'my-items' | 'catalog';
  isDragging?: boolean;
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

  let image = '';
  try {
    const arr = JSON.parse(item.images);
    if (Array.isArray(arr)) image = arr[0];
  } catch {
    image = '';
  }

  const isInDeal = item.status === 'IN_DEAL';
  const isArchived = item.status === 'ARCHIVED';

  return (
    <GlassCard variant="hover" className="relative overflow-hidden border-white/10">
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

      {isOwner && !isInDeal && !isArchived && (
        <Link
          href={`/item/${item.id}/edit`}
          className="absolute right-2 top-2 z-10 rounded-full p-0.5 transition hover:scale-105"
          title="Редактировать"
          onClick={(e) => e.stopPropagation()}
        >
          <IconContainer size="sm" variant="glass">
            <Pencil className="text-primary" aria-hidden />
          </IconContainer>
        </Link>
      )}

      <Link
        href={url}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        className="block"
      >
        {image && (
          <img
            src={image}
            alt={item.title}
            className="h-48 w-full object-cover"
          />
        )}
        <div className="p-4">
          <h3 className="truncate text-lg font-semibold text-foreground">{item.title}</h3>
          <p className="truncate text-sm text-muted-foreground">{item.description}</p>
        </div>
      </Link>
    </GlassCard>
  );
}
