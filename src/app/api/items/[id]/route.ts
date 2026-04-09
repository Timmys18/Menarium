import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { normalizeItem } from '@/lib/normalizeItem';
import { validateImageList } from '@/lib/imageValidation';
import { logError } from '@/lib/logger';
import { actionResponse, errorResponse } from '@/lib/api-response';

export async function GET(_: Request, context: { params: { id: string } }) {
  const id = context.params.id;

  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!item) {
      return errorResponse('Объявление не найдено.', 404);
    }

    const normalized = normalizeItem(item);
    return actionResponse(normalized, normalized);
  } catch (error) {
    logError('items.id.get', 'GET item error', error);
    return errorResponse('Не удалось загрузить объявление.', 500);
  }
}

export async function PATCH(req: Request, context: { params: { id: string } }) {
  const id = context.params.id;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return errorResponse('Необходимо войти в систему.', 401);
  }

  try {
    const existing = await prisma.item.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse('Объявление не найдено.', 404);
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Вы не можете редактировать чужое объявление.' },
        { status: 403 },
      );
    }

    if (existing.status === 'IN_DEAL') {
      return NextResponse.json(
        { error: 'Нельзя редактировать объявление во время сделки.' },
        { status: 400 },
      );
    }
    if (existing.status === 'ARCHIVED') {
      return NextResponse.json(
        { error: 'Нельзя редактировать архивное объявление.' },
        { status: 400 },
      );
    }

    const data = await req.json();

    let imagesInput: unknown = data.images;
    if (typeof imagesInput === 'string') {
      try {
        imagesInput = JSON.parse(imagesInput);
      } catch {
        return errorResponse('Некорректный формат поля images.', 400);
      }
    }
    const imageValidation = validateImageList(imagesInput);
    if (!imageValidation.ok) {
      return errorResponse(imageValidation.error, 400);
    }

    const imagesJson = JSON.stringify(imageValidation.images);

    const updated = await prisma.item.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        city: data.city,
        type: data.type,
        category: data.category,
        desiredCategories: data.desiredCategories,
        images: imagesJson,
        acceptsAnything: data.acceptsAnything,
        extraOfferText: data.extraOfferText,
      },
    });

    return actionResponse(updated, updated);
  } catch (error) {
    logError('items.id.patch', 'PATCH item error', error);
    return errorResponse('Не удалось обновить объявление.', 500);
  }
}

export async function DELETE(_: Request, context: { params: { id: string } }) {
  const id = context.params.id;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return errorResponse('Необходимо войти в систему.', 401);
  }

  try {
    const existing = await prisma.item.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse('Объявление не найдено.', 404);
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Вы не можете удалить чужое объявление.' },
        { status: 403 },
      );
    }

    const blockingSwaps = await prisma.swapRequest.count({
      where: {
        status: { in: ['PENDING', 'ACCEPTED'] },
        OR: [{ senderItemId: existing.id }, { receiverItemId: existing.id }],
      },
    });
    if (blockingSwaps > 0) {
      return NextResponse.json(
        { error: 'Нельзя удалить объявление, пока по нему есть активные или ожидающие обмены' },
        { status: 409 },
      );
    }

    await prisma.item.delete({ where: { id } });

    return actionResponse({ success: true }, { success: true });
  } catch (error) {
    logError('items.id.delete', 'DELETE item error', error);
    return errorResponse('Не удалось удалить объявление.', 500);
  }
}

