import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { DetailLayout, TabLayout } from './components/Layout'
import { FullPageSpinner } from './components/States'
import { ItemsPage } from './pages/ItemsPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { TripFormPage } from './pages/TripFormPage'
import { TripsPage } from './pages/TripsPage'
import { paths } from './paths'

// The item detail page pulls in Recharts (large), so it gets its own chunk.
const ItemDetailPage = lazy(() => import('./pages/ItemDetailPage').then((m) => ({ default: m.ItemDetailPage })))

export function App() {
  return (
    <Routes>
      <Route path={paths.login} element={<LoginPage />} />
      <Route path={paths.register} element={<RegisterPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<TabLayout />}>
          <Route index element={<ItemsPage />} />
          <Route path="trips" element={<TripsPage />} />
        </Route>
        <Route element={<DetailLayout />}>
          <Route
            path="items/:id"
            element={
              <Suspense fallback={<FullPageSpinner />}>
                <ItemDetailPage />
              </Suspense>
            }
          />
          <Route path="trips/new" element={<TripFormPage />} />
          <Route path="trips/:id" element={<TripFormPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={paths.items} replace />} />
    </Routes>
  )
}
