'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { Tabs, Tab } from '@/components/ui/Tabs'
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
        className="min-h-screen bg-black"
      >
        {/* Hero — Album Covers Side by Side */}
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative aspect-square">
              <Image
                src="/epk-cover-front.jpg"
                alt="Sow & So — Front Cover"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="relative aspect-square">
              <Image
                src="/epk-cover-back.jpg"
                alt="Sow & So — Back Cover"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
          <div className="text-center mt-6">
            <a
              href="https://untitled.stream/library/project/YMJSZLsRChFWae5XIMMUz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block py-3 px-8 border border-white/20 text-white text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-colors"
            >
              Listen to &ldquo;Hear Know&rdquo;
            </a>
          </div>
        </div>

        <div className="mx-auto w-full sm:w-11/12 text-white">
          <div className="py-12 text-center">
            <h1 className="text-4xl sm:text-6xl font-bold uppercase">
              {epk.artist.name} &amp; Swarvy
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
