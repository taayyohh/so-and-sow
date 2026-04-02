import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import RootLayoutClient from './RootLayoutClient';

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-inter' });

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
      <body className={`${inter.variable} font-sans bg-black text-white antialiased text-sm font-light`}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
