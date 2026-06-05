import { useState, useEffect, useCallback } from 'react'
import { chamadosApi, catalogoApi } from '../../lib/api'
import {
  STATUS_CORES,
  CLASSIF_CORES,
  PRIORIDADE_CORES,
  STATUS_OPTS,
  CLASSIF_OPTS,
  PRIORIDADE_OPTS,
  formatData,
} from './constants'

// ── Helpers locais ────────────────────────────────────────────────────────────
function tempoRelativo(data) {
  const diff = Date.now() - new Date(data).getTime()
  const min = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min}min`
  if (h < 24)  return `há ${h}h`
  if (d === 1) return 'há 1 dia'
  return `há ${d} dias`
}

function prefixoMunicipio(municipio) {
  if (!municipio) return ''
  return municipio
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)
}

function ticketNum(c, lista) {
  const ano = new Date(c.criadoEm).getFullYear()
  const prefixo = c.municipio ? prefixoMunicipio(c.municipio) : 'CH'
  let seq = 0
  if (lista && c.municipio) {
    seq = lista.filter(
      x => x.municipio === c.municipio &&
           new Date(x.criadoEm).getFullYear() === ano &&
           x.id <= c.id
    ).length
  }
  const num = seq > 0 ? String(seq).padStart(5, '0') : String(c.id).padStart(5, '0')
  return `${prefixo}-${ano}-${num}`
}

function Badge({ label, cor }) {
  if (!label) return null
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap"
      style={{ backgroundColor: cor || '#94A3B8' }}>
      {label}
    </span>
  )
}

const LIMITE = 30

export default function AbaPainel({ usuarios, onSelecionarChamado, chamadoSelId }) {
  const [chamados,   setChamados]   = useState([])
  const [total,      setTotal]      = useState(0)
  const [pagina,     setPagina]     = useState(1)
  const [carregando, setCarregando] = useState(false)
  const [catalogo,   setCatalogo]   = useState([])

  // Filtros
  const [busca,          setBusca]          = useState('')
  const [filtroStatus,   setFiltroStatus]   = useState('')
  const [filtroVertical, setFiltroVertical] = useState('')
  const [filtroSistema,  setFiltroSistema]  = useState('')
  const [filtroResp,     setFiltroResp]     = useState('')
  const [filtroClassif,  setFiltroClassif]  = useState('')
  const [filtroPrio,     setFiltroPrio]     = useState('')
  const [filtroMuni,     setFiltroMuni]     = useState('')
  const [mostrarMais,    setMostrarMais]    = useState(false)

  useEffect(() => {
    catalogoApi.listar().then(setCatalogo).catch(() => {})
  }, [])

  // Sistemas disponíveis baseados na vertical selecionada
  const sistemasDisponiveis = (() => {
    if (!filtroVertical) return []
    const v = catalogo.find(c => c.nome === filtroVertical)
    if (!v) return []
    const lista = typeof v.sistemas === 'string' ? JSON.parse(v.sistemas) : (v.sistemas ?? [])
    return lista.sort()
  })()

  const carregar = useCallback(async (pag = 1) => {
    setCarregando(true)
    try {
      const params = { pagina: pag, limite: LIMITE }
      if (busca)         params.busca          = busca
      if (filtroStatus)  params.status         = filtroStatus
      if (filtroVertical) params.vertical      = filtroVertical
      if (filtroSistema)  params.sistema       = filtroSistema
      if (filtroResp)     params.responsavelId = filtroResp
      if (filtroClassif)  params.classificacao = filtroClassif
      if (filtroPrio)     params.prioridade    = filtroPrio
      if (filtroMuni)     params.municipio     = filtroMuni
      const result = await chamadosApi.listar(params)
      setChamados(result.data ?? result)
      setTotal(result.total ?? (result.data ?? result).length)
      setPagina(pag)
    } catch (e) { console.error(e) }
    finally { setCarregando(false) }
  }, [busca, filtroStatus, filtroVertical, filtroSistema, filtroResp, filtroClassif, filtroPrio, filtroMuni])

  useEffect(() => { carregar(1) }, [carregar])

  const limparFiltros = () => {
    setBusca(''); setFiltroStatus(''); setFiltroVertical(''); setFiltroSistema('')
    setFiltroResp(''); setFiltroClassif(''); setFiltroPrio(''); setFiltroMuni('')
    setMostrarMais(false)
  }

  const temFiltroAtivo = busca || filtroStatus || filtroVertical || filtroSistema ||
    filtroResp || filtroClassif || filtroPrio || filtroMuni

  const totalPaginas = Math.ceil(total / LIMITE)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">

      {/* Barra de filtros */}
      <div className="border-b border-gray-200 px-4 py-2.5 bg-slate-50 space-y-2 shrink-0">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Busca */}
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input className="input text-sm pl-7 w-48" placeholder="Buscar…"
              value={busca} onChange={e => setBusca(e.target.value)} />
          </div>

          {/* Status */}
          <select className="input text-sm" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
            <option value="">Todos os status</option>
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Vertical */}
          <select className="input text-sm" value={filtroVertical}
            onChange={e => { setFiltroVertical(e.target.value); setFiltroSistema('') }}>
            <option value="">Todas as verticais</option>
            {catalogo.map(v => <option key={v.nome} value={v.nome}>{v.nome}</option>)}
          </select>

          {/* Sistema (dependente da vertical) */}
          {filtroVertical && sistemasDisponiveis.length > 0 && (
            <select className="input text-sm" value={filtroSistema} onChange={e => setFiltroSistema(e.target.value)}>
              <option value="">Todos os sistemas</option>
              {sistemasDisponiveis.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          {/* Responsável */}
          <select className="input text-sm" value={filtroResp} onChange={e => setFiltroResp(e.target.value)}>
            <option value="">Todos os responsáveis</option>
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>

          {/* Mais filtros */}
          <button onClick={() => setMostrarMais(v => !v)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
              mostrarMais ? 'border-sysgate-400 bg-sysgate-50 text-sysgate-700' : 'border-gray-200 text-gray-500 hover:bg-gray-100'
            }`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Mais
          </button>

          {/* Limpar */}
          {temFiltroAtivo && (
            <button onClick={limparFiltros}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md text-red-500 hover:bg-red-50 border border-red-200 transition-colors">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
              Limpar
            </button>
          )}

          <span className="ml-auto text-xs text-gray-400">{total} chamado{total !== 1 ? 's' : ''}</span>
        </div>

        {/* Filtros extras */}
        {mostrarMais && (
          <div className="flex flex-wrap gap-2 pt-1">
            <select className="input text-sm" value={filtroClassif} onChange={e => setFiltroClassif(e.target.value)}>
              <option value="">Classificação</option>
              {CLASSIF_OPTS.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="input text-sm" value={filtroPrio} onChange={e => setFiltroPrio(e.target.value)}>
              <option value="">Prioridade</option>
              {PRIORIDADE_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input className="input text-sm w-40" placeholder="Município…"
              value={filtroMuni} onChange={e => setFiltroMuni(e.target.value)} />
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-auto">
        {carregando ? (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">Carregando…</div>
        ) : chamados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-sm text-gray-400">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
            Nenhum chamado encontrado.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b border-gray-200 z-10">
              <tr>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">Nº</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500">Título</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">Status</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">Prioridade</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">Responsável</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">Município</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chamados.map(c => (
                <tr
                  key={c.id}
                  onClick={() => onSelecionarChamado(c.id)}
                  className={`cursor-pointer transition-colors ${
                    chamadoSelId === c.id
                      ? 'bg-sysgate-50 border-l-2 border-l-sysgate-500'
                      : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                  }`}
                >
                  <td className="px-3 py-2.5 font-mono text-[11px] text-gray-400 whitespace-nowrap">
                    {ticketNum(c, chamados)}
                  </td>
                  <td className="px-3 py-2.5 max-w-xs">
                    <p className="line-clamp-1 text-sm text-gray-900">{c.titulo}</p>
                    {c.classificacao && (
                      <span className="text-[10px] text-gray-400">{c.classificacao}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <Badge label={c.status} cor={STATUS_CORES[c.status]} />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {c.prioridade
                      ? <Badge label={c.prioridade} cor={PRIORIDADE_CORES[c.prioridade]} />
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {c.responsavel
                      ? <span className="text-sm text-gray-700">{c.responsavel.nome}</span>
                      : <span className="text-xs text-orange-400 font-medium">sem responsável</span>
                    }
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-xs text-gray-500">{c.municipio || '—'}</span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-xs text-gray-400">{tempoRelativo(c.criadoEm)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-white shrink-0">
          <button
            onClick={() => carregar(pagina - 1)}
            disabled={pagina <= 1}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Anterior
          </button>
          <span className="text-xs text-gray-500">
            Página {pagina} de {totalPaginas} · {total} chamados
          </span>
          <button
            onClick={() => carregar(pagina + 1)}
            disabled={pagina >= totalPaginas}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Próxima
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
