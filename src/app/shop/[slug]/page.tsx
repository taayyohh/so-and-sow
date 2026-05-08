import { prisma } from '@/lib/prisma';
import { ipfsUrl } from '@/lib/ipfs';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ProductDetailClient } from './ProductDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { name: true, description: true, images: true },
  });
  if (!product) return {};
  const ogImage = product.images[0] ? ipfsUrl(product.images[0]) : '/og-image.jpg';
  return {
    title: `${product.name} | Sow & So`,
    description: product.description || product.name,
    openGraph: {
      title: `${product.name} — Lucidhaus`,
      description: product.description || product.name,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} — Lucidhaus`,
      images: [ogImage],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { stock: true },
  });

  if (!product || !product.isActive || product.isArchived) {
    notFound();
  }

  return (
    <ProductDetailClient
      product={{
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        images: product.images,
        price: product.price,
        quantity: product.quantity,
        stock: product.stock.map(s => ({ size: s.size, quantity: s.quantity })),
      }}
    />
  );
}
