'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button as MButton, GlassCard } from '@/components/menarium';
import NotificationsDropdown from './NotificationsDropdown';

const navLinkClass =
  'text-sm font-medium text-white/70 transition-colors hover:text-white';

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
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/40 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/30">
      <div className="container mx-auto px-4">
        <GlassCard className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="gradient-text-brand text-xl font-bold tracking-tight sm:text-2xl"
          >
            Менариум
          </Link>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
            <Link href="/catalog" className={navLinkClass}>
              Каталог
            </Link>

            <MButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCreateClick}
              className="!px-3"
            >
              Создать объявление
            </MButton>

            <Link href="/swaps" className={navLinkClass}>
              Обмены
            </Link>

            <Link href="/swipe" className={`${navLinkClass} inline-flex items-center gap-1`}>
              <span role="img" aria-label="swipe">
                🌀
              </span>
              Свайп-обмен
            </Link>

            <NotificationsDropdown />

            {session ? (
              <>
                <Link href="/profile" className={navLinkClass}>
                  Мой профиль
                </Link>
                <MButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => signOut()}
                >
                  Выйти
                </MButton>
              </>
            ) : (
              <MButton type="button" variant="primary" size="sm" onClick={() => signIn()}>
                Войти
              </MButton>
            )}
          </div>
        </GlassCard>
      </div>
    </nav>
  );
}
