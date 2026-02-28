import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import Header from '@/components/layout/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'WorldStory — Платформа для писателей и читателей',
  description:
    'Создавайте миры, пишите истории, находите читателей.',
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
    <html lang="ru" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="min-h-[calc(100vh-64px)]">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}