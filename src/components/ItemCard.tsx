// src/components/ItemCard.tsx

'use client';

import Link from 'next/link';
import { Item } from '@prisma/client';
import { Pencil } from 'lucide-react';
import { useEffect, useRef } from 'react';

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
    <div className="relative border rounded-xl bg-white shadow hover:shadow-lg transition overflow-hidden">
      {/* Бейдж статуса */}
      {isInDeal && (
        <div className="absolute top-2 left-2 z-10 rounded-full bg-amber-500 text-white text-xs px-2 py-0.5">
          В сделке
        </div>
      )}
      {isArchived && (
        <div className="absolute top-2 left-2 z-10 rounded-full bg-slate-500 text-white text-xs px-2 py-0.5">
          Завершено
        </div>
      )}

      {/* Кнопка редактирования только для активных объявлений */}
      {isOwner && !isInDeal && !isArchived && (
        <Link
          href={`/item/${item.id}/edit`}
          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:scale-105 transition z-10"
          title="Редактировать"
          onClick={(e) => e.stopPropagation()}
        >
          <Pencil className="w-4 h-4 text-blue-600" />
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
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-4">
          <h3 className="text-lg font-semibold truncate">{item.title}</h3>
          <p className="text-sm text-muted-foreground truncate">{item.description}</p>
        </div>
      </Link>
    </div>
  );
}
