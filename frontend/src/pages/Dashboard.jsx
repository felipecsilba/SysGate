import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useMunicipioStore from '../stores/municipioStore'
import { requisicoesApi } from '../lib/api'

const METODO_COLORS = {
  GET: 'badge-blue', POST: 'badge-green', PUT: 'badge-yellow',
  PATCH: 'badge-yellow', DELETE: 'badge-red',
}

function StatusIcon({ code }) {
  if (!code) return <span className="text-gray-400">—</span>
  if (code >= 200 && code < 300) return <span className="text-green-600 font-mono text-xs">{code}</span>
  if (code >= 400) return <span className="text-red-600 font-mono text-xs">{code}</span>
  return <span className="text-yellow-600 font-mono text-xs">{code}</span>
}

const ATALHOS = [
  { to: '/municipios', icon: '🏛', label: 'Municípios', desc: 'Gerenciar conexões' },
  { to: '/cliente-api', icon: '⚡', label: 'Cliente API', desc: 'Testar endpoints' },
  { to: '/envio-lote', icon: '📦', label: 'Envio em Lote', desc: 'Upload CSV' },
  { to: '/scripts', icon: '🔧', label: 'Scripts', desc: 'SQL e comandos' },
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
      } catch {
        /* ignora */
      } finally {
        setCarregando(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral do SysGate</p>
      </div>

      {/* Município ativo em destaque */}
      {municipioAtivo ? (
        <div className="card p-5 border-l-4 border-l-green-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Município ativo
              </p>
              <h2 className="text-xl font-bold text-gray-900">{municipioAtivo.nome}</h2>
            </div>
            <span className="badge badge-green text-sm px-3 py-1">
              {municipioAtivo.municipioSistemas?.length || 0} sistema{(municipioAtivo.municipioSistemas?.length || 0) !== 1 ? 's' : ''} configurado{(municipioAtivo.municipioSistemas?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>
          {municipioAtivo.observacoes && (
            <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              {municipioAtivo.observacoes}
            </p>
          )}
        </div>
      ) : (
        <div className="card p-5 border-l-4 border-l-yellow-400">
          <p className="text-sm font-medium text-yellow-800">
            Nenhum município ativo.{' '}
            <Link to="/municipios" className="underline hover:no-underline">
              Ative um município
            </Link>{' '}
            para começar.
          </p>
        </div>
      )}

      {/* Atalhos */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Módulos</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ATALHOS.map(({ to, icon, label, desc }) => (
            <Link
              key={to}
              to={to}
              className="card p-4 hover:shadow-md hover:border-sysgate-300 transition-all group"
            >
              <span className="text-2xl">{icon}</span>
              <p className="mt-2 font-semibold text-gray-900 text-sm group-hover:text-sysgate-600">
                {label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Últimas requisições */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">Últimas requisições</h2>
          <Link to="/cliente-api" className="text-xs text-sysgate-600 hover:underline">
            Ver todas →
          </Link>
        </div>

        <div className="card overflow-hidden">
          {carregando ? (
            <div className="p-6 text-center text-sm text-gray-500">Carregando...</div>
          ) : requisicoes.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              Nenhuma requisição registrada ainda.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Método</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">URL</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Duração</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600">Quando</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requisicoes.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <span className={`badge text-xs ${METODO_COLORS[r.metodo] || 'badge-gray'}`}>
                        {r.metodo}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600 max-w-xs truncate">
                      {r.url}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusIcon code={r.statusCode} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">
                      {r.duracaoMs != null ? `${r.duracaoMs}ms` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">
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
