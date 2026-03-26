import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { actionResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return errorResponse("Email и пароль обязательны", 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse("Пользователь с таким email уже существует", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return actionResponse(
      { message: "Пользователь успешно создан", userId: user.id },
      { message: "Пользователь успешно создан" },
      201,
    );
  } catch (error) {
    console.error("Registration error:", error);
    return errorResponse("Ошибка при регистрации", 500);
  }
} 