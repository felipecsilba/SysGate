import { Navigate, Outlet } from 'react-router-dom'
import usePortalAuthStore from '../stores/portalAuthStore'

// Guarda das rotas do portal externo — usa o store do solicitante (krakion-portal-auth)
export default function PortalRoute() {
  const isAutenticado = usePortalAuthStore((s) => s.isAutenticado())
  if (!isAutenticado) {
    return <Navigate to="/portal/login" replace />
  }
  return <Outlet />
}
