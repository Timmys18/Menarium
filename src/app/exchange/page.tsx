"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ExchangeCardSkeleton } from '@/components/ui/skeletons';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { pickArray } from '@/lib/guards';

const statusLabels: Record<string, string> = {
  PENDING: 'Ожидает решения',
  ACCEPTED: 'Принят (в сделке)',
  DECLINED: 'Отклонён',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

type SwapStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED' | 'CANCELLED';

interface SwapCore {
  id: string;
  status: SwapStatus;
  senderCompleted: boolean;
  receiverCompleted: boolean;
  acceptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  senderId: string;
  receiverId: string;
}

interface ItemSummary {
  id: string;
  title: string;
  city: string;
  images: string[];
  status: string;
}

interface SwapEntry {
  swap: SwapCore;
  fromItem: ItemSummary | null;
  toItem: ItemSummary | null;
  fromUserId: string;
  toUserId: string;
}

interface SwapsResponse {
  incoming: SwapEntry[];
  outgoing: SwapEntry[];
}

type Tab = 'incoming' | 'outgoing';

export default function ExchangePage() {
  const searchParams = useSearchParams();
  const targetSwapId = searchParams.get('swap');
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>('incoming');
  const [data, setData] = useState<SwapsResponse>({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Чат обмена
  const [chatSwapId, setChatSwapId] = useState<string | null>(null);
  const [dealMessages, setDealMessages] = useState<{ id: string; text: string; senderId: string; createdAt: string }[]>([]);
  const [dealChatInput, setDealChatInput] = useState('');
  const [dealChatLoading, setDealChatLoading] = useState(false);
  const [dealChatError, setDealChatError] = useState<string | null>(null);
  const [dealChatClosed, setDealChatClosed] = useState(false);
  const dealMessagesEndRef = useRef<HTMLDivElement>(null);
  const swapCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [focusedSwapId, setFocusedSwapId] = useState<string | null>(null);

  const fetchDealMessages = useCallback(async (swapId: string) => {
    const res = await apiGet<{ messages: { id: string; text: string; senderId: string; createdAt: string }[]; chatClosed?: boolean }>(
      `/api/exchange/${swapId}/messages`
    );
    if (res.ok && res.data) {
      const d = res.data as { messages?: typeof dealMessages; chatClosed?: boolean };
      setDealMessages(d.messages ?? []);
      setDealChatClosed(!!d.chatClosed);
      setDealChatError(null);
    }
  }, []);

  useEffect(() => {
    if (!chatSwapId) return;
    fetchDealMessages(chatSwapId);
    const t = setInterval(() => fetchDealMessages(chatSwapId), 5000);
    return () => clearInterval(t);
  }, [chatSwapId, fetchDealMessages]);

  useEffect(() => {
    dealMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dealMessages]);

  function openDealChat(swapId: string) {
    setChatSwapId(swapId);
    setDealMessages([]);
    setDealChatInput('');
    setDealChatError(null);
    setDealChatClosed(false);
  }

  async function sendDealMessage() {
    const text = dealChatInput.trim();
    if (!text || !chatSwapId || dealChatLoading || dealChatClosed) return;
    setDealChatLoading(true);
    setDealChatError(null);
    const res = await apiPost<{ text: string }, { id: string; text: string; senderId: string; createdAt: string }>(
      `/api/exchange/${chatSwapId}/messages`,
      { text }
    );
    setDealChatLoading(false);
    if (!res.ok) {
      setDealChatError(res.error ?? 'Не удалось отправить сообщение.');
      if (res.status === 429) setDealChatError(res.error ?? 'Подождите несколько секунд.');
      if (res.status === 409) setDealChatClosed(true);
      return;
    }
    setDealMessages((prev) => [...prev, res.data]);
    setDealChatInput('');
  }

  async function loadSwaps() {
    setLoading(true);
    setError(null);
    const result = await apiGet<SwapsResponse | { incoming?: SwapEntry[]; outgoing?: SwapEntry[]; error?: string }>('/api/exchange/my');

    if (!result.ok) {
      if (result.status === 401) {
        setError('Необходимо войти в систему.');
      } else {
        setError(result.error || 'Не удалось загрузить обмены. Попробуйте обновить страницу.');
      }
      setData({ incoming: [], outgoing: [] });
      setLoading(false);
      return;
    }

    const incoming = pickArray<SwapEntry>(result.data, ['incoming']);
    const outgoing = pickArray<SwapEntry>(result.data, ['outgoing']);
    setData({ incoming, outgoing });
    setLoading(false);
  }

  useEffect(() => {
    loadSwaps();
  }, []);

  useEffect(() => {
    if (!targetSwapId || loading) return;

    const inIncoming = data.incoming.some((entry) => entry.swap.id === targetSwapId);
    const inOutgoing = data.outgoing.some((entry) => entry.swap.id === targetSwapId);

    if (!inIncoming && !inOutgoing) {
      setToastMessage('Сделка из уведомления не найдена или больше недоступна.');
      setFocusedSwapId(null);
      return;
    }

    setActiveTab(inIncoming ? 'incoming' : 'outgoing');
    setFocusedSwapId(targetSwapId);
  }, [targetSwapId, loading, data.incoming, data.outgoing]);

  useEffect(() => {
    if (!focusedSwapId) return;
    const node = swapCardRefs.current[focusedSwapId];
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setTimeout(() => setFocusedSwapId(null), 4500);
    return () => clearTimeout(timer);
  }, [focusedSwapId, activeTab]);

  async function handleAction(swapId: string, action: 'accept' | 'decline' | 'complete' | 'cancel' | 'revoke') {
    setActionLoadingId(`${swapId}:${action}`);
    setToastMessage(null);

    const result = await apiPatch<{ swapId: string; action: string }, any>('/api/exchange', {
      swapId,
      action,
    });

    if (!result.ok) {
      if (result.status === 401) {
        setToastMessage('Необходимо войти в систему.');
      } else {
        setToastMessage(result.error || 'Ошибка обновления статуса.');
      }
      setActionLoadingId(null);
      return;
    }

    if (action === 'accept') {
      setToastMessage('Обмен принят.');
    } else if (action === 'decline') {
      setToastMessage('Обмен отклонён.');
    } else if (action === 'complete') {
      setToastMessage('Подтверждение сделки сохранено.');
    } else if (action === 'cancel') {
      setToastMessage('Сделка отменена.');
    } else if (action === 'revoke') {
      setToastMessage('Предложение отозвано.');
    }

    await loadSwaps();
    setFocusedSwapId(swapId);
    setActionLoadingId(null);
  }

  const list = activeTab === 'incoming' ? data.incoming : data.outgoing;

  return (
    <div className="max-w-5xl mx-auto px-2 py-6 space-y-4">
      <h1 className="text-2xl font-bold mb-2">Мои обмены</h1>

      <div className="flex gap-2 mb-4">
        <Button
          variant={activeTab === 'incoming' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('incoming')}
        >
          Входящие
        </Button>
        <Button
          variant={activeTab === 'outgoing' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('outgoing')}
        >
          Исходящие
        </Button>
      </div>

      {toastMessage && (
        <div className="bg-blue-100 text-blue-800 rounded px-4 py-2 text-sm">{toastMessage}</div>
      )}

      {loading ? (
        <div className="space-y-4">
          <ExchangeCardSkeleton />
          <ExchangeCardSkeleton />
          <ExchangeCardSkeleton />
        </div>
      ) : error ? (
        <EmptyState
          title={error}
          description={error === "Необходимо войти в систему." ? "Войдите, чтобы видеть свои обмены." : undefined}
          actionLabel={error === "Необходимо войти в систему." ? "Войти" : "Обновить"}
          actionHref={error === "Необходимо войти в систему." ? "/auth/login" : undefined}
          onAction={error !== "Необходимо войти в систему." ? () => loadSwaps() : undefined}
        />
      ) : data.incoming.length === 0 && data.outgoing.length === 0 ? (
        <EmptyState
          title="У вас пока нет обменов"
          description="Начните обмен через каталог или свайп."
          actionLabel="Перейти в каталог"
          actionHref="/catalog"
        />
      ) : list.length === 0 ? (
        <EmptyState
          title={activeTab === 'incoming' ? 'Нет входящих обменов' : 'Нет исходящих обменов'}
          description={activeTab === 'incoming' ? 'Вам ещё не предлагали обмен.' : 'Вы ещё не отправляли предложений.'}
          actionLabel="Перейти в каталог"
          actionHref="/catalog"
        />
      ) : (
        <div className="space-y-4">
          {list.map((entry) => {
            const { swap, fromItem, toItem } = entry;
            const isIncoming = activeTab === 'incoming';
            const isPending = swap.status === 'PENDING';
            const isAccepted = swap.status === 'ACCEPTED';
            const isCancelled = swap.status === 'CANCELLED';
            const cancelledAfterAccepted = isCancelled && Boolean(swap.acceptedAt);
            const currentUserId = session?.user?.id;
            const currentUserCompleted = currentUserId
              ? (currentUserId === swap.senderId ? swap.senderCompleted : swap.receiverCompleted)
              : false;
            const waitingCounterparty = swap.status === 'ACCEPTED' && currentUserCompleted;
            const counterpartCompleted = currentUserId
              ? (currentUserId === swap.senderId ? swap.receiverCompleted : swap.senderCompleted)
              : false;
            const borderColor =
              swap.status === 'PENDING'
                ? '#2563eb'
                : swap.status === 'ACCEPTED'
                ? '#22c55e'
                : swap.status === 'COMPLETED'
                ? '#64748b'
                : swap.status === 'CANCELLED'
                ? '#f59e0b'
                : '#ef4444';

            const fromImage = fromItem?.images?.[0];
            const toImage = toItem?.images?.[0];

            return (
              <Card
                key={swap.id}
                ref={(node) => {
                  swapCardRefs.current[swap.id] = node;
                }}
                className={cn(
                  'flex flex-col items-stretch gap-4 border-l-4 p-4 transition md:flex-row',
                  focusedSwapId === swap.id && 'ring-2 ring-menarium-purple/70 ring-offset-2 ring-offset-background bg-menarium-purple/5',
                )}
                style={{ borderColor }}
              >
                <div className="flex-1 space-y-3">
                  <div className="font-semibold">
                    {isIncoming ? 'Вам предложили обмен' : 'Вы предложили обмен'}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex gap-2">
                      <div className="w-16 h-16 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden">
                        {fromImage ? (
                          <img src={fromImage} alt={fromItem?.title || 'Объявление'} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-400 px-1 text-center">Нет фото</span>
                        )}
                      </div>
                      <div className="text-sm">
                        <div className="font-medium mb-0.5">Предлагают</div>
                        {fromItem ? (
                          <>
                            <Link
                              href={`/item/${fromItem.id}?from=exchange`}
                              className="block text-blue-600 hover:underline"
                            >
                              {fromItem.title}
                            </Link>
                            <div className="text-xs text-slate-500">{fromItem.city}</div>
                          </>
                        ) : (
                          <div className="text-xs text-slate-400">Объявление недоступно</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-16 h-16 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden">
                        {toImage ? (
                          <img src={toImage} alt={toItem?.title || 'Объявление'} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-400 px-1 text-center">Нет фото</span>
                        )}
                      </div>
                      <div className="text-sm">
                        <div className="font-medium mb-0.5">Хотят</div>
                        {toItem ? (
                          <>
                            <Link
                              href={`/item/${toItem.id}?from=exchange`}
                              className="block text-blue-600 hover:underline"
                            >
                              {toItem.title}
                            </Link>
                            <div className="text-xs text-slate-500">{toItem.city}</div>
                          </>
                        ) : (
                          <div className="text-xs text-slate-400">Объявление недоступно</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-xs font-medium",
                      swap.status === 'PENDING' && 'text-blue-600',
                      swap.status === 'ACCEPTED' && 'text-green-600',
                      swap.status === 'DECLINED' && 'text-red-600',
                      swap.status === 'COMPLETED' && 'text-slate-500',
                      swap.status === 'CANCELLED' && 'text-amber-600',
                    )}
                  >
                    {statusLabels[swap.status] || swap.status}
                  </div>
                  {isPending && (
                    <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-700">
                      Сделка активна. Ожидается решение по обмену.
                    </div>
                  )}
                  {isAccepted && (
                    <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700">
                      Сделка активна. Обмен принят.
                    </div>
                  )}
                  {swap.status === 'COMPLETED' && (
                    <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700">
                      <div className="font-semibold">Сделка завершена 🎉</div>
                      <div className="mt-0.5 text-xs">Объявления перемещены в архив</div>
                    </div>
                  )}
                  {isCancelled && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700">
                      <div className="font-semibold">
                        {cancelledAfterAccepted ? 'Сделка отменена' : 'Предложение отозвано'}
                      </div>
                      <div className="mt-0.5 text-xs">
                        {cancelledAfterAccepted
                          ? 'Объявления возвращены в активные, если не участвуют в другой сделке'
                          : 'Отправитель отозвал предложение до принятия'}
                      </div>
                    </div>
                  )}
                  {isAccepted && (
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Вы:</span>
                        <span className={cn(currentUserCompleted ? 'text-green-500' : 'text-amber-500')}>
                          {currentUserCompleted ? 'Подтверждено' : 'Ожидается'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Второй участник:</span>
                        <span className={cn(counterpartCompleted ? 'text-green-500' : 'text-amber-500')}>
                          {counterpartCompleted ? 'Подтверждено' : 'Ожидается'}
                        </span>
                      </div>
                    </div>
                  )}
                  {waitingCounterparty && (
                    <div className="text-xs text-amber-600">
                      Вы подтвердили сделку. Ожидаем второго участника.
                    </div>
                  )}
                  {activeTab === 'outgoing' && swap.status === 'PENDING' && (
                    <div className="space-y-2">
                      <div className="text-xs text-slate-500">Ожидает решения второй стороны.</div>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={Boolean(actionLoadingId)}
                        onClick={() => handleAction(swap.id, 'revoke')}
                      >
                        {actionLoadingId === `${swap.id}:revoke` ? 'Отзыв...' : 'Отозвать предложение'}
                      </Button>
                    </div>
                  )}
                  {swap.status === 'ACCEPTED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => openDealChat(swap.id)}
                    >
                      Чат обмена
                    </Button>
                  )}
                  {swap.status === 'COMPLETED' && (
                    <div className="text-sm text-slate-500 mt-2">Обмен завершён. Чат закрыт.</div>
                  )}
                  {isCancelled && (
                    <div className="text-sm text-slate-500 mt-2">
                      {cancelledAfterAccepted ? 'Сделка отменена. Чат закрыт.' : 'Предложение отозвано. Чат закрыт.'}
                    </div>
                  )}
                </div>

                {/* Кнопки действий только для входящих (вы владелец целевого объявления) */}
                <div className="flex flex-col gap-2 justify-center min-w-[140px]">
                  {activeTab === 'incoming' && isPending && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        disabled={actionLoadingId !== null}
                        onClick={() => handleAction(swap.id, 'accept')}
                      >
                        {actionLoadingId === `${swap.id}:accept` ? 'Принятие...' : 'Принять'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={actionLoadingId !== null}
                        onClick={() => handleAction(swap.id, 'decline')}
                      >
                        {actionLoadingId === `${swap.id}:decline` ? 'Отклонение...' : 'Отклонить'}
                      </Button>
                    </>
                  )}
                  {isAccepted && swap.status !== 'COMPLETED' && !isCancelled && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={Boolean(actionLoadingId) || currentUserCompleted}
                        onClick={() => handleAction(swap.id, 'complete')}
                      >
                        {actionLoadingId === `${swap.id}:complete`
                          ? 'Подтверждение...'
                          : currentUserCompleted
                          ? 'Подтверждено'
                          : 'Завершить сделку'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={Boolean(actionLoadingId)}
                        onClick={() => handleAction(swap.id, 'cancel')}
                      >
                        {actionLoadingId === `${swap.id}:cancel` ? 'Отмена...' : 'Отменить сделку'}
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Модалка чата обмена */}
      <Dialog open={!!chatSwapId} onOpenChange={(open) => { if (!open) setChatSwapId(null); }}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Чат обмена</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 flex flex-col gap-2">
            {dealChatClosed && (
              <p className="text-sm text-slate-500">Обмен завершён. Чат закрыт.</p>
            )}
            <div className="flex-1 overflow-y-auto border rounded-lg p-3 bg-slate-50 min-h-[200px] space-y-2">
              {dealMessages.length === 0 && !dealChatError && (
                <p className="text-sm text-slate-500">Сообщений пока нет.</p>
              )}
              {dealMessages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'text-sm p-2 rounded-lg max-w-[85%]',
                    m.senderId === session?.user?.id
                      ? 'ml-auto bg-blue-100 text-blue-900'
                      : 'mr-auto bg-slate-200 text-slate-800'
                  )}
                >
                  {m.text}
                  <div className="text-xs text-slate-500 mt-0.5">{new Date(m.createdAt).toLocaleTimeString()}</div>
                </div>
              ))}
              <div ref={dealMessagesEndRef} />
            </div>
            {dealChatError && <p className="text-sm text-red-600">{dealChatError}</p>}
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                placeholder="Введите сообщение..."
                value={dealChatInput}
                onChange={(e) => setDealChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendDealMessage()}
                disabled={dealChatClosed}
              />
              <Button onClick={sendDealMessage} disabled={!dealChatInput.trim() || dealChatLoading || dealChatClosed}>
                {dealChatLoading ? '…' : 'Отправить'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
