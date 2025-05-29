'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleCreateClick = () => {
    if (session) {
      router.push('/new');
    } else {
      signIn(undefined, { callbackUrl: '/new' });
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
      <div className="container mx-auto px-4 h-16">
        <div className="flex justify-between h-full items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            Менариум
          </Link>

          <div className="flex items-center space-x-6">
            <Link href="/catalog" className="text-sm font-medium hover:text-primary transition-colors">
              Каталог
            </Link>

            <button
              onClick={handleCreateClick}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Создать объявление
            </button>

            <Link href="/swaps" className="text-sm font-medium hover:text-primary transition-colors">
              Обмены
            </Link>

            {session ? (
              <>
                <Link href="/profile" className="text-sm font-medium hover:text-primary transition-colors">
                  Мой профиль
                </Link>
                <Button
                  onClick={() => signOut()}
                  variant="outline"
                  size="sm"
                  className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  Выйти
                </Button>
              </>
            ) : (
              <Button
                onClick={() => signIn()}
                size="sm"
                className="bg-primary hover:bg-primary/90 transition-colors"
              >
                Войти
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
