// Saída em texto curto: o objetivo do grafo é economizar tokens de quem consulta.
import { indice, vizinhos } from './consulta.mjs'

const LIMITE = 12

const statusTemplate = n =>
  n.status === 'validado' ? (n.validadoEm ? `validado em ${n.validadoEm}` : 'validado, sem data')
    : n.status === 'nao-validado' ? 'NÃO validado no Studio'
      : 'sem registro de validação'

function detalhes(n) {
  const partes = []
  switch (n.tipo) {
    case 'template':
      partes.push(statusTemplate(n))
      partes.push(n.arquivo)
      if (n.outros) partes.push(...n.outros)
      if (n.readme) partes.push(`README: ${n.readme}`)
      break
    case 'fonte':
      if (n.status === 'fora-do-catalogo') partes.push('fora do catálogo — conferir o nome no editor')
      else if (n.status === 'so-producao') partes.push(`vista em produção (${n.usos} usos), fora do catálogo — filtros e campos não documentados`)
      else {
        partes.push(`fonte BFC · ${n.operacoes?.length || 0} operações · usos em produção: ${n.usos || 0}`)
        if (!n.confirmado) partes.push('nome não confirmado no editor')
      }
      break
    case 'endpoint':
      partes.push(`métodos: ${(n.metodos || []).join(', ')}`)
      if (n.modulo) partes.push(`módulo: ${n.modulo}`)
      break
    default:
      if (n.arquivo) partes.push(n.arquivo)
      if (n.status === 'bruto') partes.push('material bruto, ainda não digerido')
  }
  return partes.length ? `  ${partes.join(' · ')}` : null
}

const lista = (ids, todos) => (todos || ids.length <= LIMITE ? ids.join(', ') : `${ids.slice(0, LIMITE).join(', ')} +${ids.length - LIMITE}`)

export function formatarNo(grafo, id, { todos = false } = {}) {
  const n = indice(grafo).porId.get(id)
  if (!n) return `${id} não existe no grafo. Tente: grafo.mjs busca <termo>`
  const linhas = [`${n.id} — ${n.rotulo}`]
  const det = detalhes(n)
  if (det) linhas.push(det)
  for (const nota of n.notas || []) linhas.push(`  ${nota.startsWith('⚠') ? '' : '⚠ '}${nota}`)

  // grupos por direção + tipo de aresta; separa por tipo do vizinho só quando o grupo mistura tipos
  const grupos = new Map()
  for (const v of vizinhos(grafo, id)) {
    const k = `${v.direcao}|${v.aresta}`
    if (!grupos.has(k)) grupos.set(k, [])
    grupos.get(k).push(v)
  }
  for (const [k, vs] of grupos) {
    const [direcao, aresta] = k.split('|')
    const tipos = [...new Set(vs.map(v => v.tipo))]
    const sub = tipos.length > 1 || tipos[0] === 'peca' ? tipos.sort().map(t => [t, vs.filter(v => v.tipo === t)]) : [[null, vs]]
    for (const [tipo, itens] of sub) {
      if (tipo === 'peca') {
        // peças do corpus: contagem + 3 amostras; a lista completa sai em "exemplos"
        const porId = indice(grafo).porId
        const pecas = itens.map(v => porId.get(v.id)).filter(Boolean)
        const munis = new Set(pecas.map(p => p.municipio)).size
        const amostra = pecas.slice(0, 3).map(p => `${p.municipio}: ${p.rotulo}`).join('; ')
        const rot = `${aresta} · peca (${pecas.length} em ${munis} município${munis === 1 ? '' : 's'})`
        linhas.push(`  ${direcao === 'saida' ? '' : '← '}${rot}: ${amostra} — ver: grafo.mjs exemplos ${id}`)
        continue
      }
      const rot = `${aresta}${tipo ? ` · ${tipo}` : ''}${itens.length > 1 ? ` (${itens.length})` : ''}`
      const ids = lista(itens.map(v => (v.via ? `${v.id} [${v.via}]` : v.id)), todos)
      linhas.push(direcao === 'saida' ? `  ${rot} → ${ids}` : `  ← ${rot}: ${ids}`)
    }
  }
  return linhas.join('\n')
}

function etiqueta(n) {
  if (n.tipo === 'template') {
    if (n.status === 'validado') return n.validadoEm ? ` [validado ${n.validadoEm}]` : ' [validado, sem data]'
    return n.status === 'nao-validado' ? ' [NÃO validado no Studio]' : ' [sem registro]'
  }
  if (n.status === 'fora-do-catalogo') return ' [fora do catálogo]'
  if (n.status === 'so-producao') return ' [só produção]'
  if (n.status === 'bruto') return ' [bruto]'
  return ''
}

export function formatarBusca(resultados) {
  if (!resultados.length) return 'Nada encontrado.'
  return resultados.map(n => `${n.id} — ${n.rotulo}${etiqueta(n)}`).join('\n')
}

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`

export function formatarExemplos(ex) {
  if (!ex.total) return `Nenhuma peça de produção ligada a ${ex.id}.`
  const cab = `${plural(ex.total, 'peça', 'peças')} (${plural(ex.familias, 'código diferente', 'códigos diferentes')}, ${plural(ex.municipios, 'município', 'municípios')})` +
    (ex.itens.length < ex.familias ? `; mostrando ${ex.itens.length} (--limite n para mais)` : '')
  const linhas = [cab]
  for (const p of ex.itens) {
    const tags = [p.subtipo, p.tipoFormula, p.ano, p.chaveNatureza, p.cadastro && p.evento ? `${p.cadastro}/${p.evento}` : null, p.via].filter(Boolean).join(' · ')
    linhas.push(`- ${p.municipio} · ${tags} — ${p.rotulo}`)
    linhas.push(`    ${p.arquivo}${p.qtdMunicipiosFamilia > 1 ? ` (mesmo código em ${p.qtdMunicipiosFamilia} municípios)` : ''}`)
  }
  return linhas.join('\n')
}

export function formatarVizinhos(itens) {
  if (!itens.length) return 'Sem vizinhos.'
  return itens.map(v => `${'  '.repeat(v.nivel - 1)}${v.direcao === 'saida' ? '→' : '←'} ${v.aresta} ${v.id}${v.via ? ` [${v.via}]` : ''} — ${v.rotulo}`).join('\n')
}

const contagem = itens => {
  const c = {}
  for (const t of itens) c[t] = (c[t] || 0) + 1
  return Object.keys(c).sort().map(k => `${c[k]} ${k}`).join(', ')
}

export function formatarResumo(grafo) {
  const linhas = [
    `${grafo.nos.length} nós: ${contagem(grafo.nos.map(n => n.tipo))}`,
    `${grafo.arestas.length} arestas: ${contagem(grafo.arestas.map(a => a.tipo))}`,
  ]
  const curadas = grafo.arestas.filter(a => a.origem === 'curada').length
  if (curadas) linhas.push(`${curadas} arestas curadas`)
  if (grafo.naoResolvidas?.length) linhas.push(`${grafo.naoResolvidas.length} citações sem nó (ver: grafo.mjs checar)`)
  return linhas.join('\n')
}
