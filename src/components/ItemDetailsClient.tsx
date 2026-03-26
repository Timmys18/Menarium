'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { Item } from '@prisma/client';
import { ItemType } from '@/types';
import { ThingCategoryLabels, ServiceCategoryLabels } from '@/lib/category-labels';

interface Props {
  item: Item & {
    images: string[] | string;
    desiredCategories: string[] | string;
  };
}

export default function ItemDetailsClient({ item }: Props) {
  const parsedImages = Array.isArray(item.images)
    ? item.images
    : JSON.parse(item.images || '[]');

  const parsedCategories = Array.isArray(item.desiredCategories)
    ? item.desiredCategories
    : JSON.parse(item.desiredCategories || '[]');

  const [selectedImage, setSelectedImage] = useState(parsedImages[0] || null);
  const [fullscreen, setFullscreen] = useState(false);

  const categoryLabel =
    item.type === ItemType.THING
      ? ThingCategoryLabels[item.category as keyof typeof ThingCategoryLabels]
      : ServiceCategoryLabels[item.category as keyof typeof ServiceCategoryLabels];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fullscreen || !parsedImages.length) return;
      const idx = parsedImages.indexOf(selectedImage!);
      if (e.key === 'ArrowLeft' && idx > 0) {
        setSelectedImage(parsedImages[idx - 1]);
      } else if (e.key === 'ArrowRight' && idx < parsedImages.length - 1) {
        setSelectedImage(parsedImages[idx + 1]);
      } else if (e.key === 'Escape') {
        setFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreen, selectedImage, parsedImages]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Link
        href="/catalog"
        className="inline-flex items-center text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Назад к каталогу
      </Link>

      <h1 className="text-3xl font-bold">{item.title}</h1>

      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden cursor-pointer mb-4">
          {selectedImage && (
            <Image
              src={selectedImage}
              alt="Изображение"
              fill
              style={{ objectFit: 'cover' }}
              className="rounded-xl"
              onClick={() => setFullscreen(true)}
            />
          )}
        </div>

        {parsedImages.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {parsedImages.map((url: string, idx: number) => (
              <div
                key={idx}
                onClick={() => setSelectedImage(url)}
                className={`cursor-pointer rounded-md overflow-hidden border ${
                  selectedImage === url ? 'border-blue-500' : 'border-gray-300'
                }`}
              >
                <img
                  src={url}
                  alt={`img-${idx}`}
                  className="object-cover aspect-square w-full"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-gray-600 text-sm">{item.city}</p>
        <p className="text-gray-700 whitespace-pre-line">{item.description}</p>
      </div>

      <div>
        <h2 className="font-semibold">Категория</h2>
        <p className="text-sm text-muted-foreground">{categoryLabel}</p>
      </div>

      <div>
        <h2 className="font-semibold">Желаемые категории обмена</h2>
        <ul className="list-disc ml-4 mt-1">
          {parsedCategories.map((cat: string, index: number) => (
            <li key={index}>
              {item.type === ItemType.THING
                ? ThingCategoryLabels[cat as keyof typeof ThingCategoryLabels]
                : ServiceCategoryLabels[cat as keyof typeof ServiceCategoryLabels]}
            </li>
          ))}
        </ul>
      </div>

      {item.acceptsAnything && (
        <div className="text-sm text-muted-foreground italic">
          Рассмотрю любые варианты
        </div>
      )}

      {fullscreen && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30">
          <img
            src={selectedImage}
            alt="Fullscreen"
            className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-lg border"
          />
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 bg-white border px-3 py-1 rounded-md shadow-md hover:bg-gray-100 text-sm"
          >
            Закрыть
          </button>
        </div>
      )}
    </div>
  );
}
