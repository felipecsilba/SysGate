// Extensões — filtros da biblioteca (o índice vem do Electron: electron/biblioteca.js)
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
