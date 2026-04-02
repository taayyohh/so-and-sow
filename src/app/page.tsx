import { prisma } from '@/lib/prisma';
import { ipfsUrl } from '@/lib/ipfs';
import Image from 'next/image';
import Link from 'next/link';
import PreorderButton from './PreorderButton';

export default async function HomePage() {
  // Get the featured/first product (the vinyl preorder)
  const vinyl = await prisma.product.findFirst({
    where: { isActive: true, isArchived: false },
    include: { stock: true },
    orderBy: { isFeatured: 'desc' },
  });

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-5xl sm:text-7xl font-bold tracking-widest uppercase text-white mb-2">
        SO AND SOW
      </h1>
      <p className="text-lg sm:text-xl tracking-[0.3em] uppercase text-white/60 mb-12">
        NAPPY NINA
      </p>

      {vinyl ? (
        <div className="max-w-md w-full">
          {vinyl.images[0] && (
            <div className="relative aspect-square border border-white-13 mb-6">
              <Image
                src={ipfsUrl(vinyl.images[0])}
                alt={vinyl.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          <div className="text-center mb-6">
            <h2 className="text-white text-lg uppercase">{vinyl.name}</h2>
            <p className="text-white/60 text-xl mt-1">${vinyl.price.toFixed(2)}</p>
          </div>
          <PreorderButton product={vinyl} />
        </div>
      ) : (
        <p className="text-white/40 text-sm uppercase tracking-widest">Coming Soon</p>
      )}

      <div className="flex gap-6 mt-12">
        <Link
          href="/shop"
          className="py-3 px-8 border border-white-13 text-white/60 text-sm tracking-widest uppercase hover:text-white hover:border-white transition-colors"
        >
          All Products
        </Link>
        <Link
          href="/epk"
          className="py-3 px-8 border border-white-13 text-white/60 text-sm tracking-widest uppercase hover:text-white hover:border-white transition-colors"
        >
          Press Kit
        </Link>
      </div>
    </div>
  );
}
