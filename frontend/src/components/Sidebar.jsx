import { NavLink } from 'react-router-dom'
import useAuthStore from '../stores/authStore'

function Icon({ children }) {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const ICONS = {
  dashboard: (
    <Icon>
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </Icon>
  ),
  municipios: (
    <Icon>
      <path d="M3 21h18M6 21V7l6-4 6 4v14M9 21v-4h6v4"/>
    </Icon>
  ),
  sistemas: (
    <Icon>
      <path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5"/>
    </Icon>
  ),
  sandbox: (
    <Icon>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </Icon>
  ),
  envioLote: (
    <Icon>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
    </Icon>
  ),
  scripts: (
    <Icon>
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>
    </Icon>
  ),
  historico: (
    <Icon>
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </Icon>
  ),
  usuarios: (
    <Icon>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </Icon>
  ),
}

const BASE_NAV_ITEMS = [
  { to: '/',            label: 'Dashboard',         icon: ICONS.dashboard,  exact: true },
  { to: '/municipios',  label: 'Municípios',        icon: ICONS.municipios },
  { to: '/sistemas',    label: 'Sistemas',          icon: ICONS.sistemas },
  { to: '/sandbox',     label: 'Sandbox',            icon: ICONS.sandbox },
  { to: '/envio-lote',  label: 'Envio em Lote',     icon: ICONS.envioLote },
  { to: '/scripts',     label: 'Scripts & Ferramentas', icon: ICONS.scripts },
  { to: '/historico',   label: 'Histórico',         icon: ICONS.historico },
]

export default function Sidebar() {
  const usuario = useAuthStore((s) => s.usuario)

  const navItems = [
    ...BASE_NAV_ITEMS,
    {
      to: '/usuarios',
      label: usuario?.role === 'admin' ? 'Usuários' : 'Meu Perfil',
      icon: ICONS.usuarios,
    },
  ]

  return (
    <aside className="w-56 flex flex-col bg-gray-900 text-gray-100 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <img
          src="/logo-sem-nome.png"
          alt="Krakion Labs"
          className="w-8 h-8 object-contain shrink-0 mix-blend-multiply brightness-200"
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <div>
          <div className="font-semibold text-sm leading-tight text-white">Krakion Labs</div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-3">
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
                  ? 'bg-sysgate-600 text-white shadow-sm'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer da sidebar */}
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-xs text-gray-400 text-center">
          Krakion Labs © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  )
}
