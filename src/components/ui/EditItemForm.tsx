'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Item } from '@prisma/client';
import ImageUpload from '@/components/ImageUpload';
import { ThingCategoryLabels, ServiceCategoryLabels } from '@/lib/category-labels';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface EditItemFormProps {
  initialData: Item;
  onSubmit: (data: any) => void;
}

export default function EditItemForm({ initialData, onSubmit }: EditItemFormProps) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      city,
      type,
      category,
      images: JSON.stringify(images),
      desiredCategories: JSON.stringify(desiredCategories),
      acceptsAnything,
    });
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Редактировать объявление</h1>

      <input
        type="text"
        placeholder="Заголовок"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-4 py-2 border rounded bg-white text-black"
      />

      <textarea
        placeholder="Описание"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full px-4 py-2 border rounded bg-white text-black"
      />

      <input
        type="text"
        placeholder="Город"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="w-full px-4 py-2 border rounded bg-white text-black"
      />

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full px-4 py-2 border rounded bg-white text-black"
      >
        <option value="THING">Вещь</option>
        <option value="SERVICE">Услуга</option>
      </select>

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full px-4 py-2 border rounded bg-white text-black"
      >
        {categories.map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <Checkbox
          checked={acceptsAnything}
          onCheckedChange={(checked) => setAcceptsAnything(!!checked)}
        />
        <span className="text-sm text-muted-foreground">Рассмотрю любые варианты</span>
      </div>

      <div>
        <p className="font-semibold mb-2">Желаемые категории обмена</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {exchangeOptions.map((label) => (
            <label key={label} className="flex items-center gap-2 text-sm">
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

      <div className="flex gap-4">
        <Button type="submit">Сохранить</Button>
        <Button type="button" variant="destructive" onClick={handleDelete}>
          Удалить
        </Button>
      </div>
    </form>
  );
}
