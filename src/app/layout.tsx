import type { Metadata, Viewport } from 'next';
import { Inter, Lora } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import Header from '@/components/layout/Header';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

const lora = Lora({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-lora',
});

export const metadata: Metadata = {
  title: 'WorldStory — Платформа для писателей и читателей',
  description: 'Создавайте миры, пишите истории, находите читателей.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#B07D3B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${inter.variable} ${lora.variable}`}
    >
      <body className="font-sans">
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="min-h-[calc(100vh-56px)]">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}