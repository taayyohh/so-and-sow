import type { Metadata } from 'next';
import { Space_Mono } from 'next/font/google';
import './globals.css';
import RootLayoutClient from './RootLayoutClient';

const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-mono' });

const BASE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://sowandso.nappynina.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Sow & So | Nappy Nina & Swarvy',
    template: '%s | Sow & So',
  },
  description: 'Pre-order Sow & So, the new album from Nappy Nina & Swarvy on vinyl. Limited edition.',
  keywords: ['Nappy Nina & Swarvy', 'Sow & So', 'vinyl', 'hip-hop', 'Lucid Haus', 'pre-order', 'album'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Sow & So — Nappy Nina & Swarvy',
    title: 'Sow & So | Nappy Nina & Swarvy',
    description: 'Pre-order Sow & So, the new album from Nappy Nina & Swarvy on vinyl. Limited edition.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Sow & So — Nappy Nina & Swarvy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sow & So | Nappy Nina & Swarvy',
    description: 'Pre-order Sow & So, the new album from Nappy Nina & Swarvy on vinyl. Limited edition.',
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${spaceMono.variable} font-sans bg-black text-white antialiased text-sm`}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
