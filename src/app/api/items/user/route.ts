import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const items = await prisma.item.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        title: true,
        type: true,
        category: true,
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("[ITEMS_USER_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 