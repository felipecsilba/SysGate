// Biblioteca — filtros (o índice vem do Electron: electron/biblioteca.js)
import { normalizar } from './texto.js'

export const TIPOS = [
  { id: 'script', rotulo: 'Scripts' },
  { id: 'relatorio', rotulo: 'Relatórios' },
  { id: 'formula', rotulo: 'Fórmulas' },
]

export function contar(itens) {
  const c = { script: 0, formula: 0, relatorio: 0 }
  for (const i of itens) c[i.tipo] = (c[i.tipo] || 0) + 1
  return c
}

function agrupar(itens, tipo, campo) {
  const m = new Map()
  for (const i of itens) if (i.tipo === tipo && i[campo]) m.set(i[campo], (m.get(i[campo]) || 0) + 1)
  return [...m].map(([valor, qtd]) => ({ valor, qtd })).sort((a, b) => a.valor.localeCompare(b.valor, 'pt-BR'))
}

export const grupos = (itens, tipo) => agrupar(itens, tipo, 'grupo')
export const municipios = (itens, tipo) => agrupar(itens, tipo, 'municipio')

// Tipo de fórmula (Tipo Fórmula do Betha) → nome legível; agrupa por assunto na ordem alfabética
const TIPOS_FORMULA = {
  GERACAO_CREDITO_CONTRIBUICAO_MELHORIAS: 'Geração de crédito · Contribuição de Melhorias',
  GERACAO_CREDITO_ECONOMICOS: 'Geração de crédito · Econômicos (ISS)',
  GERACAO_CREDITO_IMOVEIS: 'Geração de crédito · Imóveis (IPTU)',
  GERACAO_CREDITO_NOTA_FISCAL_AVULSA: 'Geração de crédito · Nota Fiscal Avulsa',
  GERACAO_CREDITO_PARCELAMENTOS: 'Geração de crédito · Parcelamentos',
  GERACAO_CREDITO_RECEITAS_DIVERSAS: 'Geração de crédito · Receitas Diversas',
  CONVENIO_BANCARIO: 'Convênio bancário',
  FORMULA_ACRESCIMO_DEBITO: 'Acréscimo · Débitos',
  FORMULA_ACRESCIMO_DIVIDA_ATIVA: 'Acréscimo · Dívida ativa',
  DESCONTO_GUIA: 'Desconto de guia',
  ITBI_TRANSFERENCIA_CREDITOS: 'ITBI · Transferência de créditos',
  ITBI_VALOR_VENAL_CONSTRUCAO: 'ITBI · Valor venal da construção',
  ITBI_VALOR_VENAL_TERRITORIAL: 'ITBI · Valor venal territorial',
  ACRESCIMO_PARCELAMENTO: 'Parcelamento · Acréscimo',
  ACRESCIMO_PRE_FIXADA: 'Parcelamento · Acréscimo pré-fixado',
  FORMULA_ACRESCIMO_PARCELAMENTO: 'Parcelamento · Fórmula de acréscimo',
  DESCONTO_PARCELAMENTO_DIVIDAS: 'Parcelamento · Desconto em dívidas',
  DESCONTO_PARCELAMENTO_LANCAMENTOS_EXERCICIO: 'Parcelamento · Desconto em lançamentos do exercício',
  DESCONTO_PARCELAMENTO_PARCELAMENTOS_ANTERIORES: 'Parcelamento · Desconto em parcelamentos anteriores',
  DESCONTO_PARCELAMENTO_TODOS: 'Parcelamento · Desconto em todos',
}

