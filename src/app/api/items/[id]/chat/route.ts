import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/items/[id]/chat — создать или получить тред чата с владельцем объявления
export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Необходимо войти в систему.' }, { status: 401 });
  }

  const itemId = context.params.id;
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: 'Объявление не найдено.' }, { status: 404 });

  if (item.userId === session.user.id) {
    return NextResponse.json(
      { error: 'Нельзя написать самому себе.' },
      { status: 409 },
    );
  }

  const thread = await prisma.itemThread.upsert({
    where: {
      itemId_buyerUserId: { itemId, buyerUserId: session.user.id },
    },
    create: {
      itemId,
      buyerUserId: session.user.id,
      sellerUserId: item.userId,
    },
    update: {},
  });

  return NextResponse.json({ threadId: thread.id });
}
