import { prisma } from '@/lib/prisma';
import { ipfsUrl } from '@/lib/ipfs';
import Image from 'next/image';
import Link from 'next/link';
import PreorderButton from './PreorderButton';

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true, isArchived: false },
    include: { stock: true },
    orderBy: { isFeatured: 'desc' },
  });

  if (products.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-white/40 text-sm uppercase tracking-widest">Coming Soon</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      {products.map((product, i) => (
        <section
          key={product.id}
          className={`grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 items-center py-12 sm:py-16 ${
            i > 0 ? 'border-t border-white/10' : 'min-h-[calc(100vh-160px)]'
          }`}
        >
          {/* Image */}
          <Link href={`/shop/${product.slug}`}>
            {product.images[0] && (
              <div className="relative aspect-square hover:opacity-90 transition-opacity">
                <Image
                  src={ipfsUrl(product.images[0])}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={i === 0}
                />
              </div>
            )}
          </Link>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <p className="text-xs tracking-[0.3em] uppercase text-white/40 mb-2">Nappy Nina &amp; Swarvy</p>
            <Link href={`/shop/${product.slug}`}>
              <h2 className={`uppercase tracking-wide text-white hover:text-white/80 transition-colors mb-2 ${
                i === 0 ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
              }`}>
                {product.name}
              </h2>
            </Link>
            <p className="text-white/60 text-lg mb-8">${product.price.toFixed(2)}</p>
            <PreorderButton product={product} />
            {product.description && product.description !== 'Description coming soon.' && (
              <p className="text-white/40 text-sm mt-8 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
