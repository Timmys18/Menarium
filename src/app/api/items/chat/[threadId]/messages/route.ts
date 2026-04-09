import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkMessageRateLimit, recordMessageSent } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';
import { actionResponse, errorResponse, getPaging, listResponse } from '@/lib/api-response';

export async function GET(req: NextRequest, context: { params: { threadId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return errorResponse('Необходимо войти в систему.', 401);
  }

  const { limit, offset } = getPaging(req);
  const threadId = context.params.threadId;
  const thread = await prisma.itemThread.findUnique({ where: { id: threadId } });
  if (!thread) return errorResponse('Чат не найден.', 404);

  const isParticipant = thread.buyerUserId === session.user.id || thread.sellerUserId === session.user.id;
  if (!isParticipant) return errorResponse('Нет доступа к этому чату.', 403);
  const readUntil = new Date();

  await prisma.itemMessage.updateMany({
    where: {
      threadId,
      senderUserId: { not: session.user.id },
      isRead: false,
      createdAt: { lte: readUntil },
    },
    data: { isRead: true },
  });

  const [messages, total] = await Promise.all([
    prisma.itemMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: limit,
    }),
    prisma.itemMessage.count({ where: { threadId } }),
  ]);

  return listResponse(messages, { limit, offset }, total, { messages });
}

export async function POST(req: NextRequest, context: { params: { threadId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return errorResponse('Необходимо войти в систему.', 401);
  }

  const rate = checkMessageRateLimit(session.user.id);
  if (!rate.ok) {
    return NextResponse.json(
      { error: rate.message, retryAfterSec: rate.retryAfterSec },
      { status: 429 },
    );
  }

  try {
    const threadId = context.params.threadId;
    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return errorResponse('Текст сообщения не может быть пустым.', 400);
    }

    const thread = await prisma.itemThread.findUnique({
      where: { id: threadId },
      include: { item: true },
    });
    if (!thread) return errorResponse('Чат не найден.', 404);

    const isParticipant = thread.buyerUserId === session.user.id || thread.sellerUserId === session.user.id;
    if (!isParticipant) return errorResponse('Нет доступа к этому чату.', 403);

    const recipientId = session.user.id === thread.buyerUserId ? thread.sellerUserId : thread.buyerUserId;

    const message = await prisma.itemMessage.create({
      data: {
        threadId,
        senderUserId: session.user.id,
        text,
        isRead: false,
      },
    });

    recordMessageSent(session.user.id);

    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'ITEM_MESSAGE_RECEIVED',
        title: 'Новое сообщение',
        message: `Вам написали в чате по объявлению «${thread.item?.title ?? 'Объявление'}».`,
        href: `/item/${thread.itemId}`,
        entityType: 'ItemThread',
        entityId: threadId,
      },
    });

    return actionResponse(message, message);
  } catch (error) {
    logError('items.chat.post', 'Ошибка отправки сообщения', error);
    return errorResponse('Не удалось отправить сообщение.', 500);
  }
}

