import Image from 'next/image';
import { notFound } from 'next/navigation';

import { ItemType } from '@/types';
import { ThingCategoryLabels, ServiceCategoryLabels } from '@/lib/category-labels';

interface PageProps {
  params: {
    id: string;
  };
}

async function getItem(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const res = await fetch(`${baseUrl}/api/items/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) return null;
  return res.json();
}

export default async function ItemPage({ params }: PageProps) {
  const item = await getItem(params.id);
  if (!item) return notFound();

  const desiredCategories: string[] = JSON.parse(item.desiredCategories || '[]');
  const images: string[] = JSON.parse(item.images || '[]');

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-6">
        <a href="/catalog" className="text-blue-600 hover:underline text-sm">
          ← Назад к каталогу
        </a>
      </div>

      <div className="flex flex-col md:flex-row gap-8 bg-white p-6 rounded-2xl shadow-md">
        {/* Основное изображение */}
        <div className="w-full md:w-1/2">
          {images.length > 0 ? (
            <div className="relative w-full aspect-square rounded-xl overflow-hidden border">
              <Image
                src={images[0]}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-sm text-gray-400">
              Нет изображения
            </div>
          )}

          {/* Галерея остальных фото */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {images.slice(1).map((url, index) => (
                <div key={index} className="relative w-full aspect-square rounded-lg overflow-hidden border">
                  <Image
                    src={url}
                    alt={`Фото ${index + 2}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Контент карточки */}
        <div className="w-full md:w-1/2 flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-4">{item.title}</h1>

            <p className="text-muted-foreground mb-2">
              <span className="font-medium text-black">Тип:</span>{' '}
              {item.type === ItemType.THING ? 'Вещь' : 'Услуга'}
            </p>

            <p className="text-muted-foreground mb-2">
              <span className="font-medium text-black">Категория:</span>{' '}
              {item.type === ItemType.THING
                ? ThingCategoryLabels[item.category as keyof typeof ThingCategoryLabels]
                : ServiceCategoryLabels[item.category as keyof typeof ServiceCategoryLabels]}
            </p>

            <p className="text-muted-foreground mb-2">
              <span className="font-medium text-black">Город:</span> {item.city}
            </p>

            <p className="text-muted-foreground mt-4 whitespace-pre-line">
              {item.description}
            </p>

            <div className="mt-6">
              <h2 className="font-semibold mb-2">Желаемые категории обмена:</h2>
              <ul className="list-disc ml-5 text-muted-foreground">
                {desiredCategories.map((cat, index) => (
                  <li key={index}>
                    {item.type === ItemType.THING
                      ? ThingCategoryLabels[cat as keyof typeof ThingCategoryLabels]
                      : ServiceCategoryLabels[cat as keyof typeof ServiceCategoryLabels]}
                  </li>
                ))}
              </ul>

              {item.acceptsAnything && (
                <div className="text-sm text-muted-foreground mt-2">
                  Рассмотрю любые варианты
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <button className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition">
              💬 Предложить обмен
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

]=
