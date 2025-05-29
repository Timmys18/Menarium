import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ItemType } from "@/types";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      type,
      category,
      description,
      city,
      isOnline,
      acceptsAnything,
      desiredCategories,
    } = body;

    if (!title || !type || !category || !description || !city) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const item = await prisma.item.create({
      data: {
        title,
        type,
        category,
        description,
        city,
        isOnline: isOnline || false,
        acceptsAnything: acceptsAnything || false,
        desiredCategories,
        userId: user.id,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("[ITEMS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as ItemType | null;
    const category = searchParams.get("category");
    const city = searchParams.get("city");

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (city) {
      where.city = city;
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("[ITEMS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 