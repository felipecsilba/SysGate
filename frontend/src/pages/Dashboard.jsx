import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useMunicipioStore from '../stores/municipioStore'
import { requisicoesApi } from '../lib/api'

const METODO_COLORS = {
  GET: 'bg-blue-100 text-blue-700', POST: 'bg-green-100 text-green-700',
  PUT: 'bg-yellow-100 text-yellow-700', PATCH: 'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
}

function StatusBadge({ code }) {
  if (!code) return <span className="text-gray-400 font-mono text-xs">—</span>
  const cls = code >= 200 && code < 300 ? 'text-green-600 bg-green-50 border-green-200'
    : code >= 400 ? 'text-red-600 bg-red-50 border-red-200'
    : 'text-yellow-600 bg-yellow-50 border-yellow-200'
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded border font-mono text-xs font-semibold ${cls}`}>
      {code}
    </span>
  )
}

const ATALHOS = [
  {
    to: '/municipios',
    label: 'Municípios',
    desc: 'Gerenciar conexões e tokens',
    color: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 21h18M6 21V7l6-4 6 4v14M9 21v-4h6v4"/>
      </svg>
    ),
  },
  {
    to: '/sandbox',
    label: 'Sandbox',
    desc: 'Disparar chamadas individuais à API',
    color: 'bg-sysgate-50 text-sysgate-600 group-hover:bg-sysgate-600 group-hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
  },
  {
    to: '/envio-lote',
    label: 'Envio em Lote',
    desc: 'Upload CSV e envio massivo',
    color: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
      </svg>
    ),
  },
  {
    to: '/scripts',
    label: 'Scripts',
    desc: 'SQL, comandos e ferramentas',
    color: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>
      </svg>
    ),
  },
]

export default function Dashboard() {
  const municipioAtivo = useMunicipioStore((s) => s.municipioAtivo)
  const [requisicoes, setRequisicoes] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setCarregando(true)
        const data = await requisicoesApi.listar({ limite: 5 })
        setRequisicoes(data)
      } catch { /* ignora */ }
      finally { setCarregando(false) }
    }
    load()
  }, [])

  const numSistemas = municipioAtivo?.municipioSistemas?.length || 0

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Cabeçalho */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Visão geral do SysGate</p>
        </div>
        <Link to="/historico" className="text-xs text-sysgate-600 hover:text-sysgate-700 font-medium flex items-center gap-1 hover:underline">
          Ver histórico completo
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>

      {/* Município ativo */}
      {municipioAtivo ? (
        <div className="card p-5 bg-gradient-to-r from-white to-green-50/30 border-green-100">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M3 21h18M6 21V7l6-4 6 4v14M9 21v-4h6v4M12 11h.01"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Município ativo</p>
              <h2 className="text-xl font-bold text-gray-900 truncate">{municipioAtivo.nome}</h2>
            </div>
            <div className="text-right shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                numSistemas > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${numSistemas > 0 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                {numSistemas} sistema{numSistemas !== 1 ? 's' : ''} configurado{numSistemas !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          {municipioAtivo.observacoes && (
            <p className="mt-3 text-sm text-gray-500 border-t border-gray-100 pt-3">
              {municipioAtivo.observacoes}
            </p>
          )}
        </div>
      ) : (
        <div className="card p-5 bg-gradient-to-r from-white to-yellow-50/40 border-yellow-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center text-white shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-yellow-800">
              Nenhum município ativo.{' '}
              <Link to="/municipios" className="underline font-semibold hover:no-underline">
                Ative um município
              </Link>{' '}
              para começar.
            </p>
          </div>
        </div>
      )}

      {/* Módulos */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-4 rounded-full bg-sysgate-600" />
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Módulos</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ATALHOS.map(({ to, icon, label, desc, color }) => (
            <Link
              key={to}
              to={to}
              className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex flex-col gap-3"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${color}`}>
                {icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm group-hover:text-sysgate-600 transition-colors">
                  {label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
              </div>
              <div className="mt-auto flex items-center gap-1 text-xs text-sysgate-500 group-hover:text-sysgate-700 transition-colors font-semibold">
                Acessar
                <svg className="w-3 h-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Últimas requisições */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-sysgate-600" />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Últimas requisições</h2>
          </div>
          <Link to="/historico" className="text-xs text-sysgate-600 hover:text-sysgate-700 font-medium flex items-center gap-0.5 hover:underline">
            Ver todas
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

        <div className="card overflow-hidden">
          {carregando ? (
            <div className="p-8 flex items-center justify-center gap-2 text-sm text-gray-400">
              <span className="w-4 h-4 border-2 border-gray-300 border-t-sysgate-500 rounded-full animate-spin" />
              Carregando...
            </div>
          ) : requisicoes.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-400">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <p className="text-sm text-gray-400">Nenhuma requisição registrada ainda</p>
              <p className="text-xs text-gray-300 mt-1">Use o Sandbox para testar endpoints</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Método</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">URL</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Duração</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Quando</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requisicoes.map((r) => (
                  <tr key={r.id} className="hover:bg-sysgate-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide ${METODO_COLORS[r.metodo] || 'bg-gray-100 text-gray-600'}`}>
                        {r.metodo}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-xs truncate">
                      {r.url}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge code={r.statusCode} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                      {r.duracaoMs != null ? `${r.duracaoMs}ms` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(r.criadoEm).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
