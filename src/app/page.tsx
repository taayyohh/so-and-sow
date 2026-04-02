import { prisma } from '@/lib/prisma';
import { ipfsUrl } from '@/lib/ipfs';
import Image from 'next/image';
import Link from 'next/link';
import PreorderButton from './PreorderButton';

export default async function HomePage() {
  const vinyl = await prisma.product.findFirst({
    where: { isActive: true, isArchived: false },
    include: { stock: true },
    orderBy: { isFeatured: 'desc' },
  });

  if (!vinyl) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-white/40 text-sm uppercase tracking-widest">Coming Soon</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 min-h-[calc(100vh-160px)] items-center">
        {/* Album art — click to see detail with all images */}
        <Link href={`/shop/${vinyl.slug}`}>
          {vinyl.images[0] && (
            <div className="relative aspect-square cursor-pointer hover:opacity-90 transition-opacity">
              <Image
                src={ipfsUrl(vinyl.images[0])}
                alt={vinyl.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          )}
        </Link>

        {/* Product info */}
        <div className="flex flex-col justify-center">
          <p className="text-xs tracking-[0.3em] uppercase text-white/40 mb-2">Nappy Nina &amp; Swarvy</p>
          <h1 className="text-2xl sm:text-3xl uppercase tracking-wide text-white mb-2">
            {vinyl.name}
          </h1>
          <p className="text-white/60 text-lg mb-8">${vinyl.price.toFixed(2)}</p>

          <PreorderButton product={vinyl} />

          {vinyl.description && (
            <p className="text-white/40 text-sm mt-8 leading-relaxed whitespace-pre-line">
              {vinyl.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
