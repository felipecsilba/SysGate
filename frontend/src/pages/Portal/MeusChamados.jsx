import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { portalChamadosApi } from '../../lib/portalApi'
import { statusPortal, STATUS_FILTRO_OPTS, formatData } from './constants'

// Lista de chamados do solicitante logado — busca, filtro de status e paginação
export default function MeusChamados() {
  const navigate = useNavigate()

  const [chamados, setChamados] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [pagina, setPagina] = useState(1)
  const [status, setStatus] = useState('')
  const [buscaInput, setBuscaInput] = useState('')
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const debounceRef = useRef(null)

  // Busca debounced (400ms) — mesmo padrão do módulo interno de Chamados
  const onBuscaChange = (e) => {
    const valor = e.target.value
    setBuscaInput(valor)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPagina(1)
      setBusca(valor)
    }, 400)
  }

  useEffect(() => {
    let ativo = true
    setCarregando(true)
    setErro('')
    portalChamadosApi
      .listar({ ...(busca && { busca }), ...(status && { status }), pagina, limite: 20 })
      .then((r) => {
        if (!ativo) return
        setChamados(r.data)
        setTotal(r.total)
        setTotalPaginas(r.totalPaginas || 1)
      })
      .catch((err) => ativo && setErro(err.message))
      .finally(() => ativo && setCarregando(false))
    return () => { ativo = false }
  }, [busca, status, pagina])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-1 h-6 rounded-full bg-sysgate-600" />
          <h1 className="text-lg font-bold text-gray-900">Meus Chamados</h1>
          {total > 0 && <span className="text-sm text-gray-400">({total})</span>}
        </div>
        <Link
          to="/portal/novo"
          className="bg-sysgate-600 hover:bg-sysgate-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo chamado
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <input
          type="text"
          className="input flex-1"
          placeholder="Buscar por título, descrição ou protocolo..."
          value={buscaInput}
          onChange={onBuscaChange}
        />
        <select
          className="input w-48"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPagina(1) }}
        >
          <option value="">Todos os status</option>
          {STATUS_FILTRO_OPTS.map((o) => (
            <option key={o.valor} value={o.valor}>{o.label}</option>
          ))}
        </select>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
          {erro}
        </div>
      )}

      {/* Lista */}
      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-sysgate-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : chamados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-14 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-sysgate-50 text-sysgate-500 mb-4">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75c0-1.243 1.007-2.25 2.25-2.25s2.25 1.007 2.25 2.25c0 .896-.524 1.67-1.281 2.032-.563.27-.969.83-.969 1.454v.264m0 3h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            {busca || status ? 'Nenhum chamado encontrado com os filtros aplicados.' : 'Você ainda não abriu nenhum chamado.'}
          </p>
          {!busca && !status && (
            <p className="text-sm text-gray-400">
              Clique em <span className="font-semibold text-sysgate-600">Novo chamado</span> para registrar sua primeira solicitação.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {chamados.map((c) => {
            const st = statusPortal(c.status)
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/portal/chamados/${c.id}`)}
                className="w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-sysgate-200 transition-all px-5 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {c.numero && (
                        <span className="text-[11px] font-mono font-semibold text-sysgate-600 bg-sysgate-50 rounded px-1.5 py-0.5">
                          {c.numero}
                        </span>
                      )}
                      <span
                        className="text-[11px] font-semibold rounded-full px-2 py-0.5 text-white"
                        style={{ backgroundColor: st.cor }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.titulo}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">Aberto em</p>
                    <p className="text-xs font-medium text-gray-600">{formatData(c.criadoEm)}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => p - 1)}
            className="text-sm text-gray-500 hover:text-sysgate-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          <span className="text-sm text-gray-400">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
            className="text-sm text-gray-500 hover:text-sysgate-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}
