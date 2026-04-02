'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

interface EPKBioProps {
  bio: string
}

export default function EPKBio({ bio }: EPKBioProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const paragraphs = bio.split('\n\n')
  const preview = paragraphs.slice(0, 2).join('\n\n')
  const hasMore = paragraphs.length > 2

  return (
    <div className="w-full sm:w-3/4 mx-auto prose prose-invert prose-xl">
      <div className="text-white text-lg sm:text-xl leading-relaxed">
        <ReactMarkdown
          rehypePlugins={[rehypeRaw, rehypeSanitize]}
          remarkPlugins={[remarkGfm]}
        >
          {isExpanded ? bio : preview}
        </ReactMarkdown>
      </div>
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 text-white text-sm uppercase opacity-60 hover:opacity-100 transition-opacity underline"
        >
          {isExpanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  )
}
