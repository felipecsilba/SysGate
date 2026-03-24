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
        {/* Barra de acento no topo */}
        <div className="h-0.5 bg-gradient-to-r from-sysgate-500 via-violet-500 to-indigo-400 shrink-0" />
        {/* Header */}
        <header className="flex items-center justify-end px-5 py-2.5 bg-white border-b border-gray-200 shrink-0 gap-3">
          <MunicipioBadge />
          {usuario && (
            <div className="flex items-center gap-2 border-l border-gray-100 pl-3">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full pl-1.5 pr-2.5 py-1">
                <span className="w-6 h-6 rounded-full bg-sysgate-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {usuario.nome.charAt(0).toUpperCase()}
                </span>
                <div className="leading-none">
                  <p className="text-xs font-semibold text-gray-700">{usuario.nome}</p>
                  {usuario.role === 'admin' && (
                    <p className="text-[10px] text-sysgate-600 font-medium">{usuario.role}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 font-medium"
                title="Sair do sistema"
              >
                Sair
              </button>
            </div>
          )}
        </header>

        {/* Conteúdo scrollável */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
