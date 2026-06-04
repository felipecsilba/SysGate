import { useMemo, useState } from 'react'
import { portfolioApi } from '../../lib/api'
import { corVertical, hexToRgb } from './utils'
import { confirmClose } from '../../lib/formGuard'

// ── Ícone ─────────────────────────────────────────────────────────────────────

function IconX() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

// ── Modal Gerenciar Sistemas (catálogo Betha) ─────────────────────────────────

export default function ModalGerenciarSistemas({ entidade, catalogo, onClose, onSaved }) {
  const ativos = useMemo(() => {
    const s = new Set()
    for (const sis of entidade.sistemas) {
      if (sis.ativo && sis.vertical) s.add(`${sis.vertical}|${sis.nome}`)
    }
    return s
  }, [entidade.sistemas])

  const inativos = useMemo(() => {
    const s = new Set()
    for (const sis of entidade.sistemas) {
      if (!sis.ativo && sis.vertical) s.add(`${sis.vertical}|${sis.nome}`)
    }
    return s
  }, [entidade.sistemas])

  const [pendentes, setPendentes] = useState(new Map())
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const getEstado = (vertical, nome) => {
    const chave = `${vertical}|${nome}`
    if (pendentes.has(chave)) return pendentes.get(chave)
    if (ativos.has(chave)) return 'ativo'
    if (inativos.has(chave)) return 'inativo'
    return 'ausente'
  }

  const toggleSistema = (vertical, nome) => {
    const chave = `${vertical}|${nome}`
    setPendentes((prev) => {
      const next = new Map(prev)
      if (prev.has(chave)) {
        next.delete(chave)
      } else {
        const base = ativos.has(chave) ? 'ativo' : inativos.has(chave) ? 'inativo' : 'ausente'
        if (base === 'ausente') next.set(chave, 'add')
        else if (base === 'ativo') next.set(chave, 'deactivate')
        else next.set(chave, 'reactivate')
      }
      return next
    })
  }

  const getChipStyle = (vertical, sis) => {
    const estado = getEstado(vertical, sis)
    const hex = corVertical(vertical)
    const rgb = hexToRgb(hex)
    if (estado === 'add' || estado === 'reactivate')
      return { cls: 'text-white ring-2 ring-offset-1', sty: { backgroundColor: hex, ringColor: hex } }
    if (estado === 'deactivate')
      return { cls: 'line-through border', sty: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', color: '#EF4444' } }
    if (estado === 'ativo')
      return { cls: 'border', sty: { backgroundColor: `rgba(${rgb}, 0.15)`, borderColor: `rgba(${rgb}, 0.45)`, color: hex } }
    if (estado === 'inativo')
      return { cls: 'bg-gray-100 text-gray-400 border border-gray-200', sty: {} }
    return { cls: 'bg-white text-gray-300 border border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-500', sty: {} }
  }

  const salvar = async () => {
    if (pendentes.size === 0) { onClose(); return }
    setSalvando(true)
    setErro('')
    try {
      for (const [chave, acao] of pendentes) {
        const idx = chave.indexOf('|')
        const vertical = chave.slice(0, idx)
        const nome = chave.slice(idx + 1)
        const existente = entidade.sistemas.find((s) => s.nome === nome && s.vertical === vertical)
        if (acao === 'add') await portfolioApi.criarSistema(entidade.id, { nome, vertical, ativo: true })
        else if (acao === 'deactivate') await portfolioApi.atualizarSistema(existente.id, { ativo: false })
        else if (acao === 'reactivate') await portfolioApi.atualizarSistema(existente.id, { ativo: true })
      }
      onSaved()
      onClose()
    } catch (err) {
      setErro(err.message)
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Gerenciar Sistemas</h2>
            <p className="text-xs text-gray-500 mt-0.5">{entidade.nome}</p>
          </div>
          <button onClick={() => confirmClose(pendentes.size > 0, onClose)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <IconX />
          </button>
        </div>

        {/* Legenda */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <p className="text-xs text-gray-500">
            Clique para alternar o status: <span className="inline-flex items-center gap-1 text-gray-400 border border-dashed border-gray-300 rounded-full px-2 py-0.5">fantasma</span> = inativo / não cadastrado · <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 border border-green-200 rounded-full px-2 py-0.5">verde</span> = ativo
          </p>
        </div>

        {/* Grade de verticais */}
        <div className="overflow-y-auto px-6 py-3 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {catalogo.map(({ nome: vertical, sistemas }) => {
              const hex = corVertical(vertical)
              return (
              <div key={vertical} className="rounded-xl overflow-hidden border border-gray-100">
                <div className="px-3 py-2" style={{ backgroundColor: hex }}>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-white">{vertical}</h3>
                </div>
                <div className="p-3 bg-white">
                  <div className="flex flex-wrap gap-1.5">
                    {sistemas.map((sis) => {
                      const { cls, sty } = getChipStyle(vertical, sis)
                      return (
                        <button
                          key={sis}
                          type="button"
                          onClick={() => toggleSistema(vertical, sis)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${cls}`}
                          style={sty}
                        >
                          {sis}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-gray-500">
            {pendentes.size > 0
              ? `${pendentes.size} alteração${pendentes.size !== 1 ? 'ões' : ''} pendente${pendentes.size !== 1 ? 's' : ''}`
              : 'Nenhuma alteração pendente'}
          </p>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => confirmClose(pendentes.size > 0, onClose)} className="btn btn-ghost">Cancelar</button>
            <button
              type="button"
              onClick={salvar}
              disabled={salvando || pendentes.size === 0}
              className="btn btn-primary"
            >
              {salvando ? 'Salvando...' : pendentes.size > 0 ? `Salvar ${pendentes.size} alteração${pendentes.size !== 1 ? 'ões' : ''}` : 'Fechar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
