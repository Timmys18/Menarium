"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Badge, Button, GlassCard, Input } from "@/components/menarium";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const registered = searchParams.get("registered") === "true";

  useEffect(() => {
    if (!registered) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("registered");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `/auth/login?${nextQuery}` : "/auth/login");
  }, [registered, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Неверный email или пароль");
      } else {
        router.push("/profile");
        router.refresh();
      }
    } catch (error) {
      setError("Произошла ошибка при входе");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <GlassCard className="w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Вход в аккаунт</h1>
          <p className="text-sm text-muted-foreground">
            Введите свои данные для входа в систему
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {registered && (
              <Badge variant="gradient" className="w-full justify-center py-2 text-sm">
                Регистрация успешна. Теперь войдите в аккаунт.
              </Badge>
            )}
            {error && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
                {error}
              </div>
            )}
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
              {isLoading ? "Вход..." : "Войти"}
            </Button>
            <div className="text-center text-sm">
              Нет аккаунта?{" "}
              <Link href="/auth/register" className="font-medium text-primary hover:underline">
                Зарегистрироваться
              </Link>
            </div>
          </div>
        </form>
      </GlassCard>
    </div>
  );
} 