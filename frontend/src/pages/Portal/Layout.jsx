import { Link, Outlet, useNavigate } from 'react-router-dom'
import usePortalAuthStore from '../../stores/portalAuthStore'

// Layout simplificado do portal externo — sem sidebar interna: header fixo + conteúdo
export default function PortalLayout() {
  const navigate = useNavigate()
  const solicitante = usePortalAuthStore((s) => s.solicitante)
  const logout = usePortalAuthStore((s) => s.logout)

  const handleSair = () => {
    logout()
    navigate('/portal/login', { replace: true })
  }

  const iniciais = (solicitante?.nome || '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50">
      {/* Barra de acento gradiente no topo (mesmo padrão do Layout interno) */}
      <div className="h-1 bg-gradient-to-r from-sysgate-600 via-violet-500 to-sysgate-600" />

      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/portal" className="flex items-center gap-3">
            <img
              src="/nova-logo.webp"
              alt="Krakion Labs"
              className="h-9 object-contain"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">Portal de Atendimento</p>
              <p className="text-[11px] text-gray-400 leading-tight">Krakion Labs</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-sysgate-50 rounded-full pl-1 pr-3 py-1">
              <span className="w-7 h-7 rounded-full bg-sysgate-600 text-white text-[11px] font-bold flex items-center justify-center">
                {iniciais}
              </span>
              <span className="text-sm text-gray-700 font-medium max-w-[160px] truncate">
                {solicitante?.nome}
              </span>
            </div>
            <button
              onClick={handleSair}
              className="text-sm text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="max-w-4xl mx-auto px-4 pb-6">
        <p className="text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Krakion Labs. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  )
}
