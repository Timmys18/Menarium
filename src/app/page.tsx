import { GlassCard } from "@/components/menarium/GlassCard";
import { IconContainer } from "@/components/menarium/IconContainer";
import { LinkButton } from "@/components/menarium/LinkButton";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="relative w-full overflow-hidden border-b border-white/5">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-menarium-teal/10 via-background to-background"
            aria-hidden
          />
          <div className="container relative mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center py-16 text-center md:py-24 lg:py-32">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
                Бартер без лишнего
              </p>
              <h1 className="max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                Меняйся <span className="gradient-text-brand">просто</span>
              </h1>
              <p className="mx-auto mt-4 max-w-[34rem] text-base text-muted-foreground md:text-xl">
                Мечты по бартеру
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <LinkButton href="/exchange" variant="primary">
                  Начать обмен
                </LinkButton>
                <LinkButton href="/about" variant="secondary">
                  Узнать больше
                </LinkButton>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full border-b border-white/5 bg-secondary/20 py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="mb-4 text-center text-3xl font-bold tracking-tight md:text-4xl">
              Почему Менариум?
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
              Всё для спокойного обмена в одном месте
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
              <GlassCard variant="hover" className="flex flex-col items-center gap-4 p-8 text-center">
                <IconContainer variant="gradient" size="md" aria-hidden>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                      clipRule="evenodd"
                    />
                  </svg>
                </IconContainer>
                <h3 className="text-xl font-semibold tracking-tight">Быстро и просто</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Интуитивно понятный интерфейс и быстрый процесс обмена
                </p>
              </GlassCard>

              <GlassCard variant="hover" className="flex flex-col items-center gap-4 p-8 text-center">
                <IconContainer variant="gradient" size="md" aria-hidden>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </IconContainer>
                <h3 className="text-xl font-semibold tracking-tight">Безопасно</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Проверенные пользователи и безопасные сделки
                </p>
              </GlassCard>

              <GlassCard variant="hover" className="flex flex-col items-center gap-4 p-8 text-center">
                <IconContainer variant="gradient" size="md" aria-hidden>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </IconContainer>
                <h3 className="text-xl font-semibold tracking-tight">Сообщество</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Активное сообщество людей, готовых к обмену
                </p>
              </GlassCard>
            </div>
          </div>
        </section>

        <section className="w-full py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <GlassCard className="mx-auto max-w-3xl px-8 py-10 text-center md:px-12 md:py-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Готовы начать обмен?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground md:text-lg">
                Присоединяйтесь к нашему сообществу и начните обмениваться уже сегодня
              </p>
              <div className="mt-8 flex justify-center">
                <LinkButton href="/auth/register" variant="primary">
                  Зарегистрироваться
                </LinkButton>
              </div>
            </GlassCard>
          </div>
        </section>
      </main>
    </div>
  );
}
