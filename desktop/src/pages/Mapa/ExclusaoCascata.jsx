import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CaixaBusca from '../../components/CaixaBusca'
import Confirmar from '../../components/Confirmar'
import Icone from '../../components/Icone'
import MetodoBadge from '../../components/MetodoBadge'
import Pagina from '../../components/Pagina'
import { municipiosApi, proxyApi, sistemasApi } from '../../lib/api'
import { esperaApos429, interpretarEnvio, interpretarStatusLote } from '../../lib/lote'
import { analisar, aplicarRetorno, faltamNoLote, lerLevantamento, montarPlano, parearLotes, semOsExcluidos } from '../../lib/exclusaoImoveis'

const espera = ms => new Promise(r => setTimeout(r, ms))
const INTERVALO_CONSULTA_MS = 8000 // cada consulta conta no limite da Betha (429 depois de ~120 chamadas em poucos minutos)
const LIMITE_CONSULTA_MS = 3 * 60 * 1000
// Lote a lote: depois do PUT, tenta o DELETE a cada 15 s; sem liberar em 3 min manda o PUT de novo; 3 PUTs sem liberar = desiste do lote
const ESPERA_DELETE_MS = 15000
const REENVIAR_PUT_MS = 3 * 60 * 1000
const MAX_PUTS_POR_LOTE = 3
const num = n => Number(n).toLocaleString('pt-BR')

// Exclusão em cascata de imóveis: cola o JSONL do Levantamento → análise → plano na ordem da receita validada → envio por etapa.
export default function ExclusaoCascata() {
  const navegar = useNavigate()
  const [texto, setTexto] = useState('')
  const [leitura, setLeitura] = useState(null) // { imoveis, descartadas }
  const analise = useMemo(() => (leitura ? analisar(leitura.imoveis) : null), [leitura])
  const [rodada, setRodada] = useState({ n: 1, excluidos: 0 }) // rodadas sem rodar o Levantamento de novo

  function analisarTexto(t) {
    const r = lerLevantamento(t)
    setLeitura(r.imoveis.length ? r : { ...r, vazio: true })
    setRodada({ n: 1, excluidos: 0 })
  }
  // Nova rodada: só os que o DELETE ainda não excluiu (o resto do levantamento continua valendo)
  function tirarExcluidos(porId) {
    const { restantes, removidos } = semOsExcluidos(leitura.imoveis, porId)
    setLeitura(l => ({ ...l, imoveis: restantes }))
    setRodada(r => ({ n: r.n + 1, excluidos: r.excluidos + removidos }))
  }
  async function escolherArquivo(e) {
    const arq = e.target.files?.[0]
    if (!arq) return
    const t = await arq.text()
    setTexto(t)
    analisarTexto(t)
  }

  return (
    <Pagina titulo="Exclusão em cascata · Imóveis" icone="mapa">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
          <button type="button" onClick={() => navegar('/mapa')} className="flex items-center gap-1 text-sm text-suave hover:text-texto">
            <Icone nome="direita" className="h-3.5 w-3.5 rotate-180" /> Mapa de dependências
          </button>

          <section className="rounded-xl border border-borda p-4">
            <h3 className="text-sm font-semibold">1. Resultado do Levantamento de vínculos</h3>
            <p className="mt-1 text-xs text-suave">Cole o conteúdo do <span className="font-mono">vinculos_imoveis.jsonl</span> (de dentro do zip) ou escolha o arquivo. Linhas copiadas do console, com a hora na frente, também servem.</p>
            <textarea className="campo mt-3 h-36 font-mono text-[11px]" value={texto} onChange={e => setTexto(e.target.value)} placeholder='{"idImovel":34631457,"existe":true,"codigo":11,...}' spellCheck={false} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button type="button" className="botao-primario" disabled={!texto.trim()} onClick={() => analisarTexto(texto)}>Analisar</button>
              <label className="botao-secundario cursor-pointer">Escolher arquivo<input type="file" accept=".jsonl,.txt,.json" className="hidden" onChange={escolherArquivo} /></label>
              {leitura?.descartadas > 0 && <span className="text-xs text-suave">{leitura.descartadas} linha(s) ignorada(s) (não eram registro do levantamento)</span>}
              {leitura?.vazio && <span className="text-xs text-perigo">Nenhum imóvel encontrado no texto.</span>}
            </div>
          </section>

          {analise && !leitura.vazio && rodada.n > 1 && (
            <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300">
              Rodada {rodada.n} · {num(rodada.excluidos)} imóvel(is) já excluído(s) e tirado(s) do plano nesta sessão. A análise abaixo é só dos que faltam.
            </p>
          )}
          {analise && !leitura.vazio && <Analise analise={analise} />}
          {analise && !leitura.vazio && <Envio imoveis={analise.noPlano} onTirarExcluidos={tirarExcluidos} />}
        </div>
      </div>
    </Pagina>
  )
}

