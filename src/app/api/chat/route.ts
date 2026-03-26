import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

// Получить чат по swapRequestId
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const swapRequestId = searchParams.get('swapRequestId');
  if (!swapRequestId) return NextResponse.json({ error: 'swapRequestId обязателен' }, { status: 400 });
  const chat = await prisma.chat.findUnique({
    where: { swapRequestId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      participants: true,
    },
  });
  return NextResponse.json(chat);
}

// Создать чат (только если его ещё нет)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
  const { swapRequestId, participantIds } = await req.json();
  if (!swapRequestId || !participantIds || participantIds.length !== 2) {
    return NextResponse.json({ error: 'swapRequestId и participantIds (2 пользователя) обязательны' }, { status: 400 });
  }
  // Проверяем, есть ли уже чат
  let chat = await prisma.chat.findUnique({ where: { swapRequestId } });
  if (!chat) {
    chat = await prisma.chat.create({
      data: {
        swapRequestId,
        participants: { connect: participantIds.map((id: string) => ({ id })) },
      },
      include: { participants: true },
    });
  }
  return NextResponse.json(chat);
}

// Отправить сообщение в чат
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
  const { chatId, text } = await req.json();
  if (!chatId || !text) return NextResponse.json({ error: 'chatId и text обязательны' }, { status: 400 });
  const message = await prisma.chatMessage.create({
    data: {
      chatId,
      senderId: session.user.id,
      text,
    },
  });
  return NextResponse.json(message);
} 