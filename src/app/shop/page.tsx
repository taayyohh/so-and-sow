import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { ShopGrid } from './ShopGrid';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop | So And Sow',
  description: 'Browse the So And Sow collection.',
};

export default async function ShopPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true, isArchived: false },
    select: {
      id: true,
      name: true,
      slug: true,
      images: true,
      price: true,
      quantity: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-sm tracking-[0.3em] uppercase font-medium text-center mb-12">Shop</h1>
      {products.length === 0 ? (
        <p className="text-sm text-white/60 text-center py-16">No products available yet.</p>
      ) : (
        <ShopGrid products={products} />
      )}
    </div>
  );
}
