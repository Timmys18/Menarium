import { GlassCard } from '@/components/menarium';
import { EmptyState } from '@/components/ui/empty-state';

export default function ProfileChatsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-6 py-10">
      <GlassCard className="p-6 md:p-8">
        <EmptyState
          title="Мои чаты"
          description="Раздел чатов будет доступен в ближайшее время"
          actionLabel="Вернуться в профиль"
          actionHref="/profile"
        />
      </GlassCard>
    </div>
  );
}
