import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Обмен | Менариум',
  description: 'Создание нового обмена',
};

export default function ExchangePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Создание обмена</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {/* Форма создания обмена */}
        </div>
        <div>
          {/* Предпросмотр обмена */}
        </div>
      </div>
    </div>
  );
} 