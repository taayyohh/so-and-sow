'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Tabs, Tab } from '@/components/ui/Tabs'
import EPKHero from './EPKHero'
import EPKBio from './EPKBio'
import PressLinks from './PressLinks'
import PressPhotos from './PressPhotos'
import LiveVideos from './LiveVideos'
import { EPKPageData } from '../types'

interface EPKPageProps {
  epk: EPKPageData
}

export default function EPKPageComponent({ epk }: EPKPageProps) {
  const liveVideos = (epk.liveVideos || []) as Array<{ youtubeId: string; title: string }>

  return (
    <AnimatePresence>
      <motion.div
        variants={{
          closed: { y: 0, opacity: 0 },
          open: { y: 0, opacity: 1 },
        }}
        initial="closed"
        animate="open"
        exit="closed"
        className="min-h-screen bg-[#131313]"
      >
        <div className="w-full">
          <EPKHero
            videoSrc={epk.heroVideoSrc}
            videoPoster={epk.heroVideoPoster}
            artistName={epk.artist.name}
          />
        </div>

        <div className="mx-auto w-full sm:w-11/12 text-white">
          <div className="py-12 text-center">
            <h1 className="text-4xl sm:text-6xl font-bold uppercase">
              {epk.artist.name}
            </h1>
            {epk.album && (
              <p className="text-white/60 text-sm uppercase tracking-widest mt-4">
                {epk.album.title}
              </p>
            )}
          </div>

          <div className="mx-auto mb-20 w-11/12">
            <Tabs defaultTab="INFO">
              <Tab label="INFO">
                <div className="space-y-12">
                  <div>
                    <EPKBio bio={epk.bio} />
                  </div>
                  {epk.pressLinks.length > 0 && (
                    <div>
                      <h3 className="text-xl uppercase mb-6 text-center">Press</h3>
                      <PressLinks links={epk.pressLinks} />
                    </div>
                  )}
                  {liveVideos.length > 0 && (
                    <div>
                      <h3 className="text-xl uppercase mb-6 text-center">Live</h3>
                      <LiveVideos videos={liveVideos} />
                    </div>
                  )}
                </div>
              </Tab>

              <Tab label="PRESS PHOTOS">
                {epk.photos.length > 0 ? (
                  <PressPhotos photos={epk.photos} />
                ) : (
                  <p className="text-white/40 text-sm text-center py-8">No press photos available.</p>
                )}
              </Tab>

              <Tab label="TOUR">
                {epk.tourGraphics.length > 0 ? (
                  <PressPhotos tourGraphics={epk.tourGraphics} />
                ) : (
                  <p className="text-white/40 text-sm text-center py-8">No tour graphics available.</p>
                )}
              </Tab>
            </Tabs>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
