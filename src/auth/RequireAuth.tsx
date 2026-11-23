import { Navigate, Outlet, useLocation } from 'react-router'
import { FullPageSpinner } from '../components/States'
import { paths } from '../paths'
import { useAuth } from './AuthProvider'

export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageSpinner />
  if (!session) return <Navigate to={paths.login} replace state={{ from: location.pathname }} />
  return <Outlet />
}
