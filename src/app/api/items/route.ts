import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { normalizeItem } from '@/lib/normalizeItem';
import { checkActionRateLimit, recordActionRequest } from '@/lib/rateLimit';
import { logError, logInfo } from '@/lib/logger';
import { validateImageList } from '@/lib/imageValidation';
import { actionResponse, errorResponse, getPaging, listResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return errorResponse('?????????? ????? ? ???????.', 401);
  }

  const actorId = session.user.id ?? session.user.email;
  const rate = checkActionRateLimit(actorId, 'items:create', 2500);
  if (!rate.ok) {
    return errorResponse(rate.message, 429);
  }
  recordActionRequest(actorId, 'items:create');

  try {
    const data = await req.json();
    const imageValidation = validateImageList(data.images);
    if (!imageValidation.ok) {
      return errorResponse(imageValidation.error, 400);
    }

    const item = await prisma.item.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        type: data.type,
        city: data.city,
        desiredCategories: JSON.stringify(data.desiredCategories),
        images: JSON.stringify(imageValidation.images),
        acceptsAnything: data.acceptsAnything,
        additionalItemIds: JSON.stringify([]),
        user: {
          connectOrCreate: {
            where: { email: session.user.email },
            create: {
              email: session.user.email,
              password: 'dev-placeholder',
            },
          },
        },
      },
    });
    logInfo('items.post', 'Item created', { itemId: item.id });
    return actionResponse({ id: item.id }, { id: item.id });
  } catch (error) {
    logError('items.post', '?????? ??? ???????? ??????????', error);
    return errorResponse('?? ??????? ??????? ??????????.', 500);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const city = searchParams.get('city');
  const acceptsAnything = searchParams.get('acceptsAnything');
  const sort = searchParams.get('sort') || 'createdAt_desc';
  const { limit, offset } = getPaging(req);

  const where: any = { status: 'ACTIVE' };
  if (type) where.type = type;
  if (category) where.category = category;
  if (city) where.city = { equals: city, mode: 'insensitive' };
  if (acceptsAnything === 'true') where.acceptsAnything = true;

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'createdAt_asc') orderBy = { createdAt: 'asc' };
  if (sort === 'title_asc') orderBy = { title: 'asc' };
  if (sort === 'title_desc') orderBy = { title: 'desc' };

  try {
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.item.count({ where }),
    ]);

    const normalizedItems = items.map(normalizeItem);
    return listResponse(normalizedItems, { limit, offset }, total, { total });
  } catch (error) {
    logError('items.get', '?????? ????????? ??????????', error);
    return errorResponse('?? ??????? ????????? ??????????.', 500);
  }
}


