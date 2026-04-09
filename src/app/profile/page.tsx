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
  let stats = {
    activeItems: 0,
    inDealItems: 0,
    archivedItems: 0,
    activeSwaps: 0,
    completedSwaps: 0,
    cancelledSwaps: 0,
    chatsCount: 0,
    unreadChats: 0,
  };
  let latestItems: { id: string; title: string; status: string; createdAt: Date }[] = [];
  let latestSwaps: { id: string; status: string; updatedAt: Date }[] = [];
  let latestChatPreviews: {
    id: string;
    label: string;
    preview: string;
    href: string;
    updatedAt: Date;
    unreadCount: number;
  }[] = [];
  let activityHistory: { id: string; text: string; href: string; at: Date }[] = [];

  try {
    const foundUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, name: true, email: true, city: true },
    });
    user = foundUser;
    if (!foundUser?.id) {
      throw new Error('Пользователь не найден');
    }

    const userId = foundUser.id;

    const [
      activeItems,
      inDealItems,
      archivedItems,
      activeSwaps,
      completedSwaps,
      cancelledSwaps,
      itemThreadsCount,
      swapChatsCount,
      unreadSwapMessages,
      unreadItemMessages,
      recentItems,
      recentSwaps,
      recentItemThreads,
      recentSwapChats,
    ] = await Promise.all([
      prisma.item.count({ where: { userId, status: 'ACTIVE' } }),
      prisma.item.count({ where: { userId, status: 'IN_DEAL' } }),
      prisma.item.count({ where: { userId, status: 'ARCHIVED' } }),
      prisma.swapRequest.count({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
          status: { in: ['PENDING', 'ACCEPTED'] },
        },
      }),
      prisma.swapRequest.count({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
          status: 'COMPLETED',
        },
      }),
      prisma.swapRequest.count({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
          status: 'CANCELLED',
        },
      }),
      prisma.itemThread.count({
        where: {
          OR: [{ buyerUserId: userId }, { sellerUserId: userId }],
        },
      }),
      prisma.swapRequest.count({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
          status: { in: ['ACCEPTED', 'COMPLETED', 'CANCELLED'] },
        },
      }),
      prisma.message.count({
        where: {
          swapRequest: {
            OR: [{ senderId: userId }, { receiverId: userId }],
          },
          senderId: { not: userId },
          isRead: false,
        },
      }),
      prisma.itemMessage.count({
        where: {
          thread: {
            OR: [{ buyerUserId: userId }, { sellerUserId: userId }],
          },
          senderUserId: { not: userId },
          isRead: false,
        },
      }),
      prisma.item.findMany({
        where: { userId },
        select: { id: true, title: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.swapRequest.findMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
        select: { id: true, status: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 3,
      }),
      prisma.itemThread.findMany({
        where: { OR: [{ buyerUserId: userId }, { sellerUserId: userId }] },
        select: {
          id: true,
          itemId: true,
          item: { select: { title: true } },
          createdAt: true,
          messages: {
            select: { createdAt: true, text: true, senderUserId: true, isRead: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 2,
      }),
      prisma.swapRequest.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
          status: { in: ['ACCEPTED', 'COMPLETED', 'CANCELLED'] },
        },
        select: {
          id: true,
          status: true,
          updatedAt: true,
          messages: {
            select: { createdAt: true, text: true, senderId: true, isRead: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 2,
      }),
    ]);

    stats = {
      activeItems,
      inDealItems,
      archivedItems,
      activeSwaps,
      completedSwaps,
      cancelledSwaps,
      chatsCount: itemThreadsCount + swapChatsCount,
      unreadChats: unreadSwapMessages + unreadItemMessages,
    };
    latestItems = recentItems;
    latestSwaps = recentSwaps;
    latestChatPreviews = [
      ...recentSwapChats.map((swap) => ({
        id: `swap-${swap.id}`,
        label: `Обмен #${swap.id.slice(-6)} (${swap.status})`,
        preview: swap.messages[0]?.text || 'Откройте обмен, чтобы продолжить диалог.',
        href: `/exchange?swap=${swap.id}`,
        updatedAt: swap.messages[0]?.createdAt ?? swap.updatedAt,
        unreadCount: swap.messages[0] && swap.messages[0].senderId !== userId && !swap.messages[0].isRead ? 1 : 0,
      })),
      ...recentItemThreads.map((thread) => ({
        id: `item-${thread.id}`,
        label: `По объявлению: ${thread.item.title}`,
        preview: thread.messages[0]?.text || 'Откройте объявление, чтобы продолжить диалог.',
        href: `/item/${thread.itemId}?from=profile-chats&thread=${thread.id}`,
        updatedAt: thread.messages[0]?.createdAt ?? thread.createdAt,
        unreadCount:
          thread.messages[0] &&
          thread.messages[0].senderUserId !== userId &&
          !thread.messages[0].isRead
            ? 1
            : 0,
      })),
    ]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 3);
    activityHistory = [
      ...recentSwaps.map((swap) => ({
        id: `act-swap-${swap.id}`,
        text:
          swap.status === 'COMPLETED'
            ? `Сделка #${swap.id.slice(-6)} завершена`
            : swap.status === 'CANCELLED'
              ? `Сделка #${swap.id.slice(-6)} отменена`
              : `Сделка #${swap.id.slice(-6)} активна`,
        href: `/exchange?swap=${swap.id}`,
        at: swap.updatedAt,
      })),
      ...latestChatPreviews.map((chat) => ({
        id: `act-chat-${chat.id}`,
        text: `Новая активность в чате: ${chat.label}`,
        href: chat.href,
        at: chat.updatedAt,
      })),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 3);
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GlassCard className="p-4">
            <p className="text-xs text-muted-foreground">Активные объявления</p>
            <p className="mt-1 text-2xl font-semibold">{stats.activeItems}</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-xs text-muted-foreground">Активные обмены</p>
            <p className="mt-1 text-2xl font-semibold">{stats.activeSwaps}</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-xs text-muted-foreground">Завершённые обмены</p>
            <p className="mt-1 text-2xl font-semibold">{stats.completedSwaps}</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-xs text-muted-foreground">Чаты</p>
            <p className="mt-1 text-2xl font-semibold">{stats.chatsCount}</p>
            {stats.unreadChats > 0 && (
              <p className="mt-1 text-xs text-menarium-purple">Непрочитанные: {stats.unreadChats}</p>
            )}
          </GlassCard>
        </div>

        {/* Ссылки на разделы */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
              <p className="text-sm text-muted-foreground">
                Активные: {stats.activeSwaps}, завершённые: {stats.completedSwaps}, отменённые: {stats.cancelledSwaps}
              </p>
            </GlassCard>
          </Link>

          <Link href="/profile/chats">
            <GlassCard
              variant="hover"
              className="h-full rounded-2xl p-6 transition-transform hover:-translate-y-0.5"
            >
              <h2 className="mb-1 text-lg font-semibold">Мои чаты</h2>
              <p className="text-sm text-muted-foreground">
                Диалоги: {stats.chatsCount} · Новые: {stats.unreadChats}
              </p>
            </GlassCard>
          </Link>

          <Link href="/exchange">
            <GlassCard
              variant="hover"
              className="h-full rounded-2xl p-6 transition-transform hover:-translate-y-0.5"
            >
              <h2 className="mb-1 text-lg font-semibold">История</h2>
              <p className="text-sm text-muted-foreground">Последние статусы обменов и активности</p>
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <GlassCard className="p-5">
            <h3 className="mb-3 text-base font-semibold">Мои объявления</h3>
            {latestItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Объявлений пока нет.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {latestItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2">
                    <Link href={`/item/${item.id}?from=my-items`} className="truncate text-brand-blue hover:text-brand-blue-light">
                      {item.title}
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground">{item.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="mb-3 text-base font-semibold">Мои обмены</h3>
            {latestSwaps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Обменов пока нет.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {latestSwaps.map((swap) => (
                  <li key={swap.id} className="flex items-center justify-between gap-2">
                    <Link href={`/exchange?swap=${swap.id}`} className="text-brand-blue hover:text-brand-blue-light">
                      Обмен #{swap.id.slice(-6)}
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground">{swap.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="mb-3 text-base font-semibold">Мои чаты</h3>
            {latestChatPreviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">Диалогов пока нет.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {latestChatPreviews.map((chat) => (
                  <li key={chat.id}>
                    <Link href={chat.href} className="block rounded-lg border border-border/60 px-3 py-2 hover:border-menarium-purple/40">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-brand-blue hover:text-brand-blue-light">{chat.label}</p>
                        {chat.unreadCount > 0 && (
                          <span className="rounded-full bg-menarium-purple/20 px-2 py-0.5 text-[11px] text-menarium-purple">
                            Новое
                          </span>
                        )}
                      </div>
                      <p className={`mt-1 line-clamp-1 text-xs ${chat.unreadCount > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                        {chat.preview}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <LinkButton href="/profile/chats" variant="secondary" className="w-full justify-center">
                Перейти в чаты
              </LinkButton>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="mb-3 text-base font-semibold">История</h3>
            {activityHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Пока нет активности.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {activityHistory.map((event) => (
                  <li key={event.id}>
                    <Link href={event.href} className="text-brand-blue hover:text-brand-blue-light">
                      {event.text}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
