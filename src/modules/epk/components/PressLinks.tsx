'use client'

import { EPKPressLink } from '../types'

interface PressLinksProps {
  links: EPKPressLink[]
}

export default function PressLinks({ links }: PressLinksProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-white/[0.13] p-6 hover:bg-[#111] transition-colors group"
        >
          <div className="flex flex-col space-y-2">
            <div className="text-white font-bold uppercase text-sm group-hover:opacity-100 opacity-80">
              {link.outlet}
            </div>
            {link.description && (
              <div className="text-white text-xs opacity-60">{link.description}</div>
            )}
            <div className="text-white text-xs opacity-40 group-hover:opacity-60 transition-opacity">
              View &rarr;
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
