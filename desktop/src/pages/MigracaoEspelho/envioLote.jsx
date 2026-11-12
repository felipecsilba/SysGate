import { useEffect, useRef, useState } from 'react'
import CaixaBusca from '../../components/CaixaBusca'
import { municipiosApi, proxyApi, sistemasApi } from '../../lib/api'
import { aplicarRetornoLote } from '../../lib/espelho'
import { interpretarEnvio, interpretarStatusLote } from '../../lib/lote'
import { enviarEmRajada } from '../../lib/rajada'

// Envio pela Service Layer (token de migração da Central de Tokens), compartilhado pelo Desfazer e pelos Ajustes rápidos.
const espera = ms => new Promise(r => setTimeout(r, ms))
// Limite da Betha: ~140 chamadas por janela (medido na limpeza de logradouros, 2026-10-30), depois 429 por uns 3–4 min.
// Rajada em paralelo até o 429; aí TODOS param e tentam de novo a cada 15 s — a escada 30 s/1/2/5 min passava do ponto.
const PARALELO = 4
const ESPERA_429_MS = 15000

// padrao: sistema já escolhido ao abrir (Tributos; Procuradoria na limpeza da procuradoria)
export function useMunicipioToken(padrao = /tribut/i) {
  const [municipios, setMunicipios] = useState([])
  const [sistemas, setSistemas] = useState([])
  const [municipioId, setMunicipioId] = useState(null)
  const [sistemaId, setSistemaId] = useState(null)
  const [tokens, setTokens] = useState([])

  useEffect(() => {
    municipiosApi.listar().then(setMunicipios).catch(() => {})
    sistemasApi.listar().then(l => { setSistemas(l); const t = l.find(s => padrao.test(s.nome)); if (t) setSistemaId(t.id) }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (municipioId) municipiosApi.tokens(municipioId).then(setTokens).catch(() => setTokens([])) }, [municipioId])

  const vinculo = tokens.find(t => t.sistemaId === sistemaId)
  return {
    municipios, sistemas, municipioId, setMunicipioId, sistemaId, setSistemaId, vinculo,
    municipio: municipios.find(m => m.id === municipioId),
    pronto: !!(municipioId && sistemaId && vinculo),
  }
}

export function SeletorToken({ sel }) {
  return (
    <>
      <div className="w-64"><span className="rotulo">Município</span><CaixaBusca opcoes={sel.municipios.map(m => ({ valor: m.id, rotulo: m.nome }))} valor={sel.municipioId} onEscolher={sel.setMunicipioId} placeholder="Município" /></div>
      <div className="w-52"><span className="rotulo">Sistema</span><CaixaBusca opcoes={sel.sistemas.map(s => ({ valor: s.id, rotulo: s.nome }))} valor={sel.sistemaId} onEscolher={sel.setSistemaId} placeholder="Sistema" /></div>
      {sel.municipioId && sel.sistemaId && !sel.vinculo && <p className="w-full text-xs text-perigo">Este município não tem token para este sistema (Central de Tokens).</p>}
    </>
  )
}

// Lotes { ids, body } → envio, consulta do idLote e status por id ({ ok, mensagem, fila })
export function useEnvioLote(sel, { path, metodo }) {
  const [porId, setPorId] = useState({})
  const [ativo, setAtivo] = useState(false)
  const [pendentes, setPendentes] = useState([]) // lotes que saíram do limite de consulta ainda na fila: { lote, idLote }
  const [pausa, setPausa] = useState(null) // hora em que tenta de novo depois do 429 (null = sem pausa)
  const pausaAte = useRef(0)
  const parar = useRef(false)
  const marcar = (ids, s) => setPorId(p => Object.fromEntries([...Object.entries(p), ...ids.map(id => [id, s])]))
  const base = () => ({ municipioId: sel.municipioId, sistemaId: sel.sistemaId })

  // No 429 a Betha está bloqueando: a pausa vale para todas as chamadas em paralelo, e a MESMA chamada é repetida
  // (nunca pula para o próximo lote). Tenta de novo a cada 15 s até liberar.
  async function chamar(lote, params) {
    for (;;) {
      while (Date.now() < pausaAte.current && !parar.current) await espera(500)
      const res = await proxyApi.executar(params)
      if (res.statusCode !== 429 || parar.current) {
        if (pausaAte.current && Date.now() >= pausaAte.current) { pausaAte.current = 0; setPausa(null) }
        return res
      }
      pausaAte.current = Math.max(pausaAte.current, Date.now() + ESPERA_429_MS)
      setPausa(pausaAte.current)
    }
  }

  // Envio de um lote: { status: 'fila', idLote } ou o retorno final (recusado / erro de rede)
  async function enviarLote(lote) {
    marcar(lote.ids, { fila: true, mensagem: 'Enviando…' })
    try {
      return interpretarEnvio(await chamar(lote, { ...base(), path, metodo, body: lote.body, tipo: 'lote' }))
    } catch (err) {
      return { status: 'erro', mensagem: err.response?.data?.error || err.message }
    }
  }

  // GET do idLote: { status: 'fila' } enquanto NAO_PROCESSADO (ou 429/rede — tenta na próxima rodada)
  async function consultarLote(lote, idLote) {
    try {
      const res = await chamar(lote, { ...base(), path: `${path}/${encodeURIComponent(idLote)}`, metodo: 'GET', tipo: 'individual' })
      return res.statusCode === 429 ? { status: 'fila' } : interpretarStatusLote(res.data)
    } catch {
      return { status: 'fila' }
    }
  }

  function aoMudar(lote, r) {
    if (r.status === 'fila') marcar(lote.ids, { fila: true, mensagem: r.idLote ? `Lote ${r.idLote} na fila` : 'Na fila da Betha' })
    else setPorId(p => aplicarRetornoLote(p, r, lote))
  }

  // Rajada (lib/rajada.js): manda todos os lotes e depois consulta os idLotes em rodadas
  async function rodar(lotes, jaNaFila = []) {
    parar.current = false
    setAtivo(true)
    const opcoes = { consultarLote, aoMudar, esperar: espera, parar: () => parar.current }
    // Pendentes de antes entram direto na consulta: enviar de novo duplicaria a operação
    const reconsulta = jaNaFila.map(p => ({ ...p.lote, _idLote: p.idLote }))
    const r = await enviarEmRajada([...reconsulta, ...lotes.filter(l => l.body.length)], {
      ...opcoes,
      paralelo: PARALELO,
      intervaloMs: 250, // entre consultas da rodada
      enviarLote: async lote => (lote._idLote ? { status: 'fila', idLote: lote._idLote } : enviarLote(lote)),
    })
    for (const p of r.pendentes) marcar(p.lote.ids, { fila: true, mensagem: `Lote ${p.idLote} ainda na fila` })
    setPendentes(r.pendentes)
    pausaAte.current = 0
    setPausa(null)
    setAtivo(false)
  }

  const enviar = lotes => rodar(lotes)
  function consultarPendentes() {
    const lista = pendentes
    setPendentes([])
    return rodar([], lista)
  }

  const status = Object.values(porId)
  const okN = status.filter(s => s.ok).length
  const erroN = status.filter(s => !s.ok && !s.fila).length
  return {
    porId, ativo, pendentes, pausa, enviar, consultarPendentes,
    parar: () => { parar.current = true },
    limpar: () => { setPorId({}); setPendentes([]) },
    resumo: { total: status.length, okN, erroN, filaN: status.length - okN - erroN },
  }
}
