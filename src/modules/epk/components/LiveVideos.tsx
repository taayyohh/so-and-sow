'use client'

interface LiveVideosProps {
  videos: Array<{ youtubeId: string; title: string }>
}

export default function LiveVideos({ videos }: LiveVideosProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {videos.map((video, index) => (
        <div key={index} className="relative w-full">
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeId}`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border border-white/[0.13]"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
