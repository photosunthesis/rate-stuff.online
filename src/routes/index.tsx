import { createFileRoute } from '@tanstack/react-router'
import { MainFeed } from '~/components/layout/main-feed'
import { Sidebar } from '~/components/layout/sidebar'
import { mockReviews } from '~/data/mock-reviews'

export const Route = createFileRoute('/')({ component: App })

function App() {
  // For now, all users are unauthenticated
  const isAuthenticated = false

  // Show first 12 reviews for unauthenticated users
  const displayedReviews = mockReviews.slice(0, 12)

  return (
    <div className="min-h-screen bg-neutral-900 flex font-sans justify-center">
      {/* Sidebar */}
      <Sidebar isAuthenticated={isAuthenticated} />

      {/* Main Feed */}
      <MainFeed reviews={displayedReviews} isAuthenticated={isAuthenticated} />

      {/* Empty spacer to center content */}
      <div className="w-64 hidden lg:block" />
    </div>
  )
}
