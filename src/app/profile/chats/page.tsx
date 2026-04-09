import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EmptyState } from '@/components/ui/empty-state';
import { GlassCard, LinkButton } from '@/components/menarium';

type SwapChatRow = {
  id: string;
  counterpartName: string;
  itemTitle: string;
  status: string;
  lastMessageText: string | null;
  lastMessageAt: Date;
  unreadCount: number;
};

type ItemChatRow = {
  id: string;
  itemId: string;
  counterpartName: string;
  itemTitle: string;
  lastMessageText: string | null;
  lastMessageAt: Date;
  unreadCount: number;
};

type UnifiedChatRow = {
  id: string;
  title: string;
  subtitle: string;
  lastMessageText: string | null;
  lastMessageAt: Date;
  href: string;
  unreadCount: number;
};

const formatDateTime = (value: Date) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);

export default async function ProfileChatsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <EmptyState
          title="Необходима авторизация"
          description="Войдите, чтобы открыть ваши чаты."
          actionLabel="Войти"
          actionHref="/auth/login"
        />
      </div>
    );
  }

  const userId = session.user.id;

  const [swapChatsRaw, itemChatsRaw] = await Promise.all([
    prisma.swapRequest.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        status: { in: ['ACCEPTED', 'COMPLETED', 'CANCELLED'] },
      },
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
        senderItem: { select: { title: true } },
        receiverItem: { select: { title: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { text: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    }),
    prisma.itemThread.findMany({
      where: {
        OR: [{ buyerUserId: userId }, { sellerUserId: userId }],
      },
      include: {
        item: { select: { id: true, title: true } },
        buyerUser: { select: { name: true, email: true } },
        sellerUser: { select: { name: true, email: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { text: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  const swapUnreadById = new Map<string, number>();
  const itemUnreadById = new Map<string, number>();

  if (swapChatsRaw.length > 0) {
    const unreadSwap = await prisma.message.groupBy({
      by: ['swapRequestId'],
      where: {
        swapRequestId: { in: swapChatsRaw.map((s) => s.id) },
        senderId: { not: userId },
        isRead: false,
      },
      _count: { _all: true },
    });
    for (const row of unreadSwap) {
      swapUnreadById.set(row.swapRequestId, row._count._all);
    }
  }

  if (itemChatsRaw.length > 0) {
    const unreadItem = await prisma.itemMessage.groupBy({
      by: ['threadId'],
      where: {
        threadId: { in: itemChatsRaw.map((t) => t.id) },
        senderUserId: { not: userId },
        isRead: false,
      },
      _count: { _all: true },
    });
    for (const row of unreadItem) {
      itemUnreadById.set(row.threadId, row._count._all);
    }
  }

  const swapChats: SwapChatRow[] = swapChatsRaw.map((swap) => {
    const counterpart = swap.senderId === userId ? swap.receiver : swap.sender;
    const itemTitle = swap.senderId === userId ? swap.receiverItem?.title : swap.senderItem?.title;
    const lastMessage = swap.messages[0];
    return {
      id: swap.id,
      counterpartName: counterpart?.name || counterpart?.email || 'Пользователь',
      itemTitle: itemTitle || 'Объявление',
      status: swap.status,
      lastMessageText: lastMessage?.text ?? null,
      lastMessageAt: lastMessage?.createdAt ?? swap.updatedAt,
      unreadCount: swapUnreadById.get(swap.id) ?? 0,
    };
  });

  const itemChats: ItemChatRow[] = itemChatsRaw.map((thread) => {
    const counterpart = thread.buyerUserId === userId ? thread.sellerUser : thread.buyerUser;
    const lastMessage = thread.messages[0];
    return {
      id: thread.id,
      itemId: thread.itemId,
      counterpartName: counterpart?.name || counterpart?.email || 'Пользователь',
      itemTitle: thread.item?.title || 'Объявление',
      lastMessageText: lastMessage?.text ?? null,
      lastMessageAt: lastMessage?.createdAt ?? thread.createdAt,
      unreadCount: itemUnreadById.get(thread.id) ?? 0,
    };
  });

  const unifiedChats: UnifiedChatRow[] = [
    ...swapChats.map((chat) => ({
      id: `swap-${chat.id}`,
      title: chat.counterpartName,
      subtitle: `Обмен · ${chat.itemTitle}`,
      lastMessageText: chat.lastMessageText,
      lastMessageAt: chat.lastMessageAt,
      href: `/exchange?swap=${chat.id}`,
      unreadCount: chat.unreadCount,
    })),
    ...itemChats.map((chat) => ({
      id: `item-${chat.id}`,
      title: chat.counterpartName,
      subtitle: `Объявление · ${chat.itemTitle}`,
      lastMessageText: chat.lastMessageText,
      lastMessageAt: chat.lastMessageAt,
      href: `/item/${chat.itemId}?from=profile-chats&thread=${chat.id}`,
      unreadCount: chat.unreadCount,
    })),
  ].sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

  return (
    <div className="container mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Мои чаты</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Все диалоги по обменам и объявлениям в одном месте.
          </p>
        </div>
        <LinkButton href="/profile" variant="secondary">
          В профиль
        </LinkButton>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Все чаты</h2>
            <span className="text-xs text-muted-foreground">{unifiedChats.length}</span>
          </div>
          {unifiedChats.length === 0 ? (
            <EmptyState
              title="Чатов пока нет"
              description="Когда появятся диалоги, вы увидите их здесь по времени активности."
              actionLabel="Открыть каталог"
              actionHref="/catalog"
            />
          ) : (
            <ul className="space-y-3">
              {unifiedChats.map((chat) => (
                <li key={chat.id}>
                  <Link
                    href={chat.href}
                    className="block rounded-xl border border-border/60 bg-background/40 p-4 transition-colors hover:border-menarium-blue/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{chat.title}</p>
                        {chat.unreadCount > 0 && (
                          <span className="rounded-full bg-menarium-purple/20 px-2 py-0.5 text-[11px] font-medium text-menarium-purple">
                            Новое {chat.unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDateTime(chat.lastMessageAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{chat.subtitle}</p>
                    <p
                      className={`mt-2 line-clamp-2 text-sm ${chat.unreadCount > 0 ? 'font-semibold text-foreground' : 'text-foreground/90'}`}
                    >
                      {chat.lastMessageText || 'Сообщений пока нет. Откройте диалог, чтобы продолжить общение.'}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Чаты по обменам</h2>
            <span className="text-xs text-muted-foreground">{swapChats.length}</span>
          </div>
          {swapChats.length === 0 ? (
            <EmptyState
              title="Пока нет чатов по обменам"
              description="Как только сделка перейдёт в активный статус, чат появится здесь."
              actionLabel="Перейти к обменам"
              actionHref="/exchange"
            />
          ) : (
            <ul className="space-y-3">
              {swapChats.map((chat) => (
                <li key={chat.id}>
                  <Link
                    href={`/exchange?swap=${chat.id}`}
                    className="block rounded-xl border border-border/60 bg-background/40 p-4 transition-colors hover:border-menarium-purple/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{chat.counterpartName}</p>
                        {chat.unreadCount > 0 && (
                          <span className="rounded-full bg-menarium-purple/20 px-2 py-0.5 text-[11px] font-medium text-menarium-purple">
                            Новое {chat.unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDateTime(chat.lastMessageAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      По объявлению: {chat.itemTitle} · {chat.status}
                    </p>
                    <p
                      className={`mt-2 line-clamp-2 text-sm ${chat.unreadCount > 0 ? 'font-semibold text-foreground' : 'text-foreground/90'}`}
                    >
                      {chat.lastMessageText || 'Сообщений пока нет. Откройте обмен, чтобы продолжить диалог.'}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Чаты по объявлениям</h2>
            <span className="text-xs text-muted-foreground">{itemChats.length}</span>
          </div>
          {itemChats.length === 0 ? (
            <EmptyState
              title="Пока нет чатов по объявлениям"
              description="Напишите по интересующему объявлению, чтобы начать диалог."
              actionLabel="Открыть каталог"
              actionHref="/catalog"
            />
          ) : (
            <ul className="space-y-3">
              {itemChats.map((chat) => (
                <li key={chat.id}>
                  <Link
                    href={`/item/${chat.itemId}?from=profile-chats&thread=${chat.id}`}
                    className="block rounded-xl border border-border/60 bg-background/40 p-4 transition-colors hover:border-menarium-blue/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{chat.counterpartName}</p>
                        {chat.unreadCount > 0 && (
                          <span className="rounded-full bg-menarium-purple/20 px-2 py-0.5 text-[11px] font-medium text-menarium-purple">
                            Новое {chat.unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDateTime(chat.lastMessageAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">По объявлению: {chat.itemTitle}</p>
                    <p
                      className={`mt-2 line-clamp-2 text-sm ${chat.unreadCount > 0 ? 'font-semibold text-foreground' : 'text-foreground/90'}`}
                    >
                      {chat.lastMessageText || 'Сообщений пока нет. Откройте объявление, чтобы продолжить диалог.'}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
