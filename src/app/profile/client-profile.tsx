'use client'

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // редирект если неавторизован
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // загрузка данных пользователя
  useEffect(() => {
    if (session?.user?.id && !user) {
      fetch(`/api/users/${session.user.id}`)
        .then((res) => res.json())
        .then((data) => setUser(data));
    }
  }, [session, user]);

  // скелетон при загрузке
  if (status === "loading") {
    return <Skeleton className="h-[300px]" />;
  }

  // защита от пустого пользователя
  if (status === "authenticated" && !user) {
    return <div className="text-center text-muted-foreground mt-10">Пользователь не найден.</div>;
  }

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Профиль пользователя */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.image || ""} />
                <AvatarFallback>
                  {user?.name?.charAt(0) || user?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{user?.name || "Пользователь"}</CardTitle>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Город</h3>
                <p className="text-sm text-muted-foreground">
                  {user?.city || "Не указан"}
                </p>
              </div>
              <Button variant="outline" className="w-full">
                Редактировать профиль
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Мои вещи/услуги */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Мои вещи и услуги</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Здесь будут отображаться ваши предложения для обмена
            </p>
          </CardContent>
        </Card>

        {/* Мои обмены */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Мои обмены</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Здесь будет история ваших обменов
            </p>
          </CardContent>
        </Card>

        {/* Настройки */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Настройки</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Здесь будут настройки вашего аккаунта
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
