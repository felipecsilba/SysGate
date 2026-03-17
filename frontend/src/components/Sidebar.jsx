import { NavLink } from 'react-router-dom'
import useAuthStore from '../stores/authStore'

const BASE_NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '◉', exact: true },
  { to: '/municipios', label: 'Municípios', icon: '🏛' },
  { to: '/sistemas', label: 'Sistemas', icon: '⚙' },
  { to: '/cliente-api', label: 'Cliente API', icon: '⚡' },
  { to: '/envio-lote', label: 'Envio em Lote', icon: '📦' },
  { to: '/scripts', label: 'Scripts & Ferramentas', icon: '🔧' },
  { to: '/historico', label: 'Histórico', icon: '🕑' },
]

export default function Sidebar() {
  const usuario = useAuthStore((s) => s.usuario)

  const navItems = [
    ...BASE_NAV_ITEMS,
    ...(usuario?.role === 'admin' ? [{ to: '/usuarios', label: 'Usuários', icon: '👥' }] : []),
  ]

  return (
    <aside className="w-56 flex flex-col bg-gray-900 text-gray-100 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
        <div className="w-8 h-8 bg-sysgate-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          B
        </div>
        <div>
          <div className="font-semibold text-sm leading-tight">SysGate</div>
          <div className="text-xs text-gray-400">Implantador v1.0</div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
          Menu
        </p>
        {navItems.map(({ to, label, icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sysgate-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="text-base leading-none">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer da sidebar — nome do usuário logado */}
      <div className="px-4 py-3 border-t border-gray-700">
        {usuario && (
          <div className="mb-1">
            <p className="text-xs text-gray-300 font-medium truncate">{usuario.nome}</p>
            <p className="text-xs text-gray-500">{usuario.role}</p>
          </div>
        )}
        <p className="text-xs text-gray-600 text-center">
          SysGate © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  )
}
