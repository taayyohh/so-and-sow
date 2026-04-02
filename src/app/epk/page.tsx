import { prisma } from '@/lib/prisma';
import EPKPageComponent from '@/modules/epk/components/EPKPage';
import type { EPKPageData } from '@/modules/epk/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EPK — Sow & So',
  description: 'Electronic Press Kit for Sow & So by Nappy Nina. Bio, press links, photos, and tour info.',
  openGraph: {
    title: 'Nappy Nina — Sow & So EPK',
    description: 'Electronic Press Kit for Sow & So by Nappy Nina.',
    images: [{ url: '/sow-and-so-black.jpg', width: 1920, height: 1080 }],
  },
};

export const dynamic = 'force-dynamic';

export default async function EPKPage() {
  const epk = await prisma.ePK.findUnique({
    where: { slug: 'so-and-sow' },
    include: {
      pressLinks: { orderBy: { sortOrder: 'asc' } },
      photos: { orderBy: { sortOrder: 'asc' } },
      tourGraphics: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!epk) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/60 text-sm">EPK not found. Run the seed script to populate data.</p>
      </div>
    );
  }

  const epkData: EPKPageData = {
    id: epk.id,
    title: epk.title,
    slug: epk.slug,
    type: epk.type as 'ALBUM' | 'TOUR',
    bio: epk.bio,
    heroVideoSrc: epk.heroVideoSrc,
    heroVideoPoster: epk.heroVideoPoster,
    pressLinks: epk.pressLinks,
    photos: epk.photos,
    tourGraphics: epk.tourGraphics,
    liveVideos: epk.liveVideos as any,
    artist: {
      name: 'Nappy Nina',
      slug: 'nappy-nina',
    },
    album: {
      title: 'So And Sow',
      slug: 'so-and-sow',
    },
  };

  return <EPKPageComponent epk={epkData} />;
}
