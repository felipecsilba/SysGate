import { useEffect, useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import Busca from '../../components/Busca'
import Confirmar from '../../components/Confirmar'
import Icone from '../../components/Icone'
import JsonColorido from '../../components/JsonColorido'
import { proxyApi } from '../../lib/api'
import { fixo } from '../../lib/corpo'
import {
  autoMapear, colunasSemCabecalho, construirBodyLinha, csvResultados, dividirEmLotes,
  interpretarEnvio, interpretarStatusLote, linhaDoIdIntegracao,
} from '../../lib/lote'
import { contem } from '../../lib/texto'

const INTERVALO_CONSULTA_MS = 5000
const LIMITE_CONSULTA_MS = 60000
const espera = ms => new Promise(r => setTimeout(r, ms))
const gerarRunId = () => Math.random().toString(36).slice(2, 6).toUpperCase()

const COR_STATUS = {
  enviando: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  fila: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  ok: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  parcial: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  erro: 'bg-red-500/10 text-red-600 dark:text-red-400',
}
const ROTULO_STATUS = { enviando: 'enviando', fila: 'na fila', ok: 'gravado', parcial: 'parcial', erro: 'erro' }

function Secao({ titulo, children, extra }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-suave">{titulo}</h4>
        {extra}
      </div>
      {children}
    </section>
  )
}

// Endpoint sem schema: a linha do CSV vira o objeto (número quando der)
function linhaComoObjeto(linha) {
  return Object.fromEntries(Object.entries(linha).map(([k, v]) => [k, v !== '' && !Number.isNaN(Number(v)) ? Number(v) : v]))
}

