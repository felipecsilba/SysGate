import { useState, useEffect, useCallback } from 'react'
import { requisicoesApi, municipiosApi, sistemasApi } from '../lib/api'

const COR_METODO = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-green-100 text-green-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  PATCH: 'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
}

function badgeStatus(code) {
  if (!code && code !== 0) return 'bg-gray-100 text-gray-500'
  if (code >= 200 && code < 300) return 'bg-green-100 text-green-700'
  if (code >= 400 && code < 500) return 'bg-yellow-100 text-yellow-700'
  if (code >= 500) return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-500'
}

function formatarData(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function Historico() {
  const [requisicoes, setRequisicoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [municipios, setMunicipios] = useState([])
  const [sistemas, setSistemas] = useState([])

  // Filtros
  const [filtroMunicipio, setFiltroMunicipio] = useState('')
  const [filtroSistema, setFiltroSistema] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroMetodo, setFiltroMetodo] = useState('')

  const [confirmLimpar, setConfirmLimpar] = useState(false)
  const [limpando, setLimpando] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const params = { limite: 500 }
      if (filtroMunicipio) params.municipioId = filtroMunicipio
      if (filtroSistema) params.sistemaId = filtroSistema
      if (filtroTipo) params.tipo = filtroTipo
      const data = await requisicoesApi.listar(params)
      setRequisicoes(filtroMetodo ? data.filter((r) => r.metodo === filtroMetodo) : data)
    } catch {
      setRequisicoes([])
    } finally {
      setCarregando(false)
    }
  }, [filtroMunicipio, filtroSistema, filtroTipo, filtroMetodo])

  useEffect(() => {
    municipiosApi.listar().then(setMunicipios).catch(() => {})
    sistemasApi.listar().then(setSistemas).catch(() => {})
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function handleLimpar() {
    setLimpando(true)
    try {
      await requisicoesApi.limpar(filtroMunicipio || undefined)
      setConfirmLimpar(false)
      carregar()
    } finally {
      setLimpando(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 p-6 gap-4">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Histórico de Requisições</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {carregando ? 'Carregando...' : `${requisicoes.length} registro${requisicoes.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={carregar}
            className="btn btn-secondary"
            disabled={carregando}
          >
            ↺ Atualizar
          </button>
          {!confirmLimpar ? (
            <button onClick={() => setConfirmLimpar(true)} className="btn btn-danger">
              Limpar histórico
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <span className="text-sm text-red-700">Confirmar limpeza?</span>
              <button
                onClick={handleLimpar}
                disabled={limpando}
                className="btn btn-danger py-1 px-2 text-xs"
              >
                {limpando ? 'Limpando...' : 'Sim'}
              </button>
              <button
                onClick={() => setConfirmLimpar(false)}
                className="btn btn-ghost py-1 px-2 text-xs"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 shrink-0">
        {/* Município */}
        <div className="relative">
          <select
            value={filtroMunicipio}
            onChange={(e) => setFiltroMunicipio(e.target.value)}
            className="input appearance-none pr-8 text-sm"
          >
            <option value="">Todos os municípios</option>
            {municipios.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
        </div>

        {/* Sistema */}
        <div className="relative">
          <select
            value={filtroSistema}
            onChange={(e) => setFiltroSistema(e.target.value)}
            className="input appearance-none pr-8 text-sm"
          >
            <option value="">Todos os sistemas</option>
            {sistemas.map((s) => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
        </div>

        {/* Tipo */}
        <div className="relative">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="input appearance-none pr-8 text-sm"
          >
            <option value="">Todos os tipos</option>
            <option value="individual">Individual</option>
            <option value="lote">Lote</option>
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
        </div>

        {/* Método */}
        <div className="relative">
          <select
            value={filtroMetodo}
            onChange={(e) => setFiltroMetodo(e.target.value)}
            className="input appearance-none pr-8 text-sm"
          >
            <option value="">Todos os métodos</option>
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 min-h-0 card overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 scrollbar-thin">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Data / Hora</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Município</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Sistema</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Endpoint</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Método</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">ID Gerado</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Tipo</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Duração</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-sysgate-400 border-t-transparent rounded-full animate-spin" />
                      Carregando...
                    </div>
                  </td>
                </tr>
              ) : requisicoes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">📭</span>
                      <span>Nenhuma requisição encontrada</span>
                    </div>
                  </td>
                </tr>
              ) : (
                requisicoes.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}
                  >
                    {/* Data/Hora */}
                    <td className="px-4 py-2.5 text-gray-500 font-mono text-xs whitespace-nowrap">
                      {formatarData(r.criadoEm)}
                    </td>

                    {/* Município */}
                    <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">
                      {r.municipio?.nome || <span className="text-gray-400">—</span>}
                    </td>

                    {/* Sistema */}
                    <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                      {r.sistema?.nome || <span className="text-gray-400">—</span>}
                    </td>

                    {/* Endpoint */}
                    <td className="px-4 py-2.5 max-w-[220px]">
                      {r.endpoint ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-400 font-mono leading-tight">{r.endpoint.modulo}</span>
                          <span className="text-gray-800 font-medium leading-tight truncate" title={r.endpoint.nome}>
                            {r.endpoint.nome}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-mono text-xs truncate block" title={r.url}>
                          {r.url}
                        </span>
                      )}
                    </td>

                    {/* Método */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${COR_METODO[r.metodo] || 'bg-gray-100 text-gray-600'}`}>
                        {r.metodo}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${badgeStatus(r.statusCode)}`}>
                        {r.statusCode ?? '—'}
                      </span>
                    </td>

                    {/* ID Gerado */}
                    <td className="px-4 py-2.5 font-mono text-xs text-sysgate-700 whitespace-nowrap">
                      {r.idGerado ? (
                        <span className="bg-sysgate-50 border border-sysgate-200 rounded px-1.5 py-0.5">
                          {r.idGerado}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Tipo */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {r.tipo === 'lote' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          📦 Lote
                        </span>
                      ) : r.tipo === 'individual' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sysgate-100 text-sysgate-700">
                          ⚡ Individual
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Duração */}
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-500 whitespace-nowrap">
                      {r.duracaoMs != null ? `${r.duracaoMs}ms` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