function Analise({ analise }) {
  const cartoes = [
    { rotulo: 'Imóveis no arquivo', valor: analise.total },
    { rotulo: 'Entram no plano', valor: analise.noPlano.length, cor: 'text-emerald-600 dark:text-emerald-400' },
    { rotulo: 'Com vínculo financeiro', valor: analise.comFinanceiro.length, cor: analise.comFinanceiro.length ? 'text-amber-600 dark:text-amber-400' : '' },
    { rotulo: 'Para revisar', valor: analise.revisar.length, cor: analise.revisar.length ? 'text-amber-600 dark:text-amber-400' : '' },
    { rotulo: 'Não encontrados', valor: analise.inexistentes.length },
  ]
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold">2. Análise</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {cartoes.map(c => (
          <div key={c.rotulo} className="rounded-xl border border-borda px-3 py-2.5">
            <div className={`text-xl font-semibold tabular-nums ${c.cor || ''}`}>{num(c.valor)}</div>
            <div className="text-[11px] text-suave">{c.rotulo}</div>
          </div>
        ))}
      </div>

      {(analise.comFinanceiro.length > 0 || analise.revisar.length > 0) && (
        <div className="rounded-xl border-2 border-amber-500/50 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2 font-semibold"><Icone nome="alerta" className="h-4 w-4" /> Fora do plano — revisar antes</div>
          <ListaFora titulo="Com vínculo financeiro" itens={analise.comFinanceiro} />
          <ListaFora titulo="Com dependência cuja exclusão ainda não foi validada" itens={analise.revisar} />
        </div>
      )}
      {analise.inexistentes.length > 0 && (
        <p className="text-xs text-suave">Não encontrados (id errado ou já excluídos): {analise.inexistentes.slice(0, 30).map(i => i.idImovel).join(', ')}{analise.inexistentes.length > 30 ? '…' : ''}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-borda">
        <table className="w-full text-sm">
          <thead className="bg-texto/[0.03] text-left text-[11px] uppercase tracking-wider text-suave">
            <tr><th className="px-3 py-2 font-semibold">Dependência</th><th className="px-3 py-2 text-right font-semibold">Registros</th><th className="px-3 py-2 text-right font-semibold">Imóveis</th></tr>
          </thead>
          <tbody>
            {analise.porDependencia.map(d => (
              <tr key={d.chave} className={`border-t border-borda ${d.registros ? '' : 'text-suave'}`}>
                <td className="px-3 py-1.5">{d.rotulo}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{num(d.registros)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{num(d.imoveis)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ListaFora({ titulo, itens }) {
  if (!itens.length) return null
  return (
    <div className="mt-2">
      <div className="text-xs font-semibold">{titulo} · {itens.length}</div>
      <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto text-xs">
        {itens.map(i => <li key={i.idImovel}>Código {i.codigo} (id {i.idImovel}) — {i.motivo}</li>)}
      </ul>
    </div>
  )
}

// Fase 2: município/sistema, plano por etapa e envio (o Felipe clica em cada etapa)
function Envio({ imoveis, onTirarExcluidos }) {
  // PUT de inscrição em lotes menores e espaçados: a fila de reprocessamento da Betha é lenta e
  // 43 PUTs de 50 seguidos fizeram o DELETE passar só nos primeiros lotes
  const [lotePut, setLotePut] = useState(50)
  const [intervaloPut, setIntervaloPut] = useState(1) // segundos entre um lote de PUT e o próximo (padrão pedido pelo Felipe: 1 lote por segundo)
  const plano = useMemo(() => montarPlano(imoveis, undefined, lotePut), [imoveis, lotePut])
  const [municipios, setMunicipios] = useState([])
  const [sistemas, setSistemas] = useState([])
  const [municipioId, setMunicipioId] = useState(null)
  const [sistemaId, setSistemaId] = useState(null)
  const [tokens, setTokens] = useState([])
  const [execucao, setExecucao] = useState({}) // chave da etapa → { lotes: {indice: {status, mensagem, idLote}}, porId, ativo, fim }
  const [confirmar, setConfirmar] = useState(null) // etapa a enviar
  const parar = useRef(false)

  useEffect(() => {
    municipiosApi.listar().then(setMunicipios).catch(() => {})
    sistemasApi.listar().then(l => { setSistemas(l); const t = l.find(s => /tribut/i.test(s.nome)); if (t) setSistemaId(t.id) }).catch(() => {})
  }, [])
  useEffect(() => { if (municipioId) municipiosApi.tokens(municipioId).then(setTokens).catch(() => setTokens([])) }, [municipioId])
  useEffect(() => { setExecucao({}) }, [imoveis])

  const vinculo = tokens.find(t => t.sistemaId === sistemaId)
  const municipio = municipios.find(m => m.id === municipioId)
  const pronto = municipioId && sistemaId && vinculo

  const atualizar = (chave, f) => setExecucao(e => ({ ...e, [chave]: f(e[chave] || { lotes: {}, porId: {} }) }))
  const etapaConcluida = etapa => !etapa.lotes.length || execucao[etapa.chave]?.fim
  const liberada = i => plano.slice(0, i).every(etapaConcluida)

  // Toda chamada passa aqui: no 429 a Betha está bloqueando — espera e repete a MESMA chamada (nunca pula para o próximo lote).
  // Devolve a resposta e quanto tempo ficou parado, para a consulta não gastar o próprio limite esperando.
  async function chamar(etapa, lote, params) {
    let parado = 0
    for (let tentativa = 0; ; tentativa++) {
      const res = await proxyApi.executar(params)
      if (res.statusCode !== 429 || parar.current) return { res, parado }
      const ms = esperaApos429(tentativa)
      const volta = new Date(Date.now() + ms).toLocaleTimeString('pt-BR')
      atualizar(etapa.chave, x => ({ ...x, lotes: { ...x.lotes, [lote.indice]: { ...x.lotes[lote.indice], status: 'pausa', mensagem: `Limite de chamadas da Betha (429) — tenta de novo às ${volta}` } } }))
      const fim = Date.now() + ms
      while (Date.now() < fim && !parar.current) await espera(1000)
      parado += ms
    }
  }

  async function consultar(etapa, lote, idLote) {
    let ate = Date.now() + LIMITE_CONSULTA_MS
    while (true) {
      try {
        const { res: st, parado } = await chamar(etapa, lote, { municipioId, sistemaId, path: `${etapa.path}/${encodeURIComponent(idLote)}`, metodo: 'GET', tipo: 'individual' })
        ate += parado
        if (st.statusCode === 429) throw new Error('429') // parou no meio da espera
        const r = interpretarStatusLote(st.data)
        if (r.status !== 'fila') {
          atualizar(etapa.chave, x => ({ ...x, lotes: { ...x.lotes, [lote.indice]: { status: r.status, mensagem: r.mensagem, idLote } }, porId: aplicarRetorno(x.porId, r, lote.ids) }))
          return
        }
      } catch { /* rede instável: tenta de novo até o limite */ }
      if (Date.now() >= ate || parar.current) {
        atualizar(etapa.chave, x => ({ ...x, lotes: { ...x.lotes, [lote.indice]: { status: 'fila', mensagem: 'Ainda na fila — consulte de novo depois', idLote } } }))
        return
      }
      await espera(INTERVALO_CONSULTA_MS)
    }
  }

  async function enviarEtapa(etapa, lotes = etapa.lotes) {
    parar.current = false
    atualizar(etapa.chave, x => ({ ...x, ativo: true, fim: false, pulada: false }))
    let enviados = 0
    for (const lote of lotes) {
      if (parar.current) break
      if (!lote.body.length) continue // nunca envia lote vazio (PUT vazio reprocessa a entidade toda)
      if (etapa.metodo === 'PUT' && enviados > 0 && intervaloPut > 0) {
        const fim = Date.now() + intervaloPut * 1000
        const hora = new Date(fim).toLocaleTimeString('pt-BR')
        atualizar(etapa.chave, x => ({ ...x, lotes: { ...x.lotes, [lote.indice]: { status: 'pausa', mensagem: `Aguardando o intervalo — sai às ${hora}` } } }))
        while (Date.now() < fim && !parar.current) await espera(1000)
        if (parar.current) { atualizar(etapa.chave, x => { const { [lote.indice]: _, ...resto } = x.lotes; return { ...x, lotes: resto } }); break }
      }
      enviados++
      atualizar(etapa.chave, x => ({ ...x, lotes: { ...x.lotes, [lote.indice]: { status: 'enviando', mensagem: 'Enviando…' } } }))
      try {
        const { res } = await chamar(etapa, lote, { municipioId, sistemaId, path: etapa.path, metodo: etapa.metodo, body: lote.body, tipo: 'lote' })
        if (etapa.metodo === 'PUT') {
          const ok = res.statusCode >= 200 && res.statusCode < 300
          const r = ok ? { status: 'enviado', mensagem: 'Na fila de reprocessamento (sem idLote)' } : { status: 'erro', mensagem: `HTTP ${res.statusCode}` }
          atualizar(etapa.chave, x => ({ ...x, lotes: { ...x.lotes, [lote.indice]: r }, porId: aplicarRetorno(x.porId, ok ? { status: 'ok', erros: [] } : r, lote.ids) }))
        } else {
          const r = interpretarEnvio(res)
          if (r.status === 'fila') {
            atualizar(etapa.chave, x => ({ ...x, lotes: { ...x.lotes, [lote.indice]: { status: 'fila', mensagem: `Lote ${r.idLote} na fila`, idLote: r.idLote } } }))
            await consultar(etapa, lote, r.idLote)
          } else {
            atualizar(etapa.chave, x => ({ ...x, lotes: { ...x.lotes, [lote.indice]: r }, porId: aplicarRetorno(x.porId, r, lote.ids) }))
          }
        }
      } catch (err) {
        const r = { status: 'erro', mensagem: err.response?.data?.error || err.message }
        atualizar(etapa.chave, x => ({ ...x, lotes: { ...x.lotes, [lote.indice]: r }, porId: aplicarRetorno(x.porId, r, lote.ids) }))
      }
    }
    atualizar(etapa.chave, x => ({ ...x, ativo: false, fim: !parar.current }))
  }

  // GET do idLote até sair da fila; null se não saiu no limite (ou parou)
  async function resultadoDoLote(etapa, lote, idLote) {
    let ate = Date.now() + LIMITE_CONSULTA_MS
    while (!parar.current && Date.now() < ate) {
      await espera(INTERVALO_CONSULTA_MS)
      try {
        const { res, parado } = await chamar(etapa, lote, { municipioId, sistemaId, path: `${etapa.path}/${encodeURIComponent(idLote)}`, metodo: 'GET', tipo: 'individual' })
        ate += parado
        if (res.statusCode === 429) continue
        const r = interpretarStatusLote(res.data)
        if (r.status !== 'fila') return r
      } catch { /* rede instável: tenta de novo até o limite */ }
    }
    return null
  }

  // Modo lote a lote (etapas 3 + 4 juntas): a Betha processa um PUT de inscrição por vez e descarta os que chegam no meio.
  // Para cada lote: PUT → DELETE dos mesmos imóveis a cada 15 s até passar → próximo lote.
  async function loteALote() {
    const insc = plano.find(e => e.chave === 'inscricao')
    // DELETE com a chave da etapa 3: avisos de 429 e espera aparecem no lote do PUT, que é o que a tela acompanha
    const imv = { ...plano.find(e => e.chave === 'imoveis'), chave: 'inscricao' }
    let porId = { ...(execucao.imoveis?.porId || {}) }
    parar.current = false
    atualizar('inscricao', x => ({ ...x, ativo: true, fim: false, pulada: false, loteALote: true }))
    const marcar = (indice, status, mensagem) => atualizar('inscricao', x => ({ ...x, lotes: { ...x.lotes, [indice]: { status, mensagem } } }))
    const hora = ms => new Date(Date.now() + ms).toLocaleTimeString('pt-BR')

    for (const par of parearLotes(plano)) {
      if (parar.current) break
      let faltam = faltamNoLote(par.ids, porId)
      if (!faltam.length) { marcar(par.indice, 'ok', 'Já excluídos'); continue }
      const lote = { indice: par.indice }
      const inicio = Date.now()
      let puts = 0
      let ultimoPut = 0
      let tentativas = 0
      while (faltam.length && !parar.current) {
        if (!puts || Date.now() - ultimoPut >= REENVIAR_PUT_MS) {
          if (puts >= MAX_PUTS_POR_LOTE) break
          const corpo = faltam.map(id => ({ idImovel: id }))
          if (!corpo.length) break // nunca PUT vazio (reprocessaria a entidade toda)
          marcar(par.indice, 'enviando', `PUT ${puts + 1}ª vez…`)
          const { res } = await chamar(insc, lote, { municipioId, sistemaId, path: insc.path, metodo: 'PUT', body: corpo, tipo: 'lote' })
          if (res.statusCode < 200 || res.statusCode >= 300) { marcar(par.indice, 'erro', `PUT respondeu HTTP ${res.statusCode}`); break }
          puts++
          ultimoPut = Date.now()
        }
        tentativas++
        marcar(par.indice, 'pausa', `PUT ${puts}x · tenta excluir às ${hora(ESPERA_DELETE_MS)} (tentativa ${tentativas})`)
        const ate = Date.now() + ESPERA_DELETE_MS
        while (Date.now() < ate && !parar.current) await espera(1000)
        if (parar.current) break

        const corpoDel = par.corpoDelete.filter(b => faltam.includes(b.imoveis.idGerado.id))
        const { res } = await chamar(imv, lote, { municipioId, sistemaId, path: imv.path, metodo: 'DELETE', body: corpoDel, tipo: 'lote' })
        let r = interpretarEnvio(res)
        if (r.status === 'fila') r = await resultadoDoLote(imv, lote, r.idLote)
        if (!r) continue // DELETE ainda na fila: tenta de novo na próxima volta
        porId = aplicarRetorno(porId, r, faltam)
        const resultado = r
        const tentados = faltam
        atualizar('imoveis', x => ({ ...x, porId: aplicarRetorno(x.porId, resultado, tentados) }))
        faltam = faltamNoLote(par.ids, porId)
      }
      const s = Math.round((Date.now() - inicio) / 1000)
      if (!faltam.length) marcar(par.indice, 'ok', `Excluídos em ${s}s · ${puts} PUT(s), ${tentativas} tentativa(s) de DELETE`)
      else if (!parar.current) marcar(par.indice, 'parcial', `${faltam.length} não liberaram após ${puts} PUT(s) em ${s}s — ficam para a próxima rodada`)
    }
    atualizar('inscricao', x => ({ ...x, ativo: false, fim: !parar.current }))
  }

  // Reenvia só os ids com erro, em lotes novos do mesmo formato
  function reenviarErros(etapa) {
    const ex = execucao[etapa.chave]
    const falhos = Object.entries(ex?.porId || {}).filter(([, s]) => !s.ok).map(([id]) => Number(id))
    const set = new Set(falhos)
    const lotes = etapa.lotes
      .map(l => ({ ...l, ids: l.ids.filter(id => set.has(id)), body: l.body.filter((_, k) => set.has(l.ids[k])) }))
      .filter(l => l.body.length)
    return enviarEtapa(etapa, lotes)
  }

  async function consultarPendentes(etapa) {
    const ex = execucao[etapa.chave]
    const pend = etapa.lotes.filter(l => ex?.lotes[l.indice]?.status === 'fila' && ex.lotes[l.indice].idLote)
    parar.current = false
    for (const l of pend) { // um de cada vez: em paralelo estoura o limite da Betha
      if (parar.current) break
      await consultar(etapa, l, ex.lotes[l.indice].idLote)
    }
  }

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold">3. Plano e envio</h3>
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-borda p-4">
        <div className="w-72"><span className="rotulo">Município</span><CaixaBusca opcoes={municipios.map(m => ({ valor: m.id, rotulo: m.nome }))} valor={municipioId} onEscolher={setMunicipioId} placeholder="Município" /></div>
        <div className="w-56"><span className="rotulo">Sistema</span><CaixaBusca opcoes={sistemas.map(s => ({ valor: s.id, rotulo: s.nome }))} valor={sistemaId} onEscolher={setSistemaId} placeholder="Sistema" /></div>
        {municipioId && sistemaId && !vinculo && <p className="text-xs text-perigo">Este município não tem token para este sistema (Central de Tokens).</p>}
        {pronto && <p className="text-xs text-suave">Envio pelo token de <span className="font-medium text-texto">{municipio?.nome}</span>. Cada etapa só libera quando a anterior terminar.</p>}
        <div className="flex w-full flex-wrap items-end gap-3 border-t border-borda pt-3">
          <label className="w-40"><span className="rotulo">PUT: itens por lote</span>
            <input type="number" min={1} max={50} className="campo" value={lotePut} disabled={!!execucao.inscricao}
              onChange={e => setLotePut(Math.min(50, Math.max(1, Number(e.target.value) || 1)))} /></label>
          <label className="w-44"><span className="rotulo">PUT: intervalo (segundos)</span>
            <input type="number" min={0} max={600} className="campo" value={intervaloPut} disabled={!!execucao.inscricao && execucao.inscricao.ativo}
              onChange={e => setIntervaloPut(Math.min(600, Math.max(0, Number(e.target.value) || 0)))} /></label>
          <p className="min-w-0 flex-1 text-xs text-suave">
            {(() => { const n = plano.find(e => e.chave === 'inscricao')?.lotes.length || 0; const s = Math.max(0, n - 1) * intervaloPut; return n ? `${num(n)} lote(s) de PUT · uns ${Math.ceil(s / 60)} min de envio. ` : '' })()}
            A fila de reprocessamento da Betha é lenta: PUTs muito seguidos deixam a maioria para trás e o DELETE dá "em uso".
          </p>
          {(() => {
            const i = plano.findIndex(e => e.chave === 'inscricao')
            const insc = plano[i]
            if (!insc?.lotes.length) return null
            const ativo = execucao.inscricao?.ativo
            return (
              <button type="button" className="botao-primario !px-3 !py-1.5 text-xs" disabled={!pronto || !liberada(i) || ativo}
                onClick={loteALote} title="Para cada lote: PUT → tenta o DELETE dos mesmos imóveis a cada 15 s até passar → próximo lote">
                {ativo && execucao.inscricao?.loteALote ? 'Rodando lote a lote…' : `PUT + DELETE lote a lote (${num(insc.lotes.length)} lotes)`}
              </button>
            )
          })()}
        </div>
      </div>

      <ol className="space-y-3">
        {plano.map((etapa, i) => (
          <Etapa key={etapa.chave} numero={i + 1} etapa={etapa} ex={execucao[etapa.chave]} liberada={liberada(i)} pronto={pronto}
            onEnviar={() => setConfirmar(etapa)} onParar={() => { parar.current = true }}
            onReenviar={() => reenviarErros(etapa)} onConsultar={() => consultarPendentes(etapa)}
            onPular={() => atualizar(etapa.chave, x => ({ ...x, fim: true, pulada: true }))}
            onTirarExcluidos={etapa.chave === 'imoveis' ? () => onTirarExcluidos(execucao.imoveis?.porId || {}) : null} />
        ))}
      </ol>

      <Confirmar
        aberto={!!confirmar}
        titulo={confirmar ? `${confirmar.titulo}?` : ''}
        mensagem={confirmar ? `${confirmar.metodo} ${confirmar.path} — ${num(confirmar.itens.length)} item(ns) em ${confirmar.lotes.length} lote(s), no município ${municipio?.nome}. Exclusão não tem volta.` : ''}
        rotulo="Enviar etapa"
        onConfirmar={async () => { const e = confirmar; setConfirmar(null); enviarEtapa(e) }}
        onFechar={() => setConfirmar(null)}
      />
    </section>
  )
}

const COR_STATUS = {
  ok: 'bg-emerald-500', enviado: 'bg-emerald-500', parcial: 'bg-amber-500', erro: 'bg-red-500',
  fila: 'bg-sky-500 animate-pulse', enviando: 'bg-acento animate-pulse', pausa: 'bg-amber-400 animate-pulse',
}

// Pular libera a próxima etapa sem enviar nada. Seguro: se a etapa era necessária, o DELETE seguinte só responde "em uso".
function Etapa({ numero, etapa, ex, liberada, pronto, onEnviar, onParar, onReenviar, onConsultar, onPular, onTirarExcluidos }) {
  const [verLotes, setVerLotes] = useState(false)
  const vazia = !etapa.lotes.length
  const status = Object.values(ex?.porId || {})
  const okN = status.filter(s => s.ok).length
  const erros = Object.entries(ex?.porId || {}).filter(([, s]) => !s.ok)
  const pendentes = etapa.lotes.filter(l => ex?.lotes[l.indice]?.status === 'fila').length
  const feito = vazia || ex?.fim
  const comErro = erros.length > 0 || pendentes > 0 // terminou, mas não 100%: âmbar, nunca o ✓ verde
  const pulada = ex?.pulada && !ex?.ativo
  const enviou = ex && Object.keys(ex.lotes || {}).length > 0

  return (
    <li className={`rounded-xl border ${pulada ? 'border-borda border-dashed' : feito && !vazia ? (comErro ? 'border-amber-500/50' : 'border-emerald-500/40') : liberada && !vazia ? 'border-acento/40' : 'border-borda'} ${vazia || pulada ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${pulada ? 'border border-borda text-suave' : feito && !vazia ? (comErro ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white') : 'border border-borda text-suave'}`}>
          {pulada ? '–' : feito && !vazia ? (comErro ? '!' : <Icone nome="check" className="h-3.5 w-3.5" />) : numero}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{etapa.titulo}</span>
            <MetodoBadge metodo={etapa.metodo} />
            <span className="font-mono text-[11px] text-suave">{etapa.path}</span>
          </div>
          <div className="text-xs text-suave">
            {vazia ? 'Nada a fazer — etapa pulada.' : `${num(etapa.itens.length)} item(ns) em ${etapa.lotes.length} lote(s) de até 50`}
            {etapa.nota && !vazia ? ` · ${etapa.nota}` : ''}
            {pulada ? ' · Pulada — nada enviado nesta rodada.' : ''}
          </div>
        </div>
        {!vazia && (
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className="botao-secundario !px-2.5 !py-1 text-xs" onClick={() => setVerLotes(v => !v)}>{verLotes ? 'Ocultar lotes' : 'Ver lotes'}</button>
            {ex?.ativo
              ? <button type="button" className="botao-secundario !px-2.5 !py-1 text-xs" onClick={onParar}>Parar</button>
              : <>
                  {liberada && !ex?.fim && <button type="button" className="botao-secundario !px-2.5 !py-1 text-xs" onClick={onPular} title="Libera a próxima etapa sem enviar esta">Pular</button>}
                  <button type="button" className="botao-primario !px-2.5 !py-1 text-xs" disabled={!pronto || !liberada || (ex?.fim && !pulada)} onClick={onEnviar}
                    title={!liberada ? 'Termine ou pule a etapa anterior' : !pronto ? 'Escolha município e sistema com token' : ''}>{ex?.fim && !pulada ? 'Enviada' : 'Enviar etapa'}</button>
                </>}
          </div>
        )}
      </div>

      {enviou && !vazia && (
        <div className="space-y-2 border-t border-borda px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {etapa.lotes.map(l => {
              const s = ex.lotes[l.indice]
              return <span key={l.indice} title={`Lote ${l.indice}: ${s?.mensagem || 'aguardando'}`} className={`h-2.5 w-2.5 rounded-sm ${s ? COR_STATUS[s.status] || 'bg-borda' : 'bg-borda'}`} />
            })}
          </div>
          <p className="text-xs text-suave">
            {num(okN)} ok · {num(erros.length)} com erro{pendentes ? ` · ${pendentes} lote(s) ainda na fila` : ''}
          </p>
          {etapa.metodo === 'PUT' && ex.fim && (
            <div className="rounded-lg border-2 border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
              <b>Antes de excluir os imóveis:</b> espere alguns minutos e rode o Levantamento de novo. A movimentação de inscrição deve vir vazia. Imóvel que ainda tiver a linha vai dar "em uso" no DELETE.
            </div>
          )}
          {erros.length > 0 && (
            <div className="rounded-lg border-2 border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-800 dark:text-red-300">
              <div className="font-semibold">Com erro · {erros.length}</div>
              <ul className="mt-1 max-h-40 overflow-y-auto">{erros.slice(0, 200).map(([id, s]) => <li key={id}>id {id} — {s.mensagem}</li>)}</ul>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {pendentes > 0 && !ex.ativo && <button type="button" className="botao-secundario !px-2.5 !py-1 text-xs" onClick={onConsultar}>Consultar pendentes ({pendentes})</button>}
            {erros.length > 0 && !ex.ativo && <button type="button" className="botao-secundario !px-2.5 !py-1 text-xs" onClick={onReenviar}>Reenviar os {erros.length} com erro</button>}
            {onTirarExcluidos && okN > 0 && !ex.ativo && (
              <button type="button" className="botao-primario !px-2.5 !py-1 text-xs" onClick={onTirarExcluidos}
                title="Tira do plano os imóveis já excluídos e recomeça as etapas só com os que faltam — sem rodar o Levantamento de novo">
                Tirar os {num(okN)} já excluídos e nova rodada
              </button>
            )}
          </div>
        </div>
      )}

      {verLotes && !vazia && (
        <ul className="max-h-72 space-y-1 overflow-y-auto border-t border-borda px-4 py-3">
          {etapa.lotes.map(l => <LinhaLote key={l.indice} lote={l} total={etapa.lotes.length} status={ex?.lotes[l.indice]} />)}
        </ul>
      )}
    </li>
  )
}

function LinhaLote({ lote, total, status }) {
  const [copiado, setCopiado] = useState(false)
  async function copiar() {
    await navigator.clipboard.writeText(JSON.stringify(lote.body, null, 1))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1200)
  }
  return (
    <li className="flex items-center gap-2 text-xs">
      <span className={`h-2 w-2 shrink-0 rounded-full ${status ? COR_STATUS[status.status] || 'bg-borda' : 'bg-borda'}`} />
      <span className="w-24 shrink-0 tabular-nums">Lote {lote.indice}/{total}</span>
      <span className="w-20 shrink-0 text-suave">{lote.ids.length} itens</span>
      <span className="min-w-0 flex-1 truncate text-suave">{status?.mensagem || ''}</span>
      <button type="button" className="text-acento hover:underline" onClick={copiar}>{copiado ? 'Copiado' : 'Copiar body'}</button>
    </li>
  )
}
