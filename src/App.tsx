import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import ErrorBoundary from '@/components/ErrorBoundary'
import { DataProvider } from '@/data/provider'
import { PageSkeleton } from '@/components/Skeleton'
import LoginPage from '@/features/auth/LoginPage'
import { useAuth } from '@/features/auth/useAuth'
import SharePage from '@/features/share/SharePage'
import ListDetailPage from '@/features/lists/ListDetailPage'
import ListsPage from '@/features/lists/ListsPage'
import WantPage from '@/features/want/WantPage'
import QuickAddPage from '@/features/onboarding/QuickAddPage'
import MapPage from '@/features/map/MapPage'
import LibraryPage from '@/features/library/LibraryPage'
import PlacePage from '@/features/place/PlacePage'
import LogPage from '@/features/log/LogPage'
import Layout from '@/routes/Layout'

function Gate() {
  const { user, loading } = useAuth()
  if (loading) return <div className="mx-auto max-w-md p-6"><PageSkeleton label="Loading" /></div>
  if (!user) return <LoginPage />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/library" replace />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="place/:id" element={<PlacePage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="log" element={<LogPage />} />
        <Route path="welcome" element={<QuickAddPage />} />
        <Route path="want" element={<WantPage />} />
        <Route path="lists" element={<ListsPage />} />
        <Route path="lists/:id" element={<ListDetailPage />} />
        <Route path="*" element={<Navigate to="/library" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
    <DataProvider>
      <BrowserRouter>
        <Routes>
          {/* Public: viewable without an account */}
          <Route path="/s/:token" element={<SharePage />} />
          <Route path="*" element={<Gate />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
    </ErrorBoundary>
  )
}
