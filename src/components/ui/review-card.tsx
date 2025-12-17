import type { Review } from '~/data/mock-reviews'
import { getRatingEmoji, getTimeAgo } from '~/data/mock-reviews'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

interface ReviewCardProps {
  review: Review
}

export function ReviewCard({ review }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const maxContentLength = 256
  const shouldTruncate = review.content.length > maxContentLength
  const displayedContent = isExpanded
    ? review.content
    : review.content.slice(0, maxContentLength).replace(/\n/g, ' ')

  // Get user initials for placeholder
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="border-b border-neutral-800 px-4 py-3 hover:bg-neutral-800/50 transition-colors cursor-pointer">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        {review.avatarUrl ? (
          <img
            src={review.avatarUrl}
            alt={review.userDisplayName}
            className="w-8 h-8 rounded-full shrink-0 object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-emerald-600 shrink-0 flex items-center justify-center text-xs font-bold text-white">
            {getInitials(review.userDisplayName)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap text-sm">
            <Link to={`/u/${review.userId}` as any} className="font-bold text-white hover:underline">
              {review.userDisplayName}
            </Link>
            <span className="text-neutral-500">has rated</span>
            <Link to={`/stuff/${review.stuffName.toLowerCase().replace(/\s+/g, '-')}` as any} className="font-semibold text-white hover:underline">
              {review.stuffName}
            </Link>
            <span className="text-neutral-500">•</span>
            <span className="text-neutral-500">{getTimeAgo(review.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Rating and Title */}
      <h3 className="text-lg md:text-xl font-bold text-white mb-2 ml-11">
        {getRatingEmoji(review.rating)} {review.rating}/10 - {review.title}
      </h3>

      {/* Content */}
      <div className="ml-11 mb-3">
        <p className="text-slate-200 text-sm leading-normal whitespace-pre-wrap wrap-break-word inline">
          {displayedContent}
          {shouldTruncate && !isExpanded && '...'}
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-neutral-500 hover:text-neutral-400 text-sm font-semibold transition-colors cursor-pointer ml-1"
            >
              {isExpanded ? 'See less' : 'See more'}
            </button>
          )}
        </p>
      </div>

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="ml-11 mb-3">
          {review.images.length === 1 ? (
            <img
              src={review.images[0]}
              alt="Review image"
              className="block aspect-video object-cover rounded"
            />
          ) : (
            <div className="flex gap-2">
              {review.images.map((image, idx) => (
                <div key={idx} className="flex-1 aspect-square">
                  <img
                    src={image}
                    alt={`Review image ${idx + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {
        review.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 ml-11">
            {review.tags.map((tag) => (
              <a
                key={tag}
                href={`#${tag}`}
                className="text-neutral-500 hover:text-white transition-colors text-sm"
              >
                #{tag}
              </a>
            ))}
          </div>
        )
      }

    </div >
  )
}
