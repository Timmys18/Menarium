"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationsListSkeleton } from '@/components/ui/skeletons';
import { cn } from '@/lib/utils';
import { apiGet, apiPatch } from '@/lib/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  href: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setErrorText(null);
    const result = await apiGet<{ notifications: Notification[]; unreadCount: number } | Notification[]>('/api/notifications?limit=20');
    if (!result.ok) {
      setNotifications([]);
      setUnreadCount(0);
      setErrorText(result.status === 401 ? 'Войдите, чтобы видеть уведомления.' : 'Не удалось загрузить уведомления.');
      setLoading(false);
      return;
    }
    const data = result.data as { notifications?: Notification[]; unreadCount?: number };
    const list = Array.isArray(data) ? data : (data.notifications ?? []);
    const count = typeof data.unreadCount === 'number' ? data.unreadCount : list.filter((n: Notification) => !n.isRead).length;
    setNotifications(list);
    setUnreadCount(count);
    setErrorText(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchNotifications();
  }, [open, fetchNotifications]);

  async function markAsRead(id: string, href?: string | null) {
    const res = await apiPatch<{ id: string }, { success?: boolean }>('/api/notifications', { id });
    if (!res.ok) return;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    if (href) window.location.href = href;
  }

  async function markAllAsRead() {
    const res = await apiPatch<{ readAll: true }, { success?: boolean }>('/api/notifications', { readAll: true });
    if (!res.ok) return;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    fetchNotifications();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative size-10 rounded-full border border-white/[0.06] bg-white/[0.04] p-0 text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" aria-hidden>
            <path
              stroke="currentColor"
              strokeWidth="2"
              d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-[1.125rem] rounded-full bg-primary px-1 text-center text-[10px] font-bold leading-tight text-primary-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-96 overflow-y-auto border-border/60 bg-popover/95 p-0 shadow-2xl backdrop-blur-xl sm:w-80">
        <div className="flex items-center justify-between border-b border-border/60 p-3 text-base font-semibold">
          <span>Уведомления</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={markAllAsRead}>
              Отметить всё как прочитанное
            </Button>
          )}
        </div>
        {loading ? (
          <NotificationsListSkeleton />
        ) : errorText ? (
          <div className="p-4 text-center text-muted-foreground text-sm">{errorText}</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">Уведомлений пока нет</div>
        ) : (
          <ul className="divide-y divide-border/60">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={cn(
                  'cursor-pointer px-4 py-3 transition select-none hover:bg-white/[0.04]',
                  !n.isRead && 'bg-primary/10',
                )}
                onClick={() => markAsRead(n.id, n.href)}
              >
                <div className={cn('text-sm font-medium text-foreground', !n.isRead && 'font-semibold')}>
                  {n.title}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{n.message}</div>
                <div className="mt-1 text-[11px] text-muted-foreground/80">
                  {new Date(n.createdAt).toLocaleString('ru-RU')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