export function rotuloTipoFormula(codigo) {
  if (!codigo) return 'Sem tipo'
  if (TIPOS_FORMULA[codigo]) return TIPOS_FORMULA[codigo]
  const t = codigo.toLowerCase().replace(/_/g, ' ')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

const ROTULO_CATEGORIA = { Criticas: 'Críticas', 'Fontes Dinamicas': 'Fontes dinâmicas' }
export const rotuloCategoria = g => ROTULO_CATEGORIA[g] || g

// Subdivisão da navegação: categoria (pasta) nos scripts, tipo de fórmula nas fórmulas, nenhuma nos relatórios
const subgrupoDe = i => (i.tipo === 'formula' ? i.codigo || null : i.tipo === 'script' ? i.grupo : null)

/** Seções da navegação da esquerda, contadas dentro do município escolhido. */
export function secoes(itens, municipio = null) {
  const base = municipio ? itens.filter(i => i.municipio === municipio) : itens
  return TIPOS.map(t => {
    const doTipo = base.filter(i => i.tipo === t.id)
    const m = new Map()
    if (t.id !== 'relatorio') for (const i of doTipo) { const k = subgrupoDe(i) ?? ''; m.set(k, (m.get(k) || 0) + 1) }
    const rotulo = v => (t.id === 'formula' ? rotuloTipoFormula(v || null) : rotuloCategoria(v))
    const subgrupos = [...m].map(([valor, qtd]) => ({ valor, qtd, rotulo: rotulo(valor) }))
      .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'))
    return { tipo: t.id, titulo: t.rotulo, total: doTipo.length, subgrupos }
  })
}

// Busca por palavras (todas precisam aparecer, em qualquer ordem) no nome, município, detalhe e grupo
export function filtrarItens(itens, { tipo, grupo, subgrupo, municipio, busca = '' } = {}) {
  const palavras = normalizar(busca).split(/\s+/).filter(Boolean)
  return itens.filter(i => {
    if (tipo && i.tipo !== tipo) return false
    if (grupo && i.grupo !== grupo) return false
    if (subgrupo !== undefined && subgrupo !== null && (subgrupoDe(i) ?? '') !== subgrupo) return false
    if (municipio && i.municipio !== municipio) return false
    if (!palavras.length) return true
    const alvo = normalizar(`${i.nome} ${i.municipio ?? ''} ${i.detalhe ?? ''} ${i.grupo ?? ''} ${i.tipo === 'formula' ? rotuloTipoFormula(i.codigo) : ''}`)
    return palavras.every(p => alvo.includes(p))
  })
}

// Como mostrar cada arquivo: código BFC com realce, layout jrxml como XML, metadados como texto
export function linguagem(nome) {
  if (/\.jrxml$/i.test(nome) || /\.xml$/i.test(nome)) return 'xml'
  if (/^(parametros|relatorio_info)\.txt$/i.test(nome)) return 'texto'
  return 'codigo'
}

export function linhaComTermo(texto, termo) {
  const t = normalizar(termo)
  if (!t) return null
  const i = String(texto).split(/\r?\n/).findIndex(l => normalizar(l).includes(t))
  return i < 0 ? null : i + 1
}

// ─── Versões por ano (fórmulas) ───────────────────────────────────────────────

// A mesma fórmula (município + tipo + nome) extraída em anos diferentes vira um item só.
// O item fica com o id da versão mais recente; `versoes` lista todas (mais recente primeiro).
export function agruparVersoes(itens) {
  const saida = []
  const porChave = new Map()
  for (const i of itens) {
    if (i.tipo !== 'formula') { saida.push(i); continue }
    const chave = [i.municipio, i.codigo, String(i.nome).trim()].join('|')
    if (!porChave.has(chave)) { const g = []; porChave.set(chave, g); saida.push(g) }
    porChave.get(chave).push(i)
  }
  return saida.map(g => {
    if (!Array.isArray(g)) return g
    const versoes = [...g].sort((a, b) => String(b.ano ?? '').localeCompare(String(a.ano ?? '')))
    const anos = [...new Set(versoes.map(v => v.ano).filter(Boolean))]
    const rotuloAnos = anos.length > 1 ? `${anos.at(-1)}–${anos[0]}` : anos[0] || null
    return { ...versoes[0], versoes: versoes.map(v => ({ id: v.id, ano: v.ano })), anos: rotuloAnos }
  })
}

// O cabeçalho da extração muda todo ano (ID, Ano, Usuário, data) — fica fora da comparação
export function semCabecalho(texto) {
  const linhas = String(texto).replace(/\r\n?/g, '\n').split('\n')
  let i = 0
  while (i < linhas.length && /^\/\/\s*[^:]{2,30}?\s*:/.test(linhas[i])) i++
  if (i === 0) return linhas.join('\n')
  while (i < linhas.length && !linhas[i].trim()) i++
  return linhas.slice(i).join('\n')
}

// Diff por linha (LCS). Fórmulas têm no máximo alguns milhares de linhas: O(n·m) é suficiente.
export function diffLinhas(antes, depois) {
  const a = String(antes).replace(/\r\n?/g, '\n').split('\n')
  const b = String(depois).replace(/\r\n?/g, '\n').split('\n')
  const n = a.length, m = b.length
  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
  }
  const saida = []
  let i = 0, j = 0
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { saida.push({ tipo: 'igual', texto: a[i], linhaNova: j + 1 }); i++; j++ }
    else if (j < m && (i >= n || lcs[i][j + 1] >= lcs[i + 1][j])) {
      // remoção antes da inclusão quando as duas cabem: lê como "trocou X por Y"
      if (i < n && lcs[i + 1][j] === lcs[i][j]) { saida.push({ tipo: 'removido', texto: a[i] }); i++ }
      else { saida.push({ tipo: 'adicionado', texto: b[j], linhaNova: j + 1 }); j++ }
    } else { saida.push({ tipo: 'removido', texto: a[i] }); i++ }
  }
  return saida
}

// Trechos iguais longos viram { tipo: 'oculto', qtd }, deixando `contexto` linhas em volta das mudanças
export function blocosDiff(diff, contexto = 3) {
  const perto = diff.map(() => false)
  diff.forEach((d, k) => {
    if (d.tipo === 'igual') return
    for (let x = Math.max(0, k - contexto); x <= Math.min(diff.length - 1, k + contexto); x++) perto[x] = true
  })
  const saida = []
  for (let k = 0; k < diff.length; k++) {
    if (diff[k].tipo !== 'igual' || perto[k]) { saida.push(diff[k]); continue }
    const ultimo = saida.at(-1)
    if (ultimo?.tipo === 'oculto') ultimo.qtd++
    else saida.push({ tipo: 'oculto', qtd: 1 })
  }
  return saida
}
