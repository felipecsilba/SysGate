import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import MunicipioBadge from './MunicipioBadge'
import useMunicipioStore from '../stores/municipioStore'
import useAuthStore from '../stores/authStore'

export default function Layout() {
  const carregarMunicipios = useMunicipioStore((s) => s.carregarMunicipios)
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    carregarMunicipios()
  }, [carregarMunicipios])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar fixa */}
      <Sidebar />

      {/* Área principal */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 font-medium tracking-wide">Krakion Labs</span>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-700">Toolkit Implantador</span>
          </div>

          <div className="flex items-center gap-3">
            <MunicipioBadge />
            {usuario && (
              <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-700 leading-tight">{usuario.nome}</p>
                  {usuario.role === 'admin' && (
                    <span className="text-xs text-sysgate-600 font-medium">admin</span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                  title="Sair do sistema"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Conteúdo scrollável */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
