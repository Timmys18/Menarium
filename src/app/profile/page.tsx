// src/app/profile/page.tsx

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <EmptyState
          title="Необходима авторизация"
          description="Войдите, чтобы просмотреть профиль."
          actionLabel="Войти"
          actionHref="/auth/login"
        />
      </div>
    );
  }

  let user: any = null;
  let error: string | null = null;

  try {
    user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });
  } catch {
    error = 'Не удалось загрузить данные. Попробуйте обновить страницу.';
  }

  return (
    <div className="min-h-screen bg-muted/30 px-6 py-10 space-y-8">
      {error && (
        <div className="max-w-4xl mx-auto text-destructive text-sm">
          {error}
        </div>
      )}
      {/* Профиль */}
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl bg-card border shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'П'}
            </div>
            <div>
              <div className="text-lg font-semibold">{user?.name || user?.email}</div>
              <div className="text-sm text-muted-foreground">📍 {user?.city || 'Не указан'}</div>
            </div>
          </div>
          <Link
            href="/profile/edit"
            className="text-sm font-medium text-primary hover:underline whitespace-nowrap"
          >
            Редактировать профиль
          </Link>
        </div>
      </div>

      {/* Ссылки на разделы */}
      <div className="max-w-4xl mx-auto space-y-4">
        <Link href="/my-items">
          <div className="rounded-xl bg-card border shadow-sm p-6 hover:bg-muted/50 transition">
            <h2 className="text-lg font-semibold mb-1">Мои объявления</h2>
            <p className="text-sm text-muted-foreground">Перейти к объявлениям</p>
          </div>
        </Link>

        <Link href="/exchange">
          <div className="rounded-xl bg-card border shadow-sm p-6 hover:bg-muted/50 transition">
            <h2 className="text-lg font-semibold mb-1">Мои обмены</h2>
            <p className="text-sm text-muted-foreground">Активные заявки на обмен</p>
          </div>
        </Link>

        <Link href="/profile/chats">
          <div className="rounded-xl bg-card border shadow-sm p-6 hover:bg-muted/50 transition">
            <h2 className="text-lg font-semibold mb-1">Мои чаты</h2>
            <p className="text-sm text-muted-foreground">Обсуждения по обменам</p>
          </div>
        </Link>

        <Link href="/profile/edit">
          <div className="rounded-xl bg-card border shadow-sm p-6 hover:bg-muted/50 transition">
            <h2 className="text-lg font-semibold mb-1">Управление аккаунтом</h2>
            <p className="text-sm text-muted-foreground">Настройки профиля</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
