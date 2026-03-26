import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { checkActionRateLimit, recordActionRequest } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';
import { actionResponse, errorResponse, getPaging, listResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return errorResponse('Необходимо войти в систему.', 401);

  const { limit, offset } = getPaging(req);

  const where = { userId: session.user.id };
  const [notifications, unreadCount, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.notification.count({ where: { userId: session.user.id, isRead: false } }),
    prisma.notification.count({ where }),
  ]);

  return listResponse(notifications, { limit, offset }, total, { notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return errorResponse('Необходимо войти в систему.', 401);

  const rate = checkActionRateLimit(session.user.id, 'notifications:patch', 2200);
  if (!rate.ok) return errorResponse(rate.message, 429);
  recordActionRequest(session.user.id, 'notifications:patch');

  try {
    const body = await req.json().catch(() => ({}));
    if (body.readAll === true) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      });
      return actionResponse({ success: true }, { success: true });
    }

    const { id } = body;
    if (!id || typeof id !== 'string') {
      return errorResponse('Укажите id уведомления или readAll: true', 400);
    }

    const notification = await prisma.notification.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!notification) return errorResponse('Уведомление не найдено', 404);

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return actionResponse({ success: true }, { success: true });
  } catch (error) {
    logError('notifications.patch', 'Ошибка обновления уведомления', error);
    return errorResponse('Не удалось обновить уведомление', 500);
  }
}

