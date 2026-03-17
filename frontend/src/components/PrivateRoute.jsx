import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../stores/authStore'

export default function PrivateRoute() {
  const isAutenticado = useAuthStore((s) => s.isAutenticado())
  if (!isAutenticado) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

export function AdminRoute() {
  const usuario = useAuthStore((s) => s.usuario)
  if (!usuario) return <Navigate to="/login" replace />
  if (usuario.role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}
