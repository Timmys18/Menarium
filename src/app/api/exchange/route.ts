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
        { error: 'Обмен невозможен: одно из объявлений недоступно' },
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
    const { swapId, action } = await req.json();
    const normalizedAction = typeof action === 'string' ? action.toLowerCase() : '';
    if (!['accept', 'decline', 'complete', 'cancel', 'revoke'].includes(normalizedAction)) {
      return NextResponse.json(
        { error: 'Недопустимое действие.' },
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

      const isSender = swap.senderId === session.user.id;
      const isReceiver = swap.receiverId === session.user.id;
      if (!isSender && !isReceiver) {
        return {
          error: { status: 403 as const, body: { error: 'Вы не можете управлять этим обменом.' } },
        };
      }

      const senderItem = swap.senderItem;
      const receiverItem = swap.receiverItem;

      if (!senderItem || !receiverItem) {
        return {
          error: { status: 404 as const, body: { error: 'Объявление не найдено.' } },
        };
      }

      if (normalizedAction === 'accept') {
        if (!isReceiver) {
          return {
            error: { status: 403 as const, body: { error: 'Только получатель может принять обмен.' } },
          };
        }
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
          data: {
            status: 'ACCEPTED',
            senderCompleted: false,
            receiverCompleted: false,
            acceptedAt: swap.acceptedAt ?? new Date(),
          },
        });
        const updatedSenderItem = await tx.item.update({
          where: { id: senderItem.id },
          data: { status: 'IN_DEAL' },
        });
        const updatedReceiverItem = await tx.item.update({
          where: { id: receiverItem.id },
          data: { status: 'IN_DEAL' },
        });
        await tx.notification.create({
          data: {
            userId: swap.senderId,
            type: 'SWAP_ACCEPTED',
            title: 'Обмен принят',
            message: 'Ваше предложение обмена принято.',
            href: `/exchange?swap=${swap.id}`,
            entityType: 'SwapRequest',
            entityId: swap.id,
          },
        });

        return { swap: updatedSwap, senderItem: updatedSenderItem, receiverItem: updatedReceiverItem };
      }

      if (normalizedAction === 'decline') {
        if (!isReceiver) {
          return {
            error: { status: 403 as const, body: { error: 'Только получатель может отклонить обмен.' } },
          };
        }
        if (swap.status !== 'PENDING') {
          return {
            error: { status: 409 as const, body: { error: 'Обмен уже был обработан.' } },
          };
        }
        const updatedSwap = await tx.swapRequest.update({
          where: { id: swapId },
          data: { status: 'DECLINED', senderCompleted: false, receiverCompleted: false },
        });
        await tx.notification.create({
          data: {
            userId: swap.senderId,
            type: 'SWAP_DECLINED',
            title: 'Обмен отклонён',
            message: 'Ваше предложение обмена отклонено.',
            href: `/exchange?swap=${swap.id}`,
            entityType: 'SwapRequest',
            entityId: swap.id,
          },
        });

        return { swap: updatedSwap, senderItem, receiverItem };
      }

      if (normalizedAction === 'revoke') {
        if (!isSender) {
          return {
            error: { status: 403 as const, body: { error: 'Только отправитель может отозвать предложение.' } },
          };
        }
        if (swap.status !== 'PENDING') {
          return {
            error: { status: 409 as const, body: { error: 'Отозвать можно только предложение в ожидании.' } },
          };
        }

        const updatedSwap = await tx.swapRequest.update({
          where: { id: swapId },
          data: { status: 'CANCELLED', senderCompleted: false, receiverCompleted: false },
        });

        await tx.notification.create({
          data: {
            userId: swap.receiverId,
            type: 'SWAP_DECLINED',
            title: 'Предложение отозвано',
            message: 'Отправитель отозвал предложение обмена.',
            href: `/exchange?swap=${swap.id}`,
            entityType: 'SwapRequest',
            entityId: swap.id,
          },
        });

        return { swap: updatedSwap, senderItem, receiverItem };
      }

      if (normalizedAction === 'complete') {
        if (swap.status === 'COMPLETED') {
          return { swap, senderItem, receiverItem };
        }
        if (swap.status !== 'ACCEPTED') {
          return {
            error: {
              status: 409 as const,
              body: { error: 'Нельзя завершить обмен: он ещё не принят.' },
            },
          };
        }

        const nextSenderCompleted = isSender ? true : swap.senderCompleted;
        const nextReceiverCompleted = isReceiver ? true : swap.receiverCompleted;
        const shouldComplete = nextSenderCompleted && nextReceiverCompleted;
        const alreadyCompletedByCurrent = isSender ? swap.senderCompleted : swap.receiverCompleted;

        const updatedSwap = await tx.swapRequest.update({
          where: { id: swapId },
          data: {
            senderCompleted: nextSenderCompleted,
            receiverCompleted: nextReceiverCompleted,
            status: shouldComplete ? 'COMPLETED' : 'ACCEPTED',
          },
        });

        let updatedSenderItem = senderItem;
        let updatedReceiverItem = receiverItem;
        if (shouldComplete) {
          updatedSenderItem = await tx.item.update({
            where: { id: senderItem.id },
            data: { status: 'ARCHIVED' },
          });
          updatedReceiverItem = await tx.item.update({
            where: { id: receiverItem.id },
            data: { status: 'ARCHIVED' },
          });
          await tx.notification.create({
            data: {
              userId: swap.senderId,
              type: 'SWAP_COMPLETED',
              title: 'Обмен завершён',
              message: 'Обмен успешно завершён.',
              href: `/exchange?swap=${swap.id}`,
              entityType: 'SwapRequest',
              entityId: swap.id,
            },
          });
          await tx.notification.create({
            data: {
              userId: swap.receiverId,
              type: 'SWAP_COMPLETED',
              title: 'Обмен завершён',
              message: 'Обмен успешно завершён.',
              href: `/exchange?swap=${swap.id}`,
              entityType: 'SwapRequest',
              entityId: swap.id,
            },
          });
        }

        if (alreadyCompletedByCurrent && !shouldComplete) {
          return { swap: updatedSwap, senderItem, receiverItem };
        }

        return { swap: updatedSwap, senderItem: updatedSenderItem, receiverItem: updatedReceiverItem };
      }

      if (normalizedAction === 'cancel') {
        if (swap.status === 'CANCELLED') {
          return { swap, senderItem, receiverItem };
        }
        if (swap.status === 'COMPLETED' || swap.status === 'DECLINED' || swap.status === 'PENDING') {
          return {
            error: {
              status: 409 as const,
              body: { error: 'Отмена доступна только для принятой сделки.' },
            },
          };
        }
        if (swap.status !== 'ACCEPTED') {
          return {
            error: {
              status: 409 as const,
              body: { error: 'Отмена доступна только для принятой сделки.' },
            },
          };
        }

        const updatedSwap = await tx.swapRequest.update({
          where: { id: swapId },
          data: { status: 'CANCELLED', senderCompleted: false, receiverCompleted: false },
        });

        const otherAcceptedForSender = await tx.swapRequest.count({
          where: {
            id: { not: swap.id },
            status: 'ACCEPTED',
            OR: [{ senderItemId: senderItem.id }, { receiverItemId: senderItem.id }],
          },
        });
        const otherAcceptedForReceiver = await tx.swapRequest.count({
          where: {
            id: { not: swap.id },
            status: 'ACCEPTED',
            OR: [{ senderItemId: receiverItem.id }, { receiverItemId: receiverItem.id }],
          },
        });

        const updatedSenderItem = await tx.item.update({
          where: { id: senderItem.id },
          data: { status: otherAcceptedForSender > 0 ? 'IN_DEAL' : 'ACTIVE' },
        });
        const updatedReceiverItem = await tx.item.update({
          where: { id: receiverItem.id },
          data: { status: otherAcceptedForReceiver > 0 ? 'IN_DEAL' : 'ACTIVE' },
        });

        const otherSideUserId = isSender ? swap.receiverId : swap.senderId;
        await tx.notification.create({
          data: {
            userId: otherSideUserId,
            type: 'SWAP_DECLINED',
            title: 'Сделка отменена',
            message: 'Вторая сторона отменила сделку.',
            href: `/exchange?swap=${swap.id}`,
            entityType: 'SwapRequest',
            entityId: swap.id,
          },
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

