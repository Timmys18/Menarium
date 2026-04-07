"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, GlassCard, Input } from "@/components/menarium";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Ошибка при регистрации");
      }

      router.push("/auth/login?registered=true");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Произошла ошибка при регистрации");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <GlassCard className="w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Регистрация</h1>
          <p className="text-sm text-muted-foreground">
            Создайте новый аккаунт для начала обмена
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {error && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
                {error}
              </div>
            )}
            <Input
              id="name"
              name="name"
              type="text"
              label="Имя"
              placeholder="Ваше имя"
              required
            />
            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              placeholder="example@mail.com"
              required
            />
            <Input
              id="password"
              name="password"
              type="password"
              label="Пароль"
              required
            />
          </div>
          <div className="mt-6 flex flex-col space-y-4">
            <Button type="submit" className="w-full justify-center" disabled={isLoading}>
              {isLoading ? "Регистрация..." : "Зарегистрироваться"}
            </Button>
            <div className="text-center text-sm">
              Уже есть аккаунт?{" "}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Войти
              </Link>
            </div>
          </div>
        </form>
      </GlassCard>
    </div>
  );
} 