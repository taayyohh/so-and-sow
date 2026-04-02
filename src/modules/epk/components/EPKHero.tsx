'use client'

interface EPKHeroProps {
  videoSrc?: string | null
  videoPoster?: string | null
  artistName: string
}

export default function EPKHero({ videoSrc, videoPoster, artistName }: EPKHeroProps) {
  if (!videoSrc) return null

  return (
    <div className="relative w-full overflow-hidden">
      <div className="aspect-[9/16] sm:aspect-video max-h-[70vh] sm:max-h-none">
        <video
          src={videoSrc}
          poster={videoPoster || undefined}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover object-center"
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 sm:p-8">
        <h2 className="text-white text-xl sm:text-4xl font-bold uppercase opacity-80">
          {artistName}
        </h2>
      </div>
    </div>
  )
}
