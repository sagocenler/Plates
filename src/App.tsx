import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { DataProvider } from '@/data/provider'
import LoginPage from '@/features/auth/LoginPage'
import { useAuth } from '@/features/auth/useAuth'
import LogPage from '@/features/log/LogPage'
import Layout from '@/routes/Layout'
import Placeholder from '@/routes/Placeholder'

function Gate() {
  const { user, loading } = useAuth()
  if (loading) return <p className="p-6 text-muted" role="status">Loading…</p>
  if (!user) return <LoginPage />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/library" replace />} />
        <Route path="library" element={<Placeholder title="Library" step={3} />} />
        <Route path="map" element={<Placeholder title="Map" step={4} />} />
        <Route path="log" element={<LogPage />} />
        <Route path="lists" element={<Placeholder title="Lists" step={5} />} />
        <Route path="*" element={<Navigate to="/library" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Gate />
      </BrowserRouter>
    </DataProvider>
  )
}
