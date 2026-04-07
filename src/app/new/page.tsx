'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/menarium';
import { ItemFormLayout } from '@/components/forms/ItemFormLayout';
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
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Создать <span className="gradient-text-brand">объявление</span>
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Заполните данные и добавьте изображения для публикации карточки обмена
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <ItemFormLayout
          error={error}
          typeCategorySection={
            <>
              <div className="space-y-2">
                <Label>Тип</Label>
                <RadioGroup
                  defaultValue={type}
                  onValueChange={(value: ItemType) => setType(value)}
                  className="flex gap-6"
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
            </>
          }
          titleField={
            <div className="space-y-2">
              <Input id="title" name="title" label="Заголовок" required />
            </div>
          }
          descriptionField={
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                name="description"
                required
                className="min-h-[120px] rounded-2xl border-white/10 bg-white/5 text-sm text-foreground backdrop-blur-xl focus-visible:ring-menarium-purple/40"
              />
            </div>
          }
          cityField={
            <div className="space-y-2">
              <Input id="city" name="city" label="Город" required />
            </div>
          }
          afterCity={
            type === ItemType.SERVICE ? (
              <div className="flex items-center space-x-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <Checkbox id="isOnline" name="isOnline" value="true" />
                <Label htmlFor="isOnline">Можно оказать дистанционно</Label>
              </div>
            ) : undefined
          }
          secondaryCardChildren={
            <>
              <div className="space-y-2">
                <ImageUpload
                  value={images}
                  onChange={setImages}
                  setLoading={setImageLoading}
                />
                {imageLoading && (
                  <p className="text-sm text-muted-foreground">Загрузка изображений...</p>
                )}
              </div>

              <div className="flex items-center space-x-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <Checkbox id="acceptsAnything" name="acceptsAnything" value="true" />
                <Label htmlFor="acceptsAnything">Рассмотрю любые варианты</Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading || imageLoading}
                className="w-full justify-center sm:w-auto"
              >
                {isLoading ? 'Создание...' : 'Создать объявление'}
              </Button>
            </>
          }
        />
      </form>
    </div>
  );
}
