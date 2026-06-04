import { useState, useEffect } from 'react'
import { chamadosApi } from '../../lib/api'
import { HISTORICO_META, descreverHistorico, formatDataHora } from './constants'

export default function PainelHistorico({ chamadoId, onFechar }) {
  const [historico, setHistorico] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    setCarregando(true)
    chamadosApi.historico(chamadoId).then(setHistorico).catch(() => {}).finally(() => setCarregando(false))
  }, [chamadoId])

  return (
    <div className="w-72 shrink-0 border-l border-gray-200 flex flex-col bg-slate-50/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-sysgate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Histórico</span>
        </div>
        <button onClick={onFechar} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {carregando ? (
          <div className="text-center text-xs text-gray-400 py-6">Carregando…</div>
        ) : historico.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-6">Nenhum histórico registrado.</div>
        ) : (
          <div className="relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
            <div className="space-y-4">
              {historico.map(h => {
                const meta = HISTORICO_META[h.tipo] || { cor: '#94A3B8' }
                return (
                  <div key={h.id} className="flex gap-3 relative">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white shrink-0 mt-0.5 z-10 shadow-sm"
                      style={{ backgroundColor: meta.cor }} />
                    <div className="flex-1 min-w-0 pb-1">
                      <p className="text-xs font-semibold text-gray-800 leading-snug">{descreverHistorico(h)}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        por <span className="font-medium text-gray-700">{h.usuario?.nome || '—'}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDataHora(h.criadoEm)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
