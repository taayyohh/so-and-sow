import { prisma } from '@/lib/prisma';
import EPKPageComponent from '@/modules/epk/components/EPKPage';
import type { EPKPageData } from '@/modules/epk/types';

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
