// Extensões — filtros da biblioteca (o índice vem do Electron: electron/biblioteca.js)
import { normalizar } from './texto.js'

export const TIPOS = [
  { id: 'script', rotulo: 'Scripts' },
  { id: 'formula', rotulo: 'Fórmulas' },
  { id: 'relatorio', rotulo: 'Relatórios' },
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

// Busca por palavras (todas precisam aparecer, em qualquer ordem) no nome, município, detalhe e grupo
export function filtrarItens(itens, { tipo, grupo, municipio, busca = '' } = {}) {
  const palavras = normalizar(busca).split(/\s+/).filter(Boolean)
  return itens.filter(i => {
    if (tipo && i.tipo !== tipo) return false
    if (grupo && i.grupo !== grupo) return false
    if (municipio && i.municipio !== municipio) return false
    if (!palavras.length) return true
    const alvo = normalizar(`${i.nome} ${i.municipio ?? ''} ${i.detalhe ?? ''} ${i.grupo ?? ''}`)
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