export default function AbaLote({ campos, municipioId, sistemaId, endpoint, metodo, pathFinal, urlCompleta, motivoBloqueio }) {
  const [arquivo, setArquivo] = useState(null)
  const [semCabecalho, setSemCabecalho] = useState(false)
  const [csv, setCsv] = useState(null) // { colunas, linhas }
  const [erroCsv, setErroCsv] = useState('')
  const [mapa, setMapa] = useState({})
  const [buscaCampo, setBuscaCampo] = useState('')
  const [tamanho, setTamanho] = useState(50)
  const [simultaneos, setSimultaneos] = useState(3)
  const [confirmar, setConfirmar] = useState(false)
  const [execucao, setExecucao] = useState(null) // { runId, resultados[], ativo }
  const parar = useRef(false)
  const [copiado, setCopiado] = useState(false)
  const areaProgresso = useRef(null)
  // Ao começar o envio, o progresso fica abaixo da dobra — rola até ele
  useEffect(() => { if (execucao?.ativo) areaProgresso.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [execucao?.ativo])

  // (Re)lê o CSV ao trocar de arquivo ou do modo sem cabeçalho
  useEffect(() => {
    if (!arquivo) return
    setErroCsv('')
    Papa.parse(arquivo, {
      header: !semCabecalho,
      skipEmptyLines: true,
      complete: r => {
        if (semCabecalho) {
          const colunas = colunasSemCabecalho(Math.max(0, ...r.data.map(l => l.length)))
          setCsv({ colunas, linhas: r.data.map(l => Object.fromEntries(colunas.map((c, i) => [c, l[i] ?? '']))) })
        } else {
          setCsv({ colunas: r.meta.fields || [], linhas: r.data })
        }
      },
      error: e => setErroCsv(`Não consegui ler o CSV: ${e.message}`),
    })
  }, [arquivo, semCabecalho])

  // Novo CSV ou endpoint → pré-mapeia pelos nomes
  useEffect(() => { setMapa(csv ? autoMapear(campos, csv.colunas) : {}) }, [csv, campos])

  const lotes = useMemo(() => (csv ? dividirEmLotes(csv.linhas, Math.max(1, Math.min(300, Number(tamanho) || 1))) : []), [csv, tamanho])
  const runIdPrevia = useMemo(() => gerarRunId(), [csv, endpoint]) // eslint-disable-line react-hooks/exhaustive-deps
  const montar = (linha, n, runId) => (campos.length ? construirBodyLinha(campos, mapa, linha, n, runId) : linhaComoObjeto(linha))
  const previa = csv?.linhas.length ? JSON.stringify([montar(csv.linhas[0], 1, runIdPrevia)], null, 2) : ''

  const temIdIntegracao = campos.some(c => c.campo === 'idIntegracao')
  const bloqueio = motivoBloqueio
    || (!['POST', 'PUT', 'PATCH'].includes(metodo) && 'Envio em lote é para POST, PUT ou PATCH')
    || (!csv?.linhas.length && 'Carregue um CSV com dados')
    || (campos.length && !Object.keys(mapa).length && 'Mapeie ao menos um campo')
    || (execucao?.ativo && 'Envio em andamento')
    || null

  const atualizar = (runIdx, mudanca) =>
    setExecucao(e => ({ ...e, resultados: e.resultados.map((r, i) => (i === runIdx ? { ...r, ...mudanca } : r)) }))

  async function consultarLote(i, idLote, ate) {
    while (true) {
      try {
        const st = await proxyApi.executar({ municipioId, sistemaId, path: `${pathFinal}/${encodeURIComponent(idLote)}`, metodo: 'GET', tipo: 'individual' })
        const r = interpretarStatusLote(st.data)
        if (r.status !== 'fila') return atualizar(i, r)
      } catch { /* rede instável: tenta de novo até o limite */ }
      if (Date.now() >= ate || parar.current) return atualizar(i, { status: 'fila', finalFila: true, mensagem: 'Ainda na fila da Betha — use "Consultar pendentes" mais tarde' })
      await espera(INTERVALO_CONSULTA_MS)
    }
  }

  async function enviar() {
    const runId = gerarRunId()
    parar.current = false
    setExecucao({
      runId, ativo: true,
      resultados: lotes.map(l => ({ indice: l.indice, itens: l.linhas.length, primeiraLinha: l.primeiraLinha, status: 'aguardando', mensagem: '', ids: [], erros: [] })),
    })
    let proximo = 0
    const trabalhador = async () => {
      while (proximo < lotes.length && !parar.current) {
        const lote = lotes[proximo++]
        atualizar(lote.indice, { status: 'enviando', mensagem: 'Enviando…' })
        const body = lote.linhas.map((linha, k) => montar(linha, lote.primeiraLinha + k, runId))
        try {
          const res = await proxyApi.executar({ municipioId, sistemaId, endpointId: endpoint?.id ?? null, path: pathFinal, metodo, body, tipo: 'lote' })
          const r = interpretarEnvio(res)
          atualizar(lote.indice, { ...r, resposta: res.data })
          if (r.status === 'fila') await consultarLote(lote.indice, r.idLote, Date.now() + LIMITE_CONSULTA_MS)
        } catch (err) {
          atualizar(lote.indice, { status: 'erro', mensagem: err.response?.data?.detail || err.response?.data?.error || err.message })
        }
      }
    }
    await Promise.allSettled(Array.from({ length: Math.min(simultaneos, lotes.length) }, trabalhador))
    setExecucao(e => ({ ...e, ativo: false }))
  }

  async function consultarPendentes() {
    setExecucao(e => ({ ...e, ativo: true }))
    parar.current = false
    const pendentes = execucao.resultados.filter(r => r.status === 'fila' && r.idLote)
    await Promise.allSettled(pendentes.map(r => consultarLote(r.indice, r.idLote, Date.now())))
    setExecucao(e => ({ ...e, ativo: false }))
  }

  const resultados = execucao?.resultados ?? []
  const concluidos = resultados.filter(r => ['ok', 'parcial', 'erro'].includes(r.status) || r.finalFila).length
  const todosIds = resultados.flatMap(r => r.ids || [])
  const pendentes = resultados.filter(r => r.status === 'fila' && r.idLote).length

  function exportar() {
    const blob = new Blob(['﻿' + csvResultados(resultados)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `envio-lote-${execucao.runId}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function copiarIds() {
    await navigator.clipboard.writeText(todosIds.join(','))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  const camposVisiveis = campos.filter(c => contem(c.rotulo, buscaCampo) || contem(c.pai, buscaCampo))
  const exemploColuna = col => (csv?.linhas[0]?.[col] ?? '').toString().slice(0, 24)

  return (
    <div className="space-y-6">
      <Secao
        titulo="Planilha (CSV)"
        extra={
          <label className="flex items-center gap-2 text-xs text-suave">
            <input type="checkbox" checked={semCabecalho} onChange={e => setSemCabecalho(e.target.checked)} className="accent-[rgb(var(--acento))]" />
            Sem cabeçalho (colunas A, B, C…)
          </label>
        }
      >
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-borda px-4 py-4 hover:bg-texto/[0.02]">
          <Icone nome="importar" className="h-5 w-5 text-suave" />
          <span className="text-sm">
            {arquivo ? <><span className="font-medium">{arquivo.name}</span> <span className="text-suave">· {csv?.linhas.length ?? 0} linhas · {csv?.colunas.length ?? 0} colunas</span></> : <span className="text-suave">Clique para escolher o arquivo .csv</span>}
          </span>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={e => { setArquivo(e.target.files?.[0] ?? null); setExecucao(null) }} />
        </label>
        {erroCsv && <p className="mt-2 text-sm text-perigo">{erroCsv}</p>}
        {csv?.linhas.length > 0 && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-borda">
            <table className="w-full text-left text-xs">
              <thead className="bg-texto/[0.03] text-suave">
                <tr>{csv.colunas.map(c => <th key={c} className="whitespace-nowrap px-3 py-1.5 font-medium">{c}</th>)}</tr>
              </thead>
              <tbody>
                {csv.linhas.slice(0, 4).map((l, i) => (
                  <tr key={i} className="border-t border-borda">{csv.colunas.map(c => <td key={c} className="max-w-[180px] truncate whitespace-nowrap px-3 py-1.5 font-mono">{l[c]}</td>)}</tr>
                ))}
              </tbody>
            </table>
            {csv.linhas.length > 4 && <p className="border-t border-borda px-3 py-1 text-[11px] text-suave">+ {csv.linhas.length - 4} linhas</p>}
          </div>
        )}
      </Secao>

      {csv && campos.length > 0 && (
        <Secao titulo={`Mapeamento · ${Object.keys(mapa).length} de ${campos.length} campos`}>
          <Busca valor={buscaCampo} onMudar={setBuscaCampo} placeholder="Buscar campo…" className="mb-2 h-8" />
          <div className="max-h-96 overflow-y-auto rounded-xl border border-borda">
            {camposVisiveis.map(c => {
              const m = mapa[c.campo]
              const valorSelect = !m ? '' : m.modo === 'fixo' ? '__fixo' : `col:${m.coluna}`
              const mudar = v => setMapa(atual => {
                const novo = { ...atual }
                if (!v) delete novo[c.campo]
                else if (v === '__fixo') novo[c.campo] = { modo: 'fixo', valor: '' }
                else novo[c.campo] = { modo: 'coluna', coluna: v.slice(4) }
                return novo
              })
              return (
                <div key={c.campo} className="flex items-center gap-3 border-b border-borda px-3 py-1.5 last:border-b-0">
                  <span className="w-48 shrink-0 truncate font-mono text-xs" title={c.descricao || c.campo}>
                    {c.pai && <span className="text-suave">{c.pai}.</span>}{c.rotulo}
                    {(c.obrigatorio || fixo(c)) && <span className="ml-0.5 text-perigo">*</span>}
                  </span>
                  <span className="w-16 shrink-0 font-mono text-[10px] text-suave">{c.tipo}</span>
                  <select className="campo h-8 py-1 text-xs" value={valorSelect} onChange={e => mudar(e.target.value)}>
                    <option value="">{c.campo === 'idIntegracao' ? '— automático (RUNID-L<linha>) —' : '— não enviar —'}</option>
                    {csv.colunas.map(col => <option key={col} value={`col:${col}`}>Coluna {col}{exemploColuna(col) ? ` — ${exemploColuna(col)}` : ''}</option>)}
                    <option value="__fixo">Valor fixo…</option>
                  </select>
                  {m?.modo === 'fixo' && (
                    <input
                      className="campo h-8 w-40 py-1 font-mono text-xs"
                      placeholder="valor para todas as linhas"
                      value={m.valor}
                      onChange={e => setMapa(a => ({ ...a, [c.campo]: { modo: 'fixo', valor: e.target.value } }))}
                    />
                  )}
                </div>
              )
            })}
          </div>
          {temIdIntegracao && !mapa.idIntegracao && (
            <p className="mt-2 text-xs text-suave">O idIntegracao de cada item vira <span className="font-mono">RUNID-L&lt;linha&gt;</span> — é o que liga um erro da Betha de volta à linha da planilha.</p>
          )}
        </Secao>
      )}

      {csv?.linhas.length > 0 && (
        <Secao titulo="Envio">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="rotulo">Itens por lote <span className="font-normal">(o limite varia por endpoint — 50 é o mais comum)</span></span>
              <input type="number" min="1" max="300" className="campo" value={tamanho} onChange={e => setTamanho(e.target.value)} />
            </label>
            <label className="block">
              <span className="rotulo">Lotes ao mesmo tempo</span>
              <input type="number" min="1" max="5" className="campo" value={simultaneos} onChange={e => setSimultaneos(Math.max(1, Math.min(5, Number(e.target.value) || 1)))} />
            </label>
          </div>
          {previa && <div className="mt-3"><JsonColorido texto={previa} titulo={`1º item de ${csv.linhas.length} (prévia)`} alturaMax="220px" /></div>}
          <div className="mt-3 flex items-center justify-end gap-3">
            {bloqueio && <span className="text-xs text-suave">{bloqueio}</span>}
            {execucao?.ativo && <button type="button" className="botao-secundario" onClick={() => { parar.current = true }}>Parar</button>}
            <button type="button" className="botao-primario" disabled={!!bloqueio} onClick={() => setConfirmar(true)}>
              <Icone nome="sandbox" className="h-4 w-4" /> Enviar {lotes.length} lote{lotes.length === 1 ? '' : 's'} · {csv.linhas.length} itens
            </button>
          </div>
        </Secao>
      )}

      {execucao && (
        <div ref={areaProgresso} className="scroll-mt-4">
        <Secao
          titulo={`Progresso · ${concluidos}/${resultados.length} lotes`}
          extra={
            <div className="flex items-center gap-2">
              {pendentes > 0 && !execucao.ativo && <button type="button" className="botao-secundario h-7 px-2.5 text-xs" onClick={consultarPendentes}>Consultar pendentes ({pendentes})</button>}
              {todosIds.length > 0 && <button type="button" className="botao-secundario h-7 px-2.5 text-xs" onClick={copiarIds}>{copiado ? 'Copiado!' : `Copiar ${todosIds.length} IDs`}</button>}
              {!execucao.ativo && <button type="button" className="botao-secundario h-7 px-2.5 text-xs" onClick={exportar}>Exportar CSV</button>}
            </div>
          }
        >
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-texto/[0.07]">
            <div className="h-full rounded-full bg-acento transition-all" style={{ width: `${(concluidos / Math.max(1, resultados.length)) * 100}%` }} />
          </div>
          <ul className="space-y-1.5">
            {resultados.map(r => (
              <li key={r.indice} className="rounded-xl border border-borda px-3 py-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-20 shrink-0 font-medium">Lote {r.indice + 1}/{resultados.length}</span>
                  <span className="w-24 shrink-0 text-suave">linhas {r.primeiraLinha}–{r.primeiraLinha + r.itens - 1}</span>
                  <span className={`rounded-md px-2 py-0.5 font-medium ${COR_STATUS[r.status] || 'bg-texto/[0.06] text-suave'}`}>{ROTULO_STATUS[r.status] || r.status}</span>
                  <span className="min-w-0 flex-1 truncate text-suave" title={r.mensagem}>{r.mensagem}</span>
                  {r.ids?.length > 0 && <span className="shrink-0 font-mono text-[11px] text-suave">{r.ids.length} id{r.ids.length === 1 ? '' : 's'}</span>}
                </div>
                {r.erros?.length > 0 && (
                  <ul className="mt-2 space-y-0.5 border-t border-borda pt-2">
                    {r.erros.map((e, k) => {
                      const linha = linhaDoIdIntegracao(e.idIntegracao, execucao.runId)
                      return (
                        <li key={k} className="flex gap-2 text-[11px]">
                          <span className="shrink-0 font-mono text-perigo">{linha ? `linha ${linha}` : e.idIntegracao}</span>
                          <span className="text-suave">{e.mensagem}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </Secao>
        </div>
      )}

      <Confirmar
        aberto={confirmar}
        titulo={`Enviar ${csv?.linhas.length ?? 0} itens em ${lotes.length} lote${lotes.length === 1 ? '' : 's'}?`}
        mensagem={`${metodo} ${urlCompleta} — os dados vão direto para a API do sistema, com o token do município. Confira a prévia antes.`}
        rotulo="Enviar"
        onConfirmar={async () => { enviar() }}
        onFechar={() => setConfirmar(false)}
      />
    </div>
  )
}
