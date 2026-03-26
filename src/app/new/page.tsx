'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { ItemType, ThingCategory, ServiceCategory } from '@/types';
import {
  ThingCategoryLabels,
  ServiceCategoryLabels,
} from '@/lib/category-labels';

import ImageUpload from '@/components/ImageUpload';

export default function NewItemPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [type, setType] = useState<ItemType>(ItemType.THING);
  const [category, setCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const categories = type === ItemType.THING ? ThingCategory : ServiceCategory;
  const categoryLabels =
    type === ItemType.THING ? ThingCategoryLabels : ServiceCategoryLabels;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (imageLoading) {
      alert('Дождитесь завершения загрузки изображений.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const data = {
      title: formData.get('title'),
      type,
      category,
      description: formData.get('description'),
      city: formData.get('city'),
      isOnline: formData.get('isOnline') === 'true',
      acceptsAnything: formData.get('acceptsAnything') === 'true',
      desiredCategories: formData.getAll('desiredCategories'),
      images: images,
    };

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log('📦 API result:', result);

      if (!response.ok || !result?.id) {
        setError('Ошибка при создании объявления. Попробуйте ещё раз.');
        return;
      }

      router.push(`/item/${result.id}`);
    } catch (err) {
      console.error('💥 Ошибка при отправке:', err);
      setError('Произошла ошибка. Проверьте соединение или повторите позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Создать объявление</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-sm text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>Тип</Label>
          <RadioGroup
            defaultValue={type}
            onValueChange={(value: ItemType) => setType(value)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={ItemType.THING} id="thing" />
              <Label htmlFor="thing">Вещь</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={ItemType.SERVICE} id="service" />
              <Label htmlFor="service">Услуга</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Заголовок</Label>
          <Input id="title" name="title" required />
        </div>

        <div className="space-y-2">
          <Label>Категория</Label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger>
              <SelectValue placeholder="Выберите категорию" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categories).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {categoryLabels[value as keyof typeof categoryLabels]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Описание</Label>
          <Textarea id="description" name="description" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Город</Label>
          <Input id="city" name="city" required />
        </div>

        {type === ItemType.SERVICE && (
          <div className="flex items-center space-x-2">
            <Checkbox id="isOnline" name="isOnline" value="true" />
            <Label htmlFor="isOnline">Можно оказать дистанционно</Label>
          </div>
        )}

        <div className="space-y-2">
          <ImageUpload
            value={images}
            onChange={setImages}
            setLoading={setImageLoading}
          />
          {imageLoading && (
            <p className="text-sm text-gray-500">Загрузка изображений...</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="acceptsAnything" name="acceptsAnything" value="true" />
          <Label htmlFor="acceptsAnything">Рассмотрю любые варианты</Label>
        </div>

        <Button type="submit" disabled={isLoading || imageLoading}>
          {isLoading ? 'Создание...' : 'Создать объявление'}
        </Button>
      </form>
    </div>
  );
}
