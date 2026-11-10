// Consultas sobre o grafo já carregado: busca por termo e vizinhança.
import { semAcento, slug } from './biblioteca.mjs'

const letras = s => semAcento(s).replace(/[^A-Za-z0-9]/g, '').toLowerCase()
const texto = s => semAcento(s).toLowerCase()
const local = id => id.slice(id.indexOf(':') + 1)

// No empate, peça concreta antes do hub (área).
export const ORDEM_TIPO = { template: 0, funcao: 1, 'tipo-formula': 2, conhecimento: 3, fonte: 4, endpoint: 5, area: 6 }
// Na vizinhança, "pertence" é a ligação menos informativa: vai por último.
const pesoAresta = t => (t === 'pertence' ? 1 : 0)

export function indice(grafo) {
  if (grafo._indice) return grafo._indice
  const porId = new Map(grafo.nos.map(n => [n.id, n]))
  const saida = new Map(), entrada = new Map()
  for (const a of grafo.arestas) {
    if (!saida.has(a.de)) saida.set(a.de, [])
    if (!entrada.has(a.para)) entrada.set(a.para, [])
    saida.get(a.de).push(a)
    entrada.get(a.para).push(a)
  }
  Object.defineProperty(grafo, '_indice', { value: { porId, saida, entrada }, enumerable: false })
  return grafo._indice
}

const areaId = a => (a.startsWith('area:') ? a : `area:${a}`)
const daArea = (grafo, id, area) => (indice(grafo).saida.get(id) || []).some(a => a.tipo === 'pertence' && a.para === areaId(area))

/** Grafo curado + índice do corpus num só objeto de consulta (o corpus só acrescenta nós e arestas). */
export function juntar(grafo, corpus) {
  if (!corpus) return grafo
  const ids = new Set(grafo.nos.map(n => n.id))
  return {
    versao: grafo.versao, hash: grafo.hash, corpusHash: corpus.hash,
    nos: [...grafo.nos, ...corpus.nos.filter(n => !ids.has(n.id))],
    arestas: [...grafo.arestas, ...corpus.arestas],
    naoResolvidas: grafo.naoResolvidas || [],
  }
}

/** Nós que casam com o termo: nome exato (4) > começa com (2) > todas as palavras contidas (1).
 *  Peças do corpus só entram com { corpus: true } ou { tipo: 'peca' } — seriam milhares. */
export function buscar(grafo, termo, { tipo, area, limite = 20, corpus = false } = {}) {
  const alvo = letras(termo)
  const palavras = texto(termo).split(/\s+/).filter(Boolean)
  if (!alvo) return []
  const res = []
  for (const n of grafo.nos) {
    if (tipo && n.tipo !== tipo) continue
    if (n.tipo === 'peca' && !corpus && tipo !== 'peca') continue
    if (area && !daArea(grafo, n.id, area)) continue
    const lId = letras(local(n.id)), lRot = letras(n.rotulo || '')
    let score = 0
    if (lId === alvo || lRot === alvo) score = 4
    else if (lId.startsWith(alvo) || lRot.startsWith(alvo)) score = 2
    else {
      const tudo = `${texto(local(n.id)).replace(/[_.\-/]/g, ' ')} ${texto(n.rotulo || '')} ${lId} ${lRot}`
      if (palavras.every(p => tudo.includes(letras(p)) || tudo.includes(p))) score = 1
    }
    if (score) res.push({ ...n, score })
  }
  res.sort((a, b) => b.score - a.score
    || (ORDEM_TIPO[a.tipo] ?? 9) - (ORDEM_TIPO[b.tipo] ?? 9)
    || (b.usos || 0) - (a.usos || 0)
    || (a.id < b.id ? -1 : 1))
  return res.slice(0, limite)
}

const semelhanca = via => Number(/semelhança (\d+,\d+)/.exec(via || '')?.[1]?.replace(',', '.') || 0)

/**
 * Peças de produção ligadas ao nó (que usam a fonte, são do tipo, derivam do template, são do município…).
 * Uma por família (código idêntico aparece uma vez), alternando municípios; variante mais parecida primeiro.
 */
export function exemplos(grafo, id, { municipio, limite = 5, subtipo } = {}) {
  const { porId, entrada } = indice(grafo)
  const alvoMun = municipio ? slug(municipio) : null
  const pecas = []
  const vistos = new Set()
  for (const a of entrada.get(id) || []) {
    const n = porId.get(a.de)
    if (!n || n.tipo !== 'peca' || vistos.has(n.id)) continue
    if (subtipo && n.subtipo !== subtipo) continue
    if (alvoMun && !slug(n.municipio || '').includes(alvoMun)) continue
    vistos.add(n.id)
    pecas.push({ ...n, via: a.via, peso: semelhanca(a.via) })
  }
  pecas.sort((x, y) => y.peso - x.peso || cmpTexto(y.ano || '', x.ano || '') || cmpTexto(x.municipio || '', y.municipio || '') || cmpTexto(x.id, y.id))
  const porFamilia = new Map()
  for (const p of pecas) if (!porFamilia.has(p.familia)) porFamilia.set(p.familia, p)
  const restantes = [...porFamilia.values()]
  const itens = [], munis = new Set()
  while (itens.length < limite && restantes.length) {
    const i = restantes.findIndex(p => !munis.has(p.municipio))
    const p = restantes.splice(i < 0 ? 0 : i, 1)[0]
    itens.push(p)
    munis.add(p.municipio)
  }
  return { id, total: pecas.length, familias: porFamilia.size, municipios: new Set(pecas.map(p => p.municipio)).size, itens }
}
const cmpTexto = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

/** Vizinhos até a profundidade pedida (saída e entrada). Não atravessa áreas: elas ligam tudo a tudo. */
export function vizinhos(grafo, id, { aresta, profundidade = 1, area } = {}) {
  const { porId, saida, entrada } = indice(grafo)
  const vistos = new Set([id])
  const res = []
  let fronteira = [id]
  for (let nivel = 1; nivel <= profundidade && fronteira.length; nivel++) {
    const novos = []
    for (const atual of fronteira) {
      if (atual !== id && porId.get(atual)?.tipo === 'area') continue
      const ligacoes = [
        ...(saida.get(atual) || []).map(a => ({ a, outro: a.para, direcao: 'saida' })),
        ...(entrada.get(atual) || []).map(a => ({ a, outro: a.de, direcao: 'entrada' })),
      ]
      for (const { a, outro, direcao } of ligacoes) {
        if (aresta && a.tipo !== aresta) continue
        if (vistos.has(outro)) continue
        vistos.add(outro)
        const n = porId.get(outro) || { id: outro, tipo: '?', rotulo: '(nó inexistente)' }
        const item = { id: outro, tipo: n.tipo, rotulo: n.rotulo, aresta: a.tipo, direcao, nivel }
        if (a.via) item.via = a.via
        novos.push(item)
      }
    }
    novos.sort((x, y) => (x.direcao === y.direcao ? 0 : x.direcao === 'saida' ? -1 : 1)
      || pesoAresta(x.aresta) - pesoAresta(y.aresta)
      || (x.aresta < y.aresta ? -1 : x.aresta > y.aresta ? 1 : 0)
      || (x.id < y.id ? -1 : 1))
    res.push(...novos)
    fronteira = novos.map(v => v.id)
  }
  return area ? res.filter(v => v.tipo !== 'area' && daArea(grafo, v.id, area)) : res
}
