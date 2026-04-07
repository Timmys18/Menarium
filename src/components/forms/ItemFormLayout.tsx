'use client';

import type { ReactNode } from 'react';

import { GlassCard } from '@/components/menarium';
import { cn } from '@/lib/utils';

export type ItemFormLayoutProps = {
  /** Контент над ошибкой и карточками (например заголовок страницы редактирования). */
  topSlot?: ReactNode;
  error?: string | null;
  className?: string;
  primaryCardClassName?: string;
  secondaryCardClassName?: string;
  typeCategorySection: ReactNode;
  titleField: ReactNode;
  descriptionField: ReactNode;
  cityField: ReactNode;
  afterCity?: ReactNode;
  secondaryCardChildren: ReactNode;
};

/**
 * Общий визуальный каркас create/edit объявления: только layout и DS-оболочка.
 * Логика формы, submit, API и маршрутизация остаются у родителя.
 */
export function ItemFormLayout({
  topSlot,
  error,
  className,
  primaryCardClassName,
  secondaryCardClassName,
  typeCategorySection,
  titleField,
  descriptionField,
  cityField,
  afterCity,
  secondaryCardChildren,
}: ItemFormLayoutProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {topSlot}
      {error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <GlassCard className={cn('space-y-6 p-6 sm:p-8', primaryCardClassName)}>
        {typeCategorySection}
        {titleField}
        {descriptionField}
        {cityField}
        {afterCity}
      </GlassCard>

      <GlassCard className={cn('space-y-5 p-6 sm:p-8', secondaryCardClassName)}>
        {secondaryCardChildren}
      </GlassCard>
    </div>
  );
}
