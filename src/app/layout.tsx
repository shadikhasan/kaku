import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/components/language-provider';
import { PwaProvider } from '@/components/pwa-provider';

export const metadata: Metadata = {
  title: 'Kaku — A little Japanese, every day',
  description: 'Find your flow with Japanese handwriting. Learn hiragana and katakana through stroke guides, tracing, and writing from memory.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Kaku', statusBarStyle: 'default' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#4c6542' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><LanguageProvider><PwaProvider>{children}</PwaProvider></LanguageProvider></body></html>;
}
