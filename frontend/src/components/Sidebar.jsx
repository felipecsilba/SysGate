import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import useAuthStore from '../stores/authStore'

function SvgIcon({ children }) {
  return (
    <svg
      className="w-4 h-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

const ICONS = {
  dashboard: (
    <SvgIcon>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </SvgIcon>
  ),
  portfolio: (
    <SvgIcon>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </SvgIcon>
  ),
  chamados: (
    <SvgIcon>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </SvgIcon>
  ),
  ferramentas: (
    <SvgIcon>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </SvgIcon>
  ),
  configuracao: (
    <SvgIcon>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </SvgIcon>
  ),
  scripts: (
    <SvgIcon>
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
    </SvgIcon>
  ),
  analisadorJson: (
    <SvgIcon>
      <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />
      <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
    </SvgIcon>
  ),
  sandbox: (
    <SvgIcon>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </SvgIcon>
  ),
  envioLote: (
    <SvgIcon>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </SvgIcon>
  ),
  historico: (
    <SvgIcon>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </SvgIcon>
  ),
  sistemas: (
    <SvgIcon>
      <path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5" />
    </SvgIcon>
  ),
  municipios: (
    <SvgIcon>
      <path d="M3 21h18M6 21V7l6-4 6 4v14M9 21v-4h6v4" />
    </SvgIcon>
  ),
  usuarios: (
    <SvgIcon>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </SvgIcon>
  ),
}

// ─── Helpers de estilo ───────────────────────────────────────────────────────

const itemBase =
  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors'
const itemActive = 'bg-sysgate-600 text-white shadow-sm'
const itemInactive = 'text-gray-400 hover:bg-white/5 hover:text-gray-200'

function itemCls(active) {
  return `${itemBase} ${active ? itemActive : itemInactive}`
}

// ─── Chevron ─────────────────────────────────────────────────────────────────

function Chevron({ open }) {
  return (
    <svg
      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

// ─── Item simples ─────────────────────────────────────────────────────────────

function NavItem({ to, label, icon, exact }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) => itemCls(isActive)}
    >
      {icon}
      {label}
    </NavLink>
  )
}

// ─── Grupo expansível ─────────────────────────────────────────────────────────
// Expande automaticamente quando uma rota filha está ativa.
// O usuário também pode abrir/fechar manualmente.

function NavGroup({ label, icon, children, childRoutes }) {
  const { pathname } = useLocation()
  const isChildActive = childRoutes.some((r) => pathname === r)
  const [manualOpen, setManualOpen] = useState(false)
  const isOpen = isChildActive || manualOpen

  return (
    <div>
      <button
        onClick={() => setManualOpen((o) => !o)}
        className={`${itemCls(isChildActive)} w-full`}
      >
        {icon}
        <span className="flex-1 text-left">{label}</span>
        <Chevron open={isOpen} />
      </button>

      {isOpen && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-2.5">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const usuario = useAuthStore((s) => s.usuario)

  return (
    <aside className="w-56 flex flex-col bg-gray-900 text-gray-100 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <img
          src="/logo-sem-nome.png"
          alt="Krakion Labs"
          className="w-8 h-8 object-contain shrink-0 mix-blend-multiply brightness-200"
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
        <div className="font-semibold text-sm leading-tight text-white">Krakion Labs</div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-3">
          Menu
        </p>

        <NavItem to="/" label="Dashboard" icon={ICONS.dashboard} exact />
        <NavItem to="/portfolio" label="Portfólio" icon={ICONS.portfolio} />
        <NavItem to="/chamados" label="Chamados" icon={ICONS.chamados} />

        <NavGroup
          label="Ferramentas"
          icon={ICONS.ferramentas}
          childRoutes={['/scripts', '/analisador-json', '/sandbox', '/envio-lote', '/historico']}
        >
          <NavItem to="/scripts" label="Extensões" icon={ICONS.scripts} />
          <NavItem to="/analisador-json" label="Analisador JSON" icon={ICONS.analisadorJson} />
          <NavItem to="/sandbox" label="Sandbox" icon={ICONS.sandbox} />
          <NavItem to="/envio-lote" label="Envio em Lote" icon={ICONS.envioLote} />
          <NavItem to="/historico" label="Histórico" icon={ICONS.historico} />
        </NavGroup>

        <NavGroup
          label="Configuração"
          icon={ICONS.configuracao}
          childRoutes={['/sistemas', '/municipios', '/usuarios']}
        >
          <NavItem to="/sistemas" label="Sistemas" icon={ICONS.sistemas} />
          <NavItem to="/municipios" label="Central de Tokens" icon={ICONS.municipios} />
          <NavItem
            to="/usuarios"
            label={usuario?.role === 'admin' ? 'Usuários' : 'Meu Perfil'}
            icon={ICONS.usuarios}
          />
        </NavGroup>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-xs text-gray-400 text-center">
          Krakion Labs © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  )
}
