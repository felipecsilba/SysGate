import { useState, useEffect } from 'react'
import { STATUS_OPTS } from './constants'

const STATUS_ATIVOS = STATUS_OPTS.filter(s => s !== 'Concluido' && s !== 'Cancelado')

export default function ModalFilaConfig({ aberto, onFechar, configAtual, catalogo, onSalvar }) {
  const [verticaisSel, setVerticaisSel] = useState([])
  const [sistemasSel,  setSistemasSel]  = useState([])
  const [statusSel,    setStatusSel]    = useState([])
  const [salvando,     setSalvando]     = useState(false)

  // Inicializar com config atual ao abrir
  useEffect(() => {
    if (aberto) {
      setVerticaisSel(configAtual?.verticais ?? [])
      setSistemasSel(configAtual?.sistemas   ?? [])
      setStatusSel(configAtual?.status       ?? [])
    }
  }, [aberto, configAtual])

  // Sistemas disponíveis: filtra pelo catálogo baseado nas verticais selecionadas
  const sistemasDisponiveis = (() => {
    const verticaisFiltro = verticaisSel.length > 0
      ? catalogo.filter(v => verticaisSel.includes(v.nome))
      : catalogo
    const todos = verticaisFiltro.flatMap(v => {
      const lista = typeof v.sistemas === 'string' ? JSON.parse(v.sistemas) : (v.sistemas ?? [])
      return lista
    })
    return [...new Set(todos)].sort()
  })()

  const toggleVertical = (nome) => {
    const novas = verticaisSel.includes(nome)
      ? verticaisSel.filter(v => v !== nome)
      : [...verticaisSel, nome]
    setVerticaisSel(novas)
    // Remove sistemas que não pertencem mais às verticais selecionadas
    if (novas.length > 0) {
      const sistemasPermitidos = catalogo
        .filter(v => novas.includes(v.nome))
        .flatMap(v => {
          const lista = typeof v.sistemas === 'string' ? JSON.parse(v.sistemas) : (v.sistemas ?? [])
          return lista
        })
      setSistemasSel(prev => prev.filter(s => sistemasPermitidos.includes(s)))
    }
  }

  const toggleSistema = (nome) => {
    setSistemasSel(prev =>
      prev.includes(nome) ? prev.filter(s => s !== nome) : [...prev, nome]
    )
  }

  const toggleStatus = (s) => {
    setStatusSel(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const handleSalvar = async () => {
    setSalvando(true)
    try {
      await onSalvar({ verticais: verticaisSel, sistemas: sistemasSel, status: statusSel })
    } finally {
      setSalvando(false)
    }
  }

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-1 h-5 rounded-full bg-sysgate-600 shrink-0" />
          <h2 className="text-sm font-semibold text-gray-900 flex-1">Configurar minha Fila</h2>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* Verticais */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Verticais
            </p>
            <div className="flex flex-wrap gap-1.5">
              {catalogo.map(v => {
                const ativo = verticaisSel.includes(v.nome)
                return (
                  <button
                    key={v.nome}
                    onClick={() => toggleVertical(v.nome)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      ativo
                        ? 'border-sysgate-500 bg-sysgate-100 text-sysgate-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {v.nome}
                  </button>
                )
              })}
            </div>
            {catalogo.length === 0 && (
              <p className="text-xs text-gray-400">Nenhuma vertical no catálogo.</p>
            )}
          </div>

          {/* Sistemas */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Sistemas {verticaisSel.length > 0 && <span className="font-normal normal-case text-gray-400">(filtrado pelas verticais)</span>}
            </p>
            {sistemasDisponiveis.length === 0 ? (
              <p className="text-xs text-gray-400">
                {catalogo.length === 0 ? 'Catálogo vazio.' : 'Nenhum sistema nas verticais selecionadas.'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {sistemasDisponiveis.map(s => {
                  const ativo = sistemasSel.includes(s)
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSistema(s)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        ativo
                          ? 'border-sysgate-500 bg-sysgate-100 text-sysgate-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Status a incluir
            </p>
            <p className="text-xs text-gray-400 mb-2">
              Sem seleção = mostra todos os ativos (exclui Concluído e Cancelado).
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_ATIVOS.map(s => {
                const ativo = statusSel.includes(s)
                return (
                  <button
                    key={s}
                    onClick={() => toggleStatus(s)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      ativo
                        ? 'border-sysgate-500 bg-sysgate-100 text-sysgate-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Resumo */}
          {(verticaisSel.length > 0 || sistemasSel.length > 0) && (
            <div className="bg-sysgate-50 border border-sysgate-100 rounded-lg px-3 py-2.5 text-xs text-sysgate-700">
              <span className="font-medium">Sua fila mostrará:</span>{' '}
              {verticaisSel.length > 0 && `Verticais: ${verticaisSel.join(', ')}`}
              {verticaisSel.length > 0 && sistemasSel.length > 0 && ' · '}
              {sistemasSel.length > 0 && `Sistemas: ${sistemasSel.join(', ')}`}
              {statusSel.length > 0 && ` · Status: ${statusSel.join(', ')}`}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100">
          <button onClick={onFechar} className="btn text-sm px-4 py-1.5 text-gray-600 hover:bg-gray-100">
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="btn bg-sysgate-600 hover:bg-sysgate-700 text-white text-sm px-4 py-1.5 disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
