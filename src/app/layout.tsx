import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lupin — Japanese Vocabulary',
  description: 'Learn Japanese vocabulary through subculture. AI-powered spaced repetition.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lupin',
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0a0a14] text-[#e0d8f0]">
        {children}
      </body>
    </html>
  );
}
