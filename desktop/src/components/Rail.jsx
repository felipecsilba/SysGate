import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Icone from './Icone'
import { GRUPOS, MODULOS, grupoDaRota } from '../modulos'
import { useTemaStore } from '../stores/temaStore'
import { useAuthStore } from '../stores/authStore'
import { ROTULO_PREFERENCIA } from '../lib/tema'

function iniciais(nome = '') {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes.at(-1)[0] : '')).toUpperCase() || '?'
}

function BotaoRail({ ativo, titulo, onClick, children }) {
  return (
    <button
      type="button"
      title={titulo}
      onClick={onClick}
      className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition ${
        ativo ? 'bg-texto/[0.07] text-texto' : 'text-suave hover:bg-texto/[0.04] hover:text-texto'
      }`}
    >
      {children}
    </button>
  )
}

function BotaoGrupo({ grupo, ativo, navegar }) {
  return (
    <BotaoRail titulo={grupo.titulo} ativo={ativo} onClick={() => navegar(MODULOS.find(m => m.grupo === grupo.id).rota)}>
      <Icone nome={grupo.icone} />
    </BotaoRail>
  )
}

export default function Rail() {
  const { pathname } = useLocation()
  const navegar = useNavigate()
  const grupoAtivo = grupoDaRota(pathname)
  const { preferencia, alternar } = useTemaStore()
  const { usuario, sair } = useAuthStore()
  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuAberto) return
    const fechar = e => { if (!menuRef.current?.contains(e.target)) setMenuAberto(false) }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [menuAberto])

  return (
    <nav className="flex w-[60px] shrink-0 flex-col items-center gap-1 border-r border-borda bg-fundo pb-3">
      <div className="arrastar flex h-14 w-full shrink-0 items-center justify-center">
        <img src="./nova-logo.webp" alt="Krakion" className="h-8 w-8 object-contain" draggable={false} />
      </div>

      {GRUPOS.filter(g => !g.rodape).map(g => (
        <BotaoGrupo key={g.id} grupo={g} ativo={g.id === grupoAtivo.id} navegar={navegar} />
      ))}

      <div className="flex-1" />

      {GRUPOS.filter(g => g.rodape).map(g => (
        <BotaoGrupo key={g.id} grupo={g} ativo={g.id === grupoAtivo.id} navegar={navegar} />
      ))}

      <BotaoRail titulo={`${ROTULO_PREFERENCIA[preferencia]} — clique para trocar`} onClick={alternar}>
        <Icone nome={preferencia} />
      </BotaoRail>

      <div className="relative mt-1" ref={menuRef}>
        <button
          type="button"
          title={usuario?.nome}
          onClick={() => setMenuAberto(v => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-texto/10 text-[11px] font-semibold text-texto transition hover:bg-texto/15"
        >
          {iniciais(usuario?.nome)}
        </button>
        {menuAberto && (
          <div className="absolute bottom-0 left-12 z-20 w-56 rounded-xl border border-borda bg-fundo p-1.5 shadow-lg">
            <div className="px-2.5 py-2">
              <div className="truncate text-sm font-medium">{usuario?.nome}</div>
              <div className="truncate text-xs text-suave">{usuario?.login} · {usuario?.role === 'admin' ? 'Admin' : 'Operador'}</div>
            </div>
            <div className="my-1 border-t border-borda" />
            <button
              type="button"
              onClick={sair}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-texto hover:bg-painel"
            >
              <Icone nome="sair" className="h-4 w-4 text-suave" /> Sair
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
