'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  ArrowLeftRight,
  Grid3X3,
  Home,
  MessageCircle,
  PlusCircle,
  Repeat2,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NotificationsDropdown from './NotificationsDropdown';

function routeActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  if (href === '/profile') return pathname === '/profile';
  return pathname === href || pathname.startsWith(`${href}/`);
}

const centerNav = [
  { href: '/', label: 'Главная', icon: Home },
  { href: '/swipe', label: 'Свайп', icon: ArrowLeftRight },
  { href: '/catalog', label: 'Каталог', icon: Grid3X3 },
  { href: '/exchange', label: 'Обмены', icon: Repeat2 },
  { href: '/profile', label: 'Профиль', icon: User },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const goCreate = () => {
    if (session) {
      router.push('/new');
    } else {
      signIn(undefined, { callbackUrl: '/new' });
    }
  };

  const chatsHref = session ? '/profile/chats' : `/auth/login?callbackUrl=${encodeURIComponent('/profile/chats')}`;

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 sm:px-4">
        <div
          className={cn(
            'pointer-events-auto mt-4 flex w-full max-w-[1040px] items-center justify-between gap-2 rounded-full border border-white/[0.08] bg-background/[0.45] px-3 py-2 shadow-glass backdrop-blur-2xl sm:px-5 sm:py-2.5',
            'supports-[backdrop-filter]:bg-background/30',
          )}
        >
          <Link
            href="/"
            className="shrink-0 pr-2 text-sm font-semibold uppercase tracking-[0.12em] text-foreground sm:pr-4 sm:text-base"
          >
            Менариум
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex">
            {centerNav.map(({ href, label, icon: Icon }) => {
              const active = routeActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground',
                  )}
                >
                  {active && (
                    <span
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent shadow-glow-blue"
                      aria-hidden
                    />
                  )}
                  <Icon className="relative z-10 size-[17px] shrink-0" strokeWidth={1.5} />
                  <span className="relative z-10 hidden xl:inline">{label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={goCreate}
              className="relative ml-1 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-3 py-2 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-95"
            >
              <PlusCircle className="size-[17px]" strokeWidth={1.5} />
              <span className="hidden xl:inline">Создать</span>
            </button>
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              href={chatsHref}
              className={cn(
                'flex size-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.04] text-muted-foreground transition hover:bg-white/[0.08] hover:text-foreground',
                pathname.startsWith('/profile/chats') && 'text-primary ring-1 ring-primary/40',
              )}
              aria-label="Чаты"
            >
              <MessageCircle className="size-[18px]" strokeWidth={1.5} />
            </Link>
            <NotificationsDropdown />
            {session ? (
              <Link
                href="/profile"
                className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-primary to-accent text-xs font-bold text-primary-foreground"
                aria-label="Профиль"
              >
                {session.user?.name?.charAt(0).toUpperCase() ||
                  session.user?.email?.charAt(0).toUpperCase() ||
                  'Я'}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => signIn()}
                className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-white/10 sm:px-4 sm:text-sm"
              >
                Войти
              </button>
            )}
            {session && (
              <button
                type="button"
                onClick={() => signOut()}
                className="hidden rounded-full px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground sm:inline sm:text-sm"
              >
                Выйти
              </button>
            )}
          </div>
        </div>
      </header>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-card/75 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        aria-label="Основная навигация"
      >
        <div className="mx-auto flex max-w-lg items-center justify-around gap-1 px-2 py-2">
          {centerNav.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const active = routeActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="size-5 shrink-0" strokeWidth={1.5} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={goCreate}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold text-primary"
          >
            <PlusCircle className="size-5 shrink-0" strokeWidth={1.5} />
            <span className="truncate">Создать</span>
          </button>
        </div>
      </nav>
    </>
  );
}
