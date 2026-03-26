import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ItemCard from '@/components/ItemCard';
import { EmptyState } from '@/components/ui/empty-state';

export default async function MyItemsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <EmptyState
          title="Необходима авторизация"
          description="Войдите, чтобы видеть свои объявления."
          actionLabel="Войти"
          actionHref="/auth/login"
        />
      </div>
    );
  }

  let items: any[] = [];
  let error: string | null = null;

  try {
    items = await prisma.item.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch {
    error = 'Не удалось загрузить данные. Попробуйте обновить страницу.';
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">Мои объявления</h1>
      {error ? (
        <EmptyState
          title="Ошибка загрузки"
          description={error}
          actionLabel="Обновить"
          actionHref="/my-items"
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="У вас пока нет объявлений"
          description="Создайте первое объявление, чтобы начать обмен."
          actionLabel="Создать объявление"
          actionHref="/new"
        />
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              currentUserId={session.user.id}
              from="my-items"
            />
          ))}
        </div>
      )}
    </div>
  );
}
