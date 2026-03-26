import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { checkActionRateLimit, recordActionRequest } from '@/lib/rateLimit';
import { logError, logInfo } from '@/lib/logger';
import { actionResponse, errorResponse, getPaging, listResponse } from '@/lib/api-response';

// Получить обмены пользователя
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return errorResponse('Необходимо войти в систему.', 401);
  }
  try {
    const { limit, offset } = getPaging(req);
    const where = {
      OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
    };

    const [swaps, total] = await Promise.all([
      prisma.swapRequest.findMany({
        where,
        include: {
          senderItem: true,
          receiverItem: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.swapRequest.count({ where }),
    ]);

    return listResponse(swaps, { limit, offset }, total, { swaps, total });
  } catch (error) {
    logError('exchange.get', 'Ошибка получения обменов', error);
    return errorResponse('Ошибка получения обменов.', 500);
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return errorResponse('Необходимо войти в систему.', 401);
  }

  const rate = checkActionRateLimit(session.user.id, 'exchange:create', 2500);
  if (!rate.ok) {
    return errorResponse(rate.message, 429);
  }
  recordActionRequest(session.user.id, 'exchange:create');

  try {
    const { receiverItemId, senderItemId } = await req.json();

    const [senderItem, receiverItem] = await Promise.all([
      prisma.item.findUnique({ where: { id: senderItemId } }),
      prisma.item.findUnique({ where: { id: receiverItemId } }),
    ]);

    if (!senderItem || !receiverItem) {
      return NextResponse.json({ error: 'Объявление не найдено.' }, { status: 404 });
    }

    if (senderItem.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Вы не можете отправлять обмен от чужого объявления.' },
        { status: 403 },
      );
    }

    if (senderItem.userId === receiverItem.userId) {
      return NextResponse.json(
        { error: 'Нельзя обменивать объявление с самим собой.' },
        { status: 400 },
      );
    }

    if (senderItem.status !== 'ACTIVE' || receiverItem.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Нельзя создать обмен: объявление недоступно.' },
        { status: 409 },
      );
    }

    const existingSwap = await prisma.swapRequest.findFirst({
      where: {
        status: 'PENDING',
        OR: [
          { senderItemId, receiverItemId },
          { senderItemId: receiverItemId, receiverItemId: senderItemId },
        ],
      },
    });

    if (existingSwap) {
      return NextResponse.json({ error: 'Заявка на обмен уже существует.' }, { status: 400 });
    }

    const swap = await prisma.swapRequest.create({
      data: {
        senderId: session.user.id,
        receiverId: receiverItem.userId,
        senderItemId,
        receiverItemId,
        status: 'PENDING',
      },
      include: {
        senderItem: true,
        receiverItem: true,
      },
    });

    await prisma.notification.create({
      data: {
        userId: receiverItem.userId,
        type: 'SWAP_RECEIVED',
        title: 'Новое предложение обмена',
        message: 'Вам поступило предложение обмена.',
        href: `/exchange?swap=${swap.id}`,
        entityType: 'SwapRequest',
        entityId: swap.id,
      },
    });

    logInfo('exchange.post', 'Swap created', { swapId: swap.id });
    return actionResponse(swap, swap);
  } catch (error) {
    logError('exchange.post', 'POST exchange error', error);
    return errorResponse('Не удалось создать обмен.', 500);
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return errorResponse('Необходимо войти в систему.', 401);
  }
  try {
    const { swapId, status } = await req.json();

    if (!['ACCEPTED', 'REJECTED', 'DECLINED', 'COMPLETED'].includes(status)) {
      return NextResponse.json(
        { error: 'Недопустимый статус обмена.' },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const swap = await tx.swapRequest.findUnique({
        where: { id: swapId },
        include: {
          receiverItem: true,
          senderItem: true,
        },
      });

      if (!swap) {
        return {
          error: { status: 404 as const, body: { error: 'Обмен не найден.' } },
        };
      }

      if (swap.receiverId !== session.user.id) {
        return {
          error: { status: 403 as const, body: { error: 'Вы не можете управлять этим обменом.' } },
        };
      }

      const finalStatuses = ['REJECTED', 'DECLINED', 'COMPLETED'];
      if (finalStatuses.includes(swap.status)) {
        return {
          error: { status: 409 as const, body: { error: 'Нельзя выполнить действие: обмен уже завершён.' } },
        };
      }

      const senderItem = swap.senderItem;
      const receiverItem = swap.receiverItem;

      if (!senderItem || !receiverItem) {
        return {
          error: { status: 404 as const, body: { error: 'Объявление не найдено.' } },
        };
      }

      if (status === 'ACCEPTED') {
        if (swap.status !== 'PENDING') {
          return {
            error: { status: 409 as const, body: { error: 'Обмен уже был обработан.' } },
          };
        }

        if (senderItem.status !== 'ACTIVE' || receiverItem.status !== 'ACTIVE') {
          return {
            error: {
              status: 409 as const,
              body: { error: 'Одно из объявлений уже участвует в другой сделке.' },
            },
          };
        }

        const updatedSwap = await tx.swapRequest.update({
          where: { id: swapId },
          data: { status: 'ACCEPTED' },
        });
        const updatedSenderItem = await tx.item.update({
          where: { id: senderItem.id },
          data: { status: 'IN_DEAL' },
        });
        const updatedReceiverItem = await tx.item.update({
          where: { id: receiverItem.id },
          data: { status: 'IN_DEAL' },
        });

        return { swap: updatedSwap, senderItem: updatedSenderItem, receiverItem: updatedReceiverItem };
      }

      if (status === 'DECLINED' || status === 'REJECTED') {
        const updatedSwap = await tx.swapRequest.update({
          where: { id: swapId },
          data: { status: 'DECLINED' },
        });

        return { swap: updatedSwap, senderItem, receiverItem };
      }

      if (status === 'COMPLETED') {
        if (swap.status !== 'ACCEPTED') {
          return {
            error: {
              status: 409 as const,
              body: { error: 'Нельзя завершить обмен: он ещё не принят.' },
            },
          };
        }

        const updatedSwap = await tx.swapRequest.update({
          where: { id: swapId },
          data: { status: 'COMPLETED' },
        });
        const updatedSenderItem = await tx.item.update({
          where: { id: senderItem.id },
          data: { status: 'ARCHIVED' },
        });
        const updatedReceiverItem = await tx.item.update({
          where: { id: receiverItem.id },
          data: { status: 'ARCHIVED' },
        });

        return { swap: updatedSwap, senderItem: updatedSenderItem, receiverItem: updatedReceiverItem };
      }

      return {
        error: { status: 400 as const, body: { error: 'Недопустимое действие.' } },
      };
    });

    if ('error' in result && result.error) {
      return NextResponse.json(result.error.body, { status: result.error.status });
    }

    const { swap, senderItem, receiverItem } = result;
    const swapHref = `/exchange?swap=${swap.id}`;

    if (swap.status === 'ACCEPTED') {
      await prisma.notification.create({
        data: {
          userId: swap.senderId,
          type: 'SWAP_ACCEPTED',
          title: 'Обмен принят',
          message: 'Ваше предложение обмена принято.',
          href: swapHref,
          entityType: 'SwapRequest',
          entityId: swap.id,
        },
      });
    } else if (swap.status === 'DECLINED') {
      await prisma.notification.create({
        data: {
          userId: swap.senderId,
          type: 'SWAP_DECLINED',
          title: 'Обмен отклонён',
          message: 'Ваше предложение обмена отклонено.',
          href: swapHref,
          entityType: 'SwapRequest',
          entityId: swap.id,
        },
      });
    } else if (swap.status === 'COMPLETED') {
      await prisma.notification.create({
        data: {
          userId: swap.senderId,
          type: 'SWAP_COMPLETED',
          title: 'Обмен завершён',
          message: 'Обмен успешно завершён.',
          href: swapHref,
          entityType: 'SwapRequest',
          entityId: swap.id,
        },
      });
      await prisma.notification.create({
        data: {
          userId: swap.receiverId,
          type: 'SWAP_COMPLETED',
          title: 'Обмен завершён',
          message: 'Обмен успешно завершён.',
          href: swapHref,
          entityType: 'SwapRequest',
          entityId: swap.id,
        },
      });
    }

    return actionResponse(
      {
        swap,
        items: {
          from: senderItem,
          to: receiverItem,
        },
      },
      {
        swap,
        items: {
          from: senderItem,
          to: receiverItem,
        },
      },
    );
  } catch (error) {
    logError('exchange.patch', 'PATCH exchange error', error);
    return errorResponse('Не удалось обновить статус обмена.', 500);
  }
}

