'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Item } from '@prisma/client';
import ImageUpload from '@/components/ImageUpload';
import { ThingCategoryLabels, ServiceCategoryLabels } from '@/lib/category-labels';
import { Button, Input } from '@/components/menarium';
import { ItemFormLayout } from '@/components/forms/ItemFormLayout';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EditItemFormProps {
  initialData: Item;
}

export default function EditItemForm({ initialData }: EditItemFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [city, setCity] = useState(initialData.city || '');
  const [type, setType] = useState<string>(initialData.type);
  const [category, setCategory] = useState(initialData.category || '');
  const [images, setImages] = useState<string[]>(initialData.images ? JSON.parse(initialData.images) : []);
  const [desiredCategories, setDesiredCategories] = useState<string[]>(
    initialData.desiredCategories ? JSON.parse(initialData.desiredCategories) : []
  );
  const [acceptsAnything, setAcceptsAnything] = useState(initialData.acceptsAnything || false);

  const handleCategoryToggle = (value: string) => {
    setDesiredCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/items/${initialData.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        city,
        type,
        category,
        images: JSON.stringify(images),
        desiredCategories: JSON.stringify(desiredCategories),
        acceptsAnything,
      }),
    });

    if (res.ok) {
      router.push(`/item/${initialData.id}`);
      return;
    }

    let message = 'Не удалось сохранить объявление.';
    try {
      const data = await res.json();
      if (data?.error && typeof data.error === 'string') {
        message = data.error;
      }
    } catch {
      /* ignore */
    }
    alert(message);
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/items/${initialData.id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      router.push('/profile/my-items');
    } else {
      const data = await res.json();
      alert('Ошибка при удалении: ' + data.error);
    }
  };

  const categories = type === 'THING'
    ? Object.entries(ThingCategoryLabels)
    : Object.entries(ServiceCategoryLabels);

  const exchangeOptions = [
    'Электроника', 'Мебель', 'Детские товары', 'Спорт', 'Животные',
    'Одежда', 'Инструменты', 'Книги', 'Авто'
  ];

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
      <ItemFormLayout
        topSlot={
          <h1 className="text-3xl font-bold tracking-tight">Редактировать объявление</h1>
        }
        typeCategorySection={
          <>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Тип</Label>
              <select
                id="edit-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-10 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground backdrop-blur-xl outline-none focus:ring-2 focus:ring-menarium-purple/40"
              >
                <option value="THING">Вещь</option>
                <option value="SERVICE">Услуга</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Категория</Label>
              <select
                id="edit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground backdrop-blur-xl outline-none focus:ring-2 focus:ring-menarium-purple/40"
              >
                {categories.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </>
        }
        titleField={
          <Input
            type="text"
            label="Заголовок"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        }
        descriptionField={
          <div className="space-y-2">
            <Label htmlFor="edit-description">Описание</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] rounded-2xl border-white/10 bg-white/5 text-sm text-foreground backdrop-blur-xl focus-visible:ring-menarium-purple/40"
            />
          </div>
        }
        cityField={
          <Input
            type="text"
            label="Город"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        }
        secondaryCardChildren={
          <>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <Checkbox
                checked={acceptsAnything}
                onCheckedChange={(checked) => setAcceptsAnything(!!checked)}
              />
              <span className="text-sm text-muted-foreground">Рассмотрю любые варианты</span>
            </div>

            <div>
              <p className="mb-2 font-semibold">Желаемые категории обмена</p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {exchangeOptions.map((label) => (
                  <label
                    key={label}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={desiredCategories.includes(label)}
                      onChange={() => handleCategoryToggle(label)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <ImageUpload value={images} onChange={setImages} />

            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="primary" size="sm">
                Сохранить
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={handleDelete}>
                Удалить
              </Button>
            </div>
          </>
        }
      />
    </form>
  );
}
