import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { normalizeToArray } from '@/lib/normalizeItem';
import { logError } from '@/lib/logger';
import { errorResponse, getPaging, listResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return errorResponse('Необходимо войти в систему.', 401);
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || undefined;
  const category = searchParams.get('category') || undefined;
  const city = searchParams.get('city') || undefined;
  const { limit, offset } = getPaging(req);

  try {
    const alreadyProposedIds = await prisma.swapRequest
      .findMany({
        where: {
          senderId: session.user.id,
          status: { in: ['PENDING', 'ACCEPTED', 'COMPLETED'] },
        },
        select: { receiverItemId: true },
      })
      .then((rows) => rows.map((r) => r.receiverItemId));

    const where: {
      status: string;
      userId?: { not: string };
      id?: { notIn: string[] };
      type?: string;
      category?: string;
      city?: string | { equals: string; mode: 'insensitive' };
    } = {
      status: 'ACTIVE',
      userId: { not: session.user.id },
    };

    if (alreadyProposedIds.length > 0) {
      where.id = { notIn: alreadyProposedIds };
    }
    if (type) where.type = type;
    if (category) where.category = category;
    if (city) where.city = { equals: city, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          title: true,
          city: true,
          category: true,
          images: true,
          status: true,
          userId: true,
        },
      }),
      prisma.item.count({ where }),
    ]);

    const normalized = items.map((item) => ({
      id: item.id,
      title: item.title,
      city: item.city,
      category: item.category,
      images: normalizeToArray(item.images),
      status: item.status,
      userId: item.userId,
    }));

    return listResponse(normalized, { limit, offset }, total);
  } catch (error) {
    logError('items.swipe.get', 'Ошибка выдачи swipe', error);
    return errorResponse('Не удалось загрузить ленту для свайпа.', 500);
  }
}

