import type { Metadata } from 'next';
import { Inter, Caveat } from 'next/font/google';
import './globals.css';
import RootLayoutClient from './RootLayoutClient';

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-inter' });
const caveat = Caveat({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-caveat' });

export const metadata: Metadata = {
  title: 'So And Sow | Nappy Nina',
  description: 'So And Sow - the new album from Nappy Nina. Shop merch and explore the EPK.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${caveat.variable} font-sans bg-[#131313] text-white antialiased text-sm font-light`}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
