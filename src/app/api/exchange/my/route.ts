import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizeItem } from '@/lib/normalizeItem';
import { errorResponse, getPaging, listResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return errorResponse('Необходимо войти в систему.', 401);
  }

  try {
    const { limit, offset } = getPaging(req);
    const swaps = await prisma.swapRequest.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      include: {
        senderItem: true,
        receiverItem: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
    const total = await prisma.swapRequest.count({
      where: {
        OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
      },
    });

    const incoming: any[] = [];
    const outgoing: any[] = [];

    for (const swap of swaps) {
      const entry = {
        swap: {
          id: swap.id,
          status: swap.status,
          createdAt: swap.createdAt,
          updatedAt: swap.updatedAt,
          senderId: swap.senderId,
          receiverId: swap.receiverId,
        },
        fromItem: swap.senderItem ? normalizeItem(swap.senderItem) : null,
        toItem: swap.receiverItem ? normalizeItem(swap.receiverItem) : null,
        fromUserId: swap.senderId,
        toUserId: swap.receiverId,
      };

      if (swap.senderId === session.user.id) {
        outgoing.push(entry);
      }
      if (swap.receiverId === session.user.id) {
        incoming.push(entry);
      }
    }

    return listResponse(swaps, { limit, offset }, total, { incoming, outgoing });
  } catch (error) {
    console.error('GET /api/exchange/my error:', error);
    return errorResponse('Не удалось загрузить обмены.', 500);
  }
}

