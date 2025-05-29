import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Каталог | Менариум',
  description: 'Каталог вещей и услуг для обмена',
};

export default function CatalogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Каталог</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Здесь будет контент каталога */}
      </div>
    </div>
  );
} 