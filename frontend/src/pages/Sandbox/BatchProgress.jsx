import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { proxyApi } from '../../lib/api'
import { highlightJson } from './utils'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export default function BatchProgress({
  progresso,
  concluido,
  percentual,
  totalOk,
  totalErro,
  totalBatches,
  municipioSel,
  sistemaSel,
  pathCustom,
  progressoRef,
}) {
  const [consultasResultado, setConsultasResultado] = useState({})
  const [consultandoTodos, setConsultandoTodos] = useState(false)

  const consultarLote = async (chave, loteId) => {
    setConsultasResultado((prev) => ({ ...prev, [chave]: { consultando: true, aberto: true } }))
    try {
      const res = await proxyApi.executar({
        municipioId: Number(municipioSel),
        sistemaId: Number(sistemaSel),
        path: pathCustom.replace(/\/$/, '') + '/' + loteId,
        metodo: 'GET',
        tipo: 'individual',
      })
      setConsultasResultado((prev) => ({
        ...prev,
        [chave]: { consultando: false, aberto: true, statusCode: res.statusCode, data: res.data },
      }))
    } catch (e) {
      setConsultasResultado((prev) => ({
        ...prev,
        [chave]: { consultando: false, aberto: true, statusCode: null, data: { error: e.message } },
      }))
    }
  }

  const toggleResultado = (chave) => {
    setConsultasResultado((prev) => ({
      ...prev,
      [chave]: { ...prev[chave], aberto: !prev[chave]?.aberto },
    }))
  }

  const exportarCSV = () => {
    const rows = progresso.map((p) => ({
      lote: p.lote,
      itens: p.count,
      status: p.status,
      mensagem: p.msg,
      ids_gerados: (p.idsGerados || []).join(','),
      total_ids: (p.idsGerados || []).length,
    }))
    const csv = Papa.unparse(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_lote_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (progresso.length === 0) return null

  const todosIds = progresso.flatMap((p) => p.idsGerados || [])
  const todosIdsComLote = progresso.flatMap((p) =>
    (p.idsGerados || []).map((id) => ({ id, lote: p.lote }))
  )

  const getStatus = (chave) => {
    const c = consultasResultado[chave]
    if (!c || !c.statusCode) return 'pendente'
    if (c.consultando) return 'consultando'
    if (c.statusCode < 200 || c.statusCode >= 300) return 'erro'
    const statusLote = c.data?.statusLote
    if (statusLote === 'NAO_PROCESSADO') return 'pendente'
    if (statusLote === 'ERRO' || statusLote === 'FALHA') return 'erro'
    return 'sucesso'
  }

  const pendentes = todosIdsComLote.filter(({ id, lote }) => getStatus(`${lote}-${id}`) === 'pendente')
  const nSucesso = todosIdsComLote.filter(({ id, lote }) => getStatus(`${lote}-${id}`) === 'sucesso').length
  const nErro = todosIdsComLote.filter(({ id, lote }) => getStatus(`${lote}-${id}`) === 'erro').length

  const consultarTodosPendentes = async () => {
    setConsultandoTodos(true)
    for (const { id, lote } of pendentes) {
      const chave = `${lote}-${id}`
      await consultarLote(chave, id)
      await sleep(300)
    }
    setConsultandoTodos(false)
  }

  const CORES = {
    pendente: 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100',
    consultando: 'bg-blue-50 text-blue-700 border-blue-300 animate-pulse cursor-wait',
    sucesso: 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100',
    erro: 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100',
  }

  return (
    <>
      <div className="card p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">Progresso</span>
          <span className="text-gray-500">Lote {progresso.length}/{totalBatches} ({percentual}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full bg-sysgate-500 rounded-full transition-all duration-300"
            style={{ width: `${percentual}%` }}
          />
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-green-600 font-medium">{totalOk} lote{totalOk !== 1 ? 's' : ''} ok</span>
          <span className="text-red-600 font-medium">{totalErro} erro{totalErro !== 1 ? 's' : ''}</span>
          {(() => {
            const total = progresso.reduce((acc, p) => acc + (p.idsGerados?.length || 0), 0)
            return total > 0 ? <span className="text-sysgate-600 font-medium">{total} IDs gerados</span> : null
          })()}
        </div>
        {concluido && (() => {
          return (
            <div className="flex gap-2 mt-1">
              {todosIds.length > 0 && (
                <button
                  onClick={() => navigator.clipboard.writeText(todosIds.join('\n'))}
                  className="btn-secondary flex-1 justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar {todosIds.length} IDs
                </button>
              )}
              <button onClick={exportarCSV} className="btn-secondary flex-1 justify-center">
                Exportar relatório CSV
              </button>
            </div>
          )
        })()}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-200 text-sm font-semibold text-gray-700">
          Log de execução
        </div>
        <div
          ref={progressoRef}
          className="divide-y divide-gray-100 max-h-96 overflow-y-auto scrollbar-thin"
        >
          {progresso.map((p, i) => (
            <div key={i} className={`px-4 py-3 ${p.status === 'erro' ? 'bg-red-50' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                  p.status === 'ok' ? 'bg-green-500' : p.status === 'erro' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-700">
                      Lote {p.lote}/{p.totalLotes}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{p.count} itens</span>
                    <span className={`text-xs font-mono ${p.status === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                      {p.msg}
                    </span>
                    {p.idsGerados?.length > 0 && (
                      <button
                        onClick={() => navigator.clipboard.writeText(p.idsGerados.join('\n'))}
                        className="ml-auto text-xs text-sysgate-600 hover:text-sysgate-800 font-medium flex items-center gap-1 flex-shrink-0"
                        title="Copiar IDs deste lote"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {p.idsGerados.length} IDs
                      </button>
                    )}
                  </div>
                  {p.idsGerados?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {p.idsGerados.slice(0, 30).map((id, j) => {
                        const chave = `${p.lote}-${id}`
                        const consulta = consultasResultado[chave]
                        const jaConsultado = !!consulta?.statusCode
                        return (
                          <div key={j} className="flex items-center gap-0.5">
                            <span
                              className="text-xs font-mono bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-l cursor-pointer hover:bg-green-100"
                              title="Clique para copiar"
                              onClick={() => navigator.clipboard.writeText(id)}
                            >
                              {id}
                            </span>
                            {jaConsultado && (
                              <button
                                onClick={() => toggleResultado(chave)}
                                title={consulta?.aberto ? 'Recolher' : 'Expandir'}
                                className={`text-xs px-1.5 py-0.5 border-y font-medium transition-colors ${
                                  consulta?.aberto
                                    ? 'bg-sysgate-600 text-white border-sysgate-600'
                                    : 'bg-white text-sysgate-500 border-green-200 hover:bg-sysgate-50'
                                }`}
                              >
                                {consulta?.aberto ? '▲' : '▼'}
                              </button>
                            )}
                            <button
                              onClick={() => consultarLote(chave, id)}
                              disabled={consulta?.consultando}
                              title={jaConsultado ? 'Reprocessar GET' : 'Consultar GET'}
                              className={`text-xs px-1.5 py-0.5 rounded-r border font-medium transition-colors flex items-center gap-0.5 ${
                                jaConsultado
                                  ? 'bg-white text-gray-500 border-green-200 hover:bg-gray-50'
                                  : 'bg-white text-sysgate-600 border-green-200 hover:bg-sysgate-50'
                              }`}
                            >
                              {consulta?.consultando
                                ? <span className="w-3 h-3 border-2 border-sysgate-300 border-t-sysgate-600 rounded-full animate-spin inline-block" />
                                : jaConsultado ? '↺' : '▼ GET'
                              }
                            </button>
                          </div>
                        )
                      })}
                      {p.idsGerados.length > 30 && (
                        <span className="text-xs text-gray-400 self-center">+{p.idsGerados.length - 30} mais</span>
                      )}
                    </div>
                  )}
                  {/* Resultados expandidos por ID */}
                  {p.idsGerados?.map((id) => {
                    const chave = `${p.lote}-${id}`
                    const consulta = consultasResultado[chave]
                    if (!consulta?.aberto || consulta?.consultando) return null
                    return (
                      <div key={chave} className="mt-1 rounded-lg overflow-hidden border border-gray-700">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-300">GET /{id}</span>
                            {consulta.statusCode && (
                              <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                                consulta.statusCode < 300 ? 'bg-green-900 text-green-300' :
                                consulta.statusCode < 400 ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'
                              }`}>{consulta.statusCode}</span>
                            )}
                          </div>
                          <button
                            onClick={() => navigator.clipboard.writeText(JSON.stringify(consulta.data, null, 2))}
                            className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            copiar
                          </button>
                        </div>
                        <pre
                          className="bg-gray-950 px-3 py-2.5 text-xs font-mono overflow-auto scrollbar-thin max-h-64 leading-5"
                          style={{ color: '#e5e7eb' }}
                          dangerouslySetInnerHTML={{ __html: highlightJson(consulta.data) }}
                        />
                      </div>
                    )
                  })}
                  {p.status === 'erro' && p.resposta !== undefined && (
                    <p className="text-xs text-red-500 font-mono truncate">
                      {JSON.stringify(p.resposta).slice(0, 150)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Painel de todos os IDs gerados */}
      {concluido && (() => {
        if (todosIds.length === 0) return null
        return (
          <div className="card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                IDs gerados
                <span className="ml-2 text-xs font-normal text-gray-400">{todosIds.length} registros</span>
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(todosIds.join('\n'))}
                className="flex items-center gap-1.5 text-xs text-sysgate-600 hover:text-sysgate-800 font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar todos
              </button>
            </div>
            <div className="p-3 max-h-48 overflow-y-auto scrollbar-thin">
              <div className="flex flex-wrap gap-1">
                {todosIds.map((id, i) => (
                  <span
                    key={i}
                    className="text-xs font-mono bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded cursor-pointer hover:bg-green-100 transition-colors"
                    title="Clique para copiar"
                    onClick={() => navigator.clipboard.writeText(id)}
                  >
                    {id}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Monitor de lotes — status por ID */}
      {concluido && (() => {
        if (todosIdsComLote.length === 0) return null

        return (
          <div className="card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-semibold text-gray-700 shrink-0">Monitor de lotes</span>
                <div className="flex items-center gap-2 text-xs">
                  {nSucesso > 0 && <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">{nSucesso} ✓</span>}
                  {nErro > 0 && <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">{nErro} ✗</span>}
                  {pendentes.length > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">{pendentes.length} pendentes</span>}
                </div>
              </div>
              {pendentes.length > 0 && (
                <button
                  onClick={consultarTodosPendentes}
                  disabled={consultandoTodos}
                  className="flex items-center gap-1.5 text-xs bg-sysgate-600 text-white px-3 py-1.5 rounded-lg hover:bg-sysgate-700 disabled:opacity-50 transition-colors shrink-0 font-medium"
                >
                  {consultandoTodos
                    ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Consultando...</>
                    : <>↺ Consultar {pendentes.length} pendentes</>
                  }
                </button>
              )}
            </div>
            <div className="p-3 max-h-64 overflow-y-auto scrollbar-thin">
              <div className="flex flex-wrap gap-1.5">
                {todosIdsComLote.map(({ id, lote }, i) => {
                  const chave = `${lote}-${id}`
                  const status = getStatus(chave)
                  const consulta = consultasResultado[chave]
                  return (
                    <button
                      key={i}
                      onClick={() => status !== 'consultando' && consultarLote(chave, id)}
                      disabled={status === 'consultando'}
                      title={
                        status === 'sucesso' ? `${consulta.statusCode} — clique para reprocessar` :
                        status === 'erro' ? `${consulta.statusCode} — clique para reprocessar` :
                        'Clique para consultar'
                      }
                      className={`text-xs font-mono border px-2 py-1 rounded transition-all flex items-center gap-1 ${CORES[status]}`}
                    >
                      {status === 'consultando' && (
                        <span className="w-2.5 h-2.5 border border-blue-400 border-t-blue-700 rounded-full animate-spin shrink-0" />
                      )}
                      {status === 'sucesso' && <span className="shrink-0 font-bold">✓</span>}
                      {status === 'erro' && <span className="shrink-0 font-bold">✗</span>}
                      <span>{id}</span>
                      {consulta?.statusCode && (
                        <span className="opacity-50 text-[10px] font-sans shrink-0">{consulta.statusCode}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}
