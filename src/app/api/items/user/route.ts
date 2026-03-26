import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Необходимо войти в систему." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден." }, { status: 404 });
    }

    const items = await prisma.item.findMany({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
        title: true,
        type: true,
        category: true,
        status: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("[ITEMS_USER_GET]", error);
    return NextResponse.json({ error: "Не удалось загрузить объявления." }, { status: 500 });
  }
}