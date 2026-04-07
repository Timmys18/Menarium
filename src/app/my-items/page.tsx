import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ItemCard from '@/components/ItemCard';
import { GlassCard } from '@/components/menarium';
import { EmptyState } from '@/components/ui/empty-state';

export default async function MyItemsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="container mx-auto max-w-6xl px-6 py-10">
        <GlassCard className="p-6 md:p-8">
          <EmptyState
            title="Необходима авторизация"
            description="Войдите, чтобы видеть свои объявления."
            actionLabel="Войти"
            actionHref="/auth/login"
          />
        </GlassCard>
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
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Мои <span className="gradient-text-brand">объявления</span>
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Управляйте своими активными карточками обмена
        </p>
      </div>
      {error ? (
        <GlassCard className="p-6 md:p-8">
          <EmptyState
            title="Ошибка загрузки"
            description={error}
            actionLabel="Обновить"
            actionHref="/my-items"
          />
        </GlassCard>
      ) : items.length === 0 ? (
        <GlassCard className="p-6 md:p-8">
          <EmptyState
            title="У вас пока нет объявлений"
            description="Создайте первое объявление, чтобы начать обмен."
            actionLabel="Создать объявление"
            actionHref="/new"
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
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
