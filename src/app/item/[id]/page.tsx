'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge, Button, GlassCard, Input } from '@/components/menarium';
import { EmptyState } from '@/components/ui/empty-state';
import { ItemPageSkeleton } from '@/components/ui/skeletons';
import { useSession } from 'next-auth/react';
import { apiGet, apiPost } from '@/lib/api';

interface ItemPageProps {
  params: { id: string };
}

async function getItem(id: string) {
  const res = await fetch(`/api/items/${id}`);
  if (res.status === 404) {
    return { status: 'not-found' as const };
  }

  if (!res.ok) {
    return { status: 'error' as const };
  }

  const data = await res.json();
  return { status: 'ok' as const, data };
}

// Словари перевода
const typeLabels: Record<string, string> = {
  THING: 'Вещь',
  SERVICE: 'Услуга',
};

const categoryLabels: Record<string, string> = {
  FURNITURE: 'Мебель',
  CLOTHES: 'Одежда',
  BOOKS: 'Книги',
  ELECTRONICS: 'Электроника',
  TOOLS: 'Инструменты',
  TOYS: 'Игрушки',
  SPORT: 'Спорт',
  OTHER: 'Другое',
};

export default function ItemPage({ params }: ItemPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const { data: session } = useSession();
  const [item, setItem] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'not-found' | 'error'>('loading');
  const [images, setImages] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [open, setOpen] = useState(false);
  const [myItems, setMyItems] = useState<any[]>([]);
  const [selectedMyItem, setSelectedMyItem] = useState<string | undefined>();
  const [exchangeStatus, setExchangeStatus] = useState<string | null>(null);
  const [exchangeStatusType, setExchangeStatusType] = useState<'success' | 'error' | null>(null);
  const [exchangeLoading, setExchangeLoading] = useState(false);

  // Чат с владельцем
  const [chatOpen, setChatOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ id: string; text: string; senderUserId: string; createdAt: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSendLoading, setChatSendLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedImage = images[selectedIndex] || null;

  useEffect(() => {
    let cancelled = false;

    const loadItem = async () => {
      setStatus('loading');

      try {
        const result = await getItem(params.id);

        if (cancelled) return;

        if (result.status === 'ok') {
          setItem(result.data);
          const imagesFromApi = Array.isArray(result.data.images) ? result.data.images : [];
          setImages(imagesFromApi);
          setStatus('ok');
        } else if (result.status === 'not-found') {
          setItem(null);
          setImages([]);
          setStatus('not-found');
        } else {
          setItem(null);
          setImages([]);
          setStatus('error');
        }
      } catch {
        if (cancelled) return;
        setItem(null);
        setImages([]);
        setStatus('error');
      }
    };

    loadItem();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  // Получить свои объявления при открытии модалки
  useEffect(() => {
    if (open && session) {
      fetch('/api/items/user')
        .then(async (res) => {
          if (!res.ok) {
            setMyItems([]);
            setExchangeStatus('Не удалось загрузить данные. Попробуйте обновить страницу.');
            setExchangeStatusType('error');
            return;
          }
          const data = await res.json();
          setMyItems(Array.isArray(data) ? data : []);
        })
        .catch(() => {
          setMyItems([]);
          setExchangeStatus('Не удалось загрузить данные. Попробуйте обновить страницу.');
          setExchangeStatusType('error');
        });
    }
  }, [open, session]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!fullscreen) return;
      if (e.key === 'Escape') setFullscreen(false);
      if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => (prev + 1) % images.length);
      }
      if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    },
    [fullscreen, images.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Загрузка сообщений чата и polling
  const fetchChatMessages = useCallback(async (tid: string) => {
    const res = await apiGet<{ messages: { id: string; text: string; senderUserId: string; createdAt: string }[] }>(
      `/api/items/chat/${tid}/messages`
    );
    if (res.ok && res.data?.messages) setMessages(res.data.messages);
  }, []);

  useEffect(() => {
    if (!chatOpen || !threadId || !session?.user?.id) return;
    fetchChatMessages(threadId);
    const t = setInterval(() => fetchChatMessages(threadId), 5000);
    return () => clearInterval(t);
  }, [chatOpen, threadId, session?.user?.id, fetchChatMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function openChatModal() {
    if (!session?.user?.id) {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/item/${params.id}`)}`);
      return;
    }
    if (item?.userId === session.user.id) return; // своё объявление — чат не показываем
    setChatError(null);
    setChatOpen(true);
    const createRes = await apiPost<Record<string, never>, { threadId: string }>(
      `/api/items/${params.id}/chat`,
      {}
    );
    if (!createRes.ok) {
      setChatError(createRes.error || 'Не удалось открыть чат.');
      return;
    }
    setThreadId(createRes.data.threadId);
    setMessages([]);
    fetchChatMessages(createRes.data.threadId);
  }

  async function sendChatMessage() {
    const text = chatInput.trim();
    if (!text || !threadId || chatSendLoading) return;
    setChatSendLoading(true);
    setChatError(null);
    const res = await apiPost<{ text: string }, { id: string; text: string; senderUserId: string; createdAt: string }>(
      `/api/items/chat/${threadId}/messages`,
      { text }
    );
    setChatSendLoading(false);
    if (!res.ok) {
      setChatError(res.error || 'Не удалось отправить сообщение.');
      if (res.status === 429) setChatError(res.error || 'Подождите несколько секунд.');
      return;
    }
    setMessages((prev) => [...prev, res.data]);
    setChatInput('');
  }

  // Отправить предложение обмена
  async function handleExchange() {
    if (!selectedMyItem) return;
    setExchangeLoading(true);
    setExchangeStatus(null);
    setExchangeStatusType(null);
    const res = await fetch('/api/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverItemId: params.id, senderItemId: selectedMyItem }),
    });
    const data = await res.json();
    if (res.ok) {
      setExchangeStatus('Предложение отправлено!');
      setExchangeStatusType('success');
      setOpen(false);
    } else {
      setExchangeStatus(data.error || 'Ошибка');
      setExchangeStatusType('error');
    }
    setExchangeLoading(false);
  }

  if (status === 'loading') {
    return <ItemPageSkeleton />;
  }

  if (status === 'not-found') {
    return (
      <div className="container mx-auto max-w-6xl px-6 py-10">
        <GlassCard className="p-6 md:p-8">
          <EmptyState
            title="Объявление не найдено"
            description="Возможно, оно было удалено или ссылка устарела."
            actionLabel="В каталог"
            actionHref="/catalog"
          />
        </GlassCard>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container mx-auto max-w-6xl px-6 py-10">
        <GlassCard className="p-6 md:p-8">
          <EmptyState
            title="Не удалось загрузить объявление"
            description="Попробуйте обновить страницу или перейти в каталог."
            actionLabel="В каталог"
            actionHref="/catalog"
          />
        </GlassCard>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  const desired = Array.isArray(item.desiredCategories)
    ? item.desiredCategories
    : [];

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-6 py-10">
      <button
        onClick={() => {
          if (from === 'my-items') router.push('/my-items');
          else router.push('/catalog');
        }}
        className="rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-menarium-purple/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        ← {from === 'my-items' ? 'Назад к объявлениям' : 'Назад к каталогу'}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Фотоблок */}
        <GlassCard className="space-y-4 p-4 sm:p-5">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Главное изображение"
              className="w-full max-h-[500px] cursor-pointer rounded-2xl border border-white/10 bg-black/20 object-contain"
              onClick={() => setFullscreen(true)}
            />
          )}

          <div className="flex gap-3 overflow-x-auto justify-start">
            {images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Фото ${index + 1}`}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'h-20 w-20 shrink-0 cursor-pointer rounded-xl border object-cover transition',
                  index === selectedIndex
                    ? 'border-menarium-purple shadow-glow-purple'
                    : 'border-white/10 opacity-80 hover:opacity-100'
                )}
              />
            ))}
          </div>
        </GlassCard>

        {/* Контент */}
        <GlassCard className="space-y-5 p-5 text-sm text-foreground sm:p-6">
          <div className="space-y-3">
            <Badge variant="gradient" className="w-fit">Объявление</Badge>
            <h1 className="text-2xl font-bold tracking-tight">{item.title}</h1>
          </div>

          <div className="space-y-2 text-muted-foreground">
            <p><span className="font-semibold text-foreground">Тип:</span> {typeLabels[item.type] || 'Не указан'}</p>
            <p><span className="font-semibold text-foreground">Категория:</span> {categoryLabels[item.category] || 'Не указана'}</p>
            <p><span className="font-semibold text-foreground">Город:</span> {item.city || 'Не указан'}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-base leading-relaxed text-foreground">
            {item.description?.trim() || 'Без описания'}
          </div>

          <div>
            <p className="mb-1 font-semibold">Желаемые категории обмена:</p>
            <p className="text-muted-foreground">
              {item.acceptsAnything && desired.length === 0
                ? 'Рассмотрю любые варианты'
                : desired.length > 0
                  ? desired.map((cat: string) => categoryLabels[cat] || cat).join(', ')
                  : 'Не указаны'}
            </p>
          </div>

          {item.userId !== session?.user?.id && (
            <div className="pt-1">
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => {
                  if (!session?.user?.id) {
                    router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/item/${params.id}`)}`);
                    return;
                  }
                  openChatModal();
                }}
              >
                Написать владельцу
              </Button>
            </div>
          )}

          {item.status !== 'ACTIVE' ? (
            <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
              {item.status === 'IN_DEAL'
                ? 'Объявление участвует в сделке.'
                : 'Объявление завершено.'}
            </div>
          ) : (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-2"
                  onClick={() => setOpen(true)}
                >
                  Предложить обмен
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card rounded-3xl border border-white/10 bg-background/95 text-foreground">
                <DialogHeader>
                  <DialogTitle>Выберите своё объявление для обмена</DialogTitle>
                </DialogHeader>
                <Select value={selectedMyItem} onValueChange={setSelectedMyItem}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите объявление" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(myItems) ? myItems : []).map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title} ({item.type === 'THING' ? 'Вещь' : 'Услуга'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DialogFooter>
                  <Button variant="primary" size="sm" onClick={handleExchange} disabled={!selectedMyItem || exchangeLoading}>
                    {exchangeLoading ? 'Отправка...' : 'Отправить предложение'}
                  </Button>
                </DialogFooter>
                {exchangeStatus && (
                  <div
                    className={cn(
                      "mt-2 rounded-xl border px-3 py-2 text-sm",
                      exchangeStatusType === 'error'
                        ? "border-destructive/40 bg-destructive/10 text-destructive"
                        : "border-menarium-purple/30 bg-menarium-purple/10 text-foreground"
                    )}
                  >
                    {exchangeStatus}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}

          {/* Модалка чата с владельцем */}
          <Dialog open={chatOpen} onOpenChange={(open) => { setChatOpen(open); if (!open) setThreadId(null); setMessages([]); setChatError(null); }}>
            <DialogContent className="glass-card flex max-h-[80vh] max-w-md flex-col rounded-3xl border border-white/10 bg-background/95 text-foreground">
              <DialogHeader>
                <DialogTitle>Чат с владельцем</DialogTitle>
              </DialogHeader>
              <div className="flex-1 min-h-0 flex flex-col gap-2">
                <div className="min-h-[200px] flex-1 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-3">
                  {messages.length === 0 && !chatError && (
                    <p className="text-sm text-muted-foreground">Сообщений пока нет. Напишите первым.</p>
                  )}
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        'text-sm p-2 rounded-lg max-w-[85%]',
                        m.senderUserId === session?.user?.id
                          ? 'ml-auto border border-menarium-purple/40 bg-menarium-purple/20 text-foreground'
                          : 'mr-auto border border-white/10 bg-white/10 text-foreground'
                      )}
                    >
                      {m.text}
                      <div className="mt-0.5 text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleTimeString()}</div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                {chatError && <p className="text-sm text-destructive">{chatError}</p>}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    className="text-sm"
                    placeholder="Введите сообщение..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  />
                  <Button variant="primary" size="sm" onClick={sendChatMessage} disabled={!chatInput.trim() || chatSendLoading}>
                    {chatSendLoading ? '…' : 'Отправить'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </GlassCard>
      </div>

      {/* Полноэкранное фото */}
      {fullscreen && selectedImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/70 backdrop-blur-lg"
          onClick={() => setFullscreen(false)}
        >
          <img
            src={selectedImage}
            alt="Просмотр"
            className="max-h-[90vh] max-w-full rounded-2xl border border-white/20 bg-black/20"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
