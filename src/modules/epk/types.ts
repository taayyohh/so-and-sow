export interface EPKPressLink {
  id: string
  outlet: string
  url: string
  description?: string | null
  sortOrder: number
}

export interface EPKPhoto {
  id: string
  src: string
  alt: string
  sortOrder: number
}

export interface EPKTourGraphic {
  id: string
  src: string
  title: string
  sortOrder: number
}

export interface EPKVideo {
  src: string
  poster?: string
}

export interface EPKPageData {
  id: string
  title: string
  slug: string
  type: 'ALBUM' | 'TOUR'
  bio: string
  heroVideoSrc?: string | null
  heroVideoPoster?: string | null
  pressLinks: EPKPressLink[]
  photos: EPKPhoto[]
  tourGraphics: EPKTourGraphic[]
  liveVideos?: Array<{ youtubeId: string; title: string }> | null
  artist: {
    name: string
    slug: string
  }
  album?: {
    title: string
    slug: string
  } | null
}
