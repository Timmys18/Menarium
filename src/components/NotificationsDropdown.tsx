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
        <Button variant="ghost" className="relative p-2 rounded-full">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"/></svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-96 overflow-y-auto p-0 sm:w-80 w-64">
        <div className="p-3 border-b font-semibold text-base flex items-center justify-between">
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
          <ul className="divide-y">
            {notifications.map(n => (
              <li
                key={n.id}
                className={cn("px-4 py-3 cursor-pointer hover:bg-blue-50 transition select-none active:bg-blue-200", !n.isRead && "bg-blue-100")}
                onClick={() => markAsRead(n.id, n.href)}
              >
                <div className={cn("text-sm font-medium", !n.isRead && "font-bold")}>{n.title}</div>
                <div className="text-xs text-slate-600 mt-0.5">{n.message}</div>
                <div className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
