// src/app/profile/page.tsx

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { GlassCard, IconContainer, LinkButton } from '@/components/menarium';
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
    <div className="min-h-screen bg-muted/20 px-6 py-10">
      {error && (
        <div className="mx-auto mb-6 max-w-4xl rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mx-auto max-w-5xl space-y-8">
        {/* Профиль */}
        <GlassCard className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <IconContainer variant="gradient" size="lg" className="rounded-full">
              <span className="text-xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'П'}
              </span>
            </IconContainer>
            <div className="space-y-1">
              <div className="text-xl font-semibold tracking-tight">{user?.name || user?.email}</div>
              <div className="text-sm text-muted-foreground">Город: {user?.city || 'Не указан'}</div>
              <div className="text-sm text-muted-foreground">Email: {user?.email || 'Не указан'}</div>
            </div>
          </div>
          <LinkButton href="/profile/edit" variant="secondary" className="sm:self-start">
            Редактировать профиль
          </LinkButton>
        </GlassCard>

        {/* Ссылки на разделы */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link href="/my-items">
            <GlassCard
              variant="hover"
              className="h-full rounded-2xl p-6 transition-transform hover:-translate-y-0.5"
            >
              <h2 className="mb-1 text-lg font-semibold">Мои объявления</h2>
              <p className="text-sm text-muted-foreground">Перейти к объявлениям</p>
            </GlassCard>
          </Link>

          <Link href="/exchange">
            <GlassCard
              variant="hover"
              className="h-full rounded-2xl p-6 transition-transform hover:-translate-y-0.5"
            >
              <h2 className="mb-1 text-lg font-semibold">Мои обмены</h2>
              <p className="text-sm text-muted-foreground">Активные заявки на обмен</p>
            </GlassCard>
          </Link>

          <Link href="/profile/chats">
            <GlassCard
              variant="hover"
              className="h-full rounded-2xl p-6 transition-transform hover:-translate-y-0.5"
            >
              <h2 className="mb-1 text-lg font-semibold">Мои чаты</h2>
              <p className="text-sm text-muted-foreground">Обсуждения по обменам</p>
            </GlassCard>
          </Link>

          <Link href="/profile/edit">
            <GlassCard
              variant="hover"
              className="h-full rounded-2xl p-6 transition-transform hover:-translate-y-0.5"
            >
              <h2 className="mb-1 text-lg font-semibold">Управление аккаунтом</h2>
              <p className="text-sm text-muted-foreground">Настройки профиля</p>
            </GlassCard>
          </Link>
        </div>
      </div>
    </div>
  );
}
