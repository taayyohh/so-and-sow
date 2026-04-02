import type { Metadata } from 'next';
import { Space_Mono } from 'next/font/google';
import './globals.css';
import RootLayoutClient from './RootLayoutClient';

const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Sow & So | Nappy Nina',
  description: 'Sow & So - the new album from Nappy Nina. Pre-order vinyl now.',
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
