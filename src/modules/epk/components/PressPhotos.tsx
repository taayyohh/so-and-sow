'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { EPKPhoto, EPKTourGraphic } from '../types'

interface PressPhotosProps {
  photos?: EPKPhoto[]
  tourGraphics?: EPKTourGraphic[]
}

export default function PressPhotos({ photos = [], tourGraphics = [] }: PressPhotosProps) {
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null)

  const handleDownload = (src: string, filename: string) => {
    const link = document.createElement('a')
    link.href = src
    link.download = filename
    link.click()
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  const allImages = [
    ...photos.map(p => ({ src: p.src, alt: p.alt, type: 'photo' as const })),
    ...tourGraphics.map(g => ({ src: g.src, alt: g.title, type: 'graphic' as const }))
  ]

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {allImages.map((image, index) => (
          <div key={index} className="relative group border border-white/[0.13] overflow-hidden aspect-square">
            <Image src={image.src} alt={image.alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                <button onClick={() => setSelectedImage(image)} className="bg-white text-black px-6 py-2 uppercase text-sm font-medium hover:bg-gray-200">View</button>
                <button onClick={() => handleDownload(image.src, image.src.split('/').pop() || 'download.jpg')} className="bg-white text-black px-6 py-2 uppercase text-sm font-medium hover:bg-gray-200">Download</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSelectedImage(null)} />
          <div className="relative z-10 bg-[#131313] border border-white/[0.13] rounded p-6 max-w-[90vw] max-h-[90vh] overflow-auto">
            <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 text-white bg-[#131313] hover:bg-[#111] rounded-full flex items-center justify-center border border-white/[0.13] text-sm h-10 w-10 z-20">X</button>
            <div className="flex flex-col items-center">
              <img src={selectedImage.src} alt={selectedImage.alt} className="max-w-full max-h-[75vh] object-contain" />
              <p className="text-white mt-4 text-sm opacity-60">{selectedImage.alt}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
