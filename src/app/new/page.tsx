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
  const [images, setImages] = useState<File[]>([]);

  const categories = type === ItemType.THING ? ThingCategory : ServiceCategory;
  const categoryLabels =
    type === ItemType.THING ? ThingCategoryLabels : ServiceCategoryLabels;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

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
      images: [], // заглушка — загружаем позже
    };

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create item');

      const result = await response.json();
      router.push(`/item/${result.id}`);
    } catch (error) {
      console.error('Error creating item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Создать объявление</h1>
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
          <Label>Желаемые категории обмена</Label>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(categories).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${key}`}
                  name="desiredCategories"
                  value={value}
                />
                <Label htmlFor={`category-${key}`}>
                  {categoryLabels[value as keyof typeof categoryLabels]}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Изображения</Label>
          <ImageUpload onChange={setImages} />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="acceptsAnything" name="acceptsAnything" value="true" />
          <Label htmlFor="acceptsAnything">Рассмотрю любые варианты</Label>
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Создание...' : 'Создать объявление'}
        </Button>
      </form>
    </div>
  );
}
