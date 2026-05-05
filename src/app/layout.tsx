import './globals.css'
import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthSessionProvider } from '@/components/auth-session-provider'
import Navbar from '@/components/Navbar' // ✅ вот так правильно
import Footer from '@/components/Footer'


const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Менариум - Платформа обмена вещами',
  description: 'Обменивайтесь вещами с другими пользователями без денег',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${spaceGrotesk.className}`}>
        <AuthSessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-grow pt-[4.75rem] pb-24 lg:pb-0">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
