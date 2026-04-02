import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const existingEpk = await prisma.ePK.findUnique({ where: { slug: 'so-and-sow' } });
  if (existingEpk) {
    console.log('EPK already exists, skipping seed.');
    return;
  }

  const epk = await prisma.ePK.create({
    data: {
      title: 'So And Sow',
      slug: 'so-and-sow',
      type: 'ALBUM',
      bio: `Nappy Nina is a rapper and vocalist from Oakland, CA based in Brooklyn, NY. Known for her intricate wordplay and fluid delivery, she has been a rising force in underground hip-hop.

Her music blends jazz-influenced production with sharp, introspective lyricism. With multiple critically acclaimed projects, Nina continues to push the boundaries of hip-hop.

"So And Sow" is her latest full-length album, exploring themes of growth, harvest, and the cyclical nature of creative work.`,
      heroVideoSrc: '/nina-epk-assets/NINA-n-SWARV-in-PARIS_edit1.mp4',
      heroVideoPoster: '/nina-epk-assets/nina-20.jpg',
      isPublished: true,
      liveVideos: [
        { youtubeId: 'dQw4w9WgXcQ', title: 'Live at Brooklyn Steel' },
      ],
      pressLinks: {
        create: [
          { outlet: 'Pitchfork', url: 'https://pitchfork.com', description: 'Album Review', sortOrder: 0 },
          { outlet: 'The FADER', url: 'https://thefader.com', description: 'Feature', sortOrder: 1 },
          { outlet: 'Bandcamp Daily', url: 'https://daily.bandcamp.com', description: 'Best New Hip-Hop', sortOrder: 2 },
          { outlet: 'OkayPlayer', url: 'https://okayplayer.com', description: 'Interview', sortOrder: 3 },
        ],
      },
      photos: {
        create: [
          { src: '/nina-epk-assets/nina-20.jpg', alt: 'Nappy Nina press photo', sortOrder: 0 },
          { src: '/nina-epk-assets/nina-29.jpg', alt: 'Nappy Nina press photo 2', sortOrder: 1 },
          { src: '/nina-epk-assets/nina-35.jpg', alt: 'Nappy Nina press photo 3', sortOrder: 2 },
          { src: '/nina-epk-assets/nina-9.jpg', alt: 'Nappy Nina press photo 4', sortOrder: 3 },
        ],
      },
      tourGraphics: {
        create: [
          { src: '/nina-epk-assets/Nappy-Nina-Tour-Poster-12x18-2.jpg', title: 'Tour Poster', sortOrder: 0 },
          { src: '/nina-epk-assets/NappyNina_EuroTour_2025_4x5.png', title: 'Euro Tour 2025', sortOrder: 1 },
          { src: '/nina-epk-assets/west-coast-tour.jpg', title: 'West Coast Tour', sortOrder: 2 },
        ],
      },
    },
  });

  console.log('Created EPK:', epk.title);
  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
