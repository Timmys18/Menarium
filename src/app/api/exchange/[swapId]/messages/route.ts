import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkMessageRateLimit, recordMessageSent } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';
import { actionResponse, errorResponse, getPaging, listResponse } from '@/lib/api-response';

export async function GET(req: NextRequest, context: { params: { swapId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return errorResponse('Необходимо войти в систему.', 401);
  }

  const swapId = context.params.swapId;
  const swap = await prisma.swapRequest.findUnique({ where: { id: swapId } });
  if (!swap) return errorResponse('Обмен не найден.', 404);

  const isParticipant = swap.senderId === session.user.id || swap.receiverId === session.user.id;
  if (!isParticipant) return errorResponse('Нет доступа к этому чату.', 403);

  if (swap.status === 'PENDING' || swap.status === 'DECLINED' || swap.status === 'REJECTED') {
    return errorResponse('Чат доступен только после принятия обмена.', 403);
  }

  const { limit, offset } = getPaging(req);
  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { swapRequestId: swapId },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: limit,
    }),
    prisma.message.count({ where: { swapRequestId: swapId } }),
  ]);

  if (swap.status === 'COMPLETED') {
    return listResponse(messages, { limit, offset }, total, { messages, chatClosed: true });
  }

  return listResponse(messages, { limit, offset }, total, { messages });
}

export async function POST(req: NextRequest, context: { params: { swapId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return errorResponse('Необходимо войти в систему.', 401);
  }

  const rate = checkMessageRateLimit(session.user.id);
  if (!rate.ok) {
    return NextResponse.json({ error: rate.message, retryAfterSec: rate.retryAfterSec }, { status: 429 });
  }

  try {
    const swapId = context.params.swapId;
    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) {
      return errorResponse('Текст сообщения не может быть пустым.', 400);
    }

    const swap = await prisma.swapRequest.findUnique({ where: { id: swapId } });
    if (!swap) return errorResponse('Обмен не найден.', 404);

    const isParticipant = swap.senderId === session.user.id || swap.receiverId === session.user.id;
    if (!isParticipant) return errorResponse('Нет доступа к этому чату.', 403);

    if (swap.status === 'PENDING' || swap.status === 'DECLINED' || swap.status === 'REJECTED') {
      return errorResponse('Чат доступен только после принятия обмена.', 403);
    }

    if (swap.status === 'COMPLETED') {
      return errorResponse('Обмен завершён. Чат закрыт.', 409);
    }

    const message = await prisma.message.create({
      data: {
        swapRequestId: swapId,
        senderId: session.user.id,
        text,
      },
    });

    recordMessageSent(session.user.id);

    const recipientId = session.user.id === swap.senderId ? swap.receiverId : swap.senderId;
    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'MESSAGE_RECEIVED',
        title: 'Новое сообщение в чате обмена',
        message: 'Вам написали в чате по обмену.',
        href: `/exchange?swap=${swapId}`,
        entityType: 'SwapRequest',
        entityId: swapId,
      },
    });

    return actionResponse(message, message);
  } catch (error) {
    logError('exchange.messages.post', 'Ошибка отправки сообщения', error);
    return errorResponse('Не удалось отправить сообщение.', 500);
  }
}

