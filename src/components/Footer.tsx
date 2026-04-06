import Link from "next/link";
import { GlassCard } from "@/components/menarium";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-background/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-8">
        <GlassCard variant="base" className="p-6 md:p-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-foreground">Менариум</h3>
              <p className="text-sm text-muted-foreground">
                Платформа для безопасного обмена товарами и услугами
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold text-foreground">Навигация</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/items"
                    className="text-sm text-white/60 transition-colors hover:text-primary"
                  >
                    Обмен
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-sm text-white/60 transition-colors hover:text-primary"
                  >
                    О нас
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold text-foreground">Поддержка</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/faq"
                    className="text-sm text-white/60 transition-colors hover:text-primary"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-white/60 transition-colors hover:text-primary"
                  >
                    Контакты
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Правовая информация
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-white/60 transition-colors hover:text-primary"
                  >
                    Политика конфиденциальности
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-white/60 transition-colors hover:text-primary"
                  >
                    Условия использования
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Менариум. Все права защищены.
          </div>
        </GlassCard>
      </div>
    </footer>
  );
}
