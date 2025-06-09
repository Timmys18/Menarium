import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();

    const item = await prisma.item.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        type: data.type,
        city: data.city,
        desiredCategories: JSON.stringify(data.desiredCategories),
        images: JSON.stringify(data.images ?? []),
        acceptsAnything: data.acceptsAnything,
        additionalItemIds: JSON.stringify([]), // ← тут должна быть запятая ✅
        user: {
          connectOrCreate: {
            where: { email: session.user.email },
            create: {
              email: session.user.email,
              password: 'dev-placeholder',
            },
          },
        },
      }
    });
    return NextResponse.json({ id: item.id });
  } catch (error) {
    console.error('Ошибка при создании объявления:', error);
    return NextResponse.json(
      { error: 'Create failed', details: String(error) },
      { status: 500 }
    );
  }
}
