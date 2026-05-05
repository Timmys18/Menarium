import { ArrowLeftRight, Camera, ChevronDown, Grid3X3 } from 'lucide-react';
import { GlassCard } from '@/components/menarium/GlassCard';
import { LinkButton } from '@/components/menarium/LinkButton';

export default function Home() {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(59,127,255,0.18),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.16),transparent_35%)]"
        aria-hidden
      />
      <main className="container relative mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <div className="w-full max-w-4xl text-center">
            <h1 className="text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
              Меняйся <span className="gradient-text-brand">просто</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground sm:text-2xl">Мечты по бартеру</p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <LinkButton href="/exchange" variant="primary">
                <ArrowLeftRight className="size-4" />
                Начать обмен
              </LinkButton>
              <LinkButton href="/new" variant="secondary">
                <Camera className="size-4" />
                Загрузить товар
              </LinkButton>
            </div>

            <div className="mt-12 inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/40">
              Листай вниз
              <ChevronDown className="size-4" />
            </div>
          </div>
        </section>

        <section className="pb-6">
          <GlassCard className="border-white/10 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <LinkButton href="/catalog" variant="secondary">
                <Grid3X3 className="size-4" />
                Каталог
              </LinkButton>
              <LinkButton href="/swipe" variant="secondary">
                <ArrowLeftRight className="size-4" />
                Свайп
              </LinkButton>
            </div>
          </GlassCard>
        </section>
      </main>
    </div>
  );
}
