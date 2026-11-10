// Leitura do corpus de produção (Formulas/, Scripts/, Relatorios/): o que o nome e os arquivos dizem
// de cada peça, a família (código idêntico entre municípios) e a semelhança com os templates.
import crypto from 'node:crypto'
import { semComentarios } from './codigo.mjs'
import { slug } from './biblioteca.mjs'

const TIPO = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/

/** "Andradas - GERACAO_CREDITO_IMOVEIS - IPTU - Valor Venal - 2026.txt" → município, tipo, descrição, ano. */
export function lerNomeFormula(nome) {
  const partes = nome.replace(/\.txt$/i, '').split(' - ')
  const municipio = partes.shift()
  let tipoFormula = null
  if (partes.length && partes[0].length >= 3 && TIPO.test(partes[0])) tipoFormula = partes.shift()
  let ano = null
  if (partes.length > 1 && /^\d{4}$/.test(partes[partes.length - 1])) ano = partes.pop()
  return { municipio, tipoFormula, descricao: partes.join(' - ') || null, ano }
}

const SUBTIPO = { Componentes: 'componente', Criticas: 'critica', 'Fontes Dinamicas': 'fonte-dinamica', Scripts: 'script' }

/** Script pela pasta; crítica: "<Município> - <CADASTRO> - {…'identificador'_ 'EVENTO'…} - <título>". */
export function lerNomeScript(pasta, nome) {
  const base = nome.replace(/\.txt$/i, '')
  const subtipo = SUBTIPO[pasta] || 'script'
  const critica = /^(.+?) - ([A-Z][A-Z0-9_]*) - \{(.*?)\} - (.+)$/.exec(base)
  if (critica) {
    const evento = /'identificador'_ '([A-Z_]+)'/.exec(critica[3])?.[1] || null
    return { municipio: critica[1], subtipo, titulo: critica[4], cadastro: critica[2], evento }
  }
  const i = base.indexOf(' - ')
  return { municipio: i < 0 ? null : base.slice(0, i), subtipo, titulo: i < 0 ? base : base.slice(i + 3) }
}

/** relatorio_info.txt → título, descrição, chaveNatureza. Ids, autor e datas ficam de fora de propósito. */
export function lerInfoRelatorio(texto) {
  const campo = nome => new RegExp(`^\\s*${nome}\\s*:\\s*(.+?)\\s*$`, 'm').exec(String(texto || ''))?.[1] || null
  return { titulo: campo('titulo') || campo('RELATÓRIO'), descricao: campo('descricao'), chaveNatureza: campo('chaveNatureza') }
}

/** Código sem comentários e com espaços colapsados: o que sobra é o que roda. */
export function normalizarCodigo(texto) {
  return semComentarios(String(texto || '')).replace(/\s+/g, ' ').trim()
}

export function familia(texto) {
  return crypto.createHash('sha1').update(normalizarCodigo(texto)).digest('hex').slice(0, 12)
}

function fnv(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) }
  return h >>> 0
}

/** Conjunto de trechos de 5 tokens (com hash) do código normalizado. */
export function trechos(texto, n = 5) {
  const toks = normalizarCodigo(texto).match(/[A-Za-z_]\w*|\d+(?:\.\d+)?|"[^"]*"|'[^']*'|\S/g) || []
  const out = new Set()
  if (!toks.length) return out
  if (toks.length < n) { out.add(fnv(toks.join('\u0001'))); return out }
  for (let i = 0; i + n <= toks.length; i++) out.add(fnv(toks.slice(i, i + n).join('\u0001')))
  return out
}

export function jaccard(a, b) {
  if (!a.size || !b.size) return 0
  const [menor, maior] = a.size < b.size ? [a, b] : [b, a]
  let comum = 0
  for (const x of menor) if (maior.has(x)) comum++
  return comum / (a.size + b.size - comum)
}

/** Nó do município pelo prefixo do arquivo. */
export function municipioDe(prefixo) {
  const no = { id: `municipio:${slug(prefixo)}`, tipo: 'municipio', rotulo: prefixo }
  if (/^bom jesus$/i.test(prefixo.trim())) {
    no.notas = ['⚠ Dois municípios diferentes chamados Bom Jesus estão misturados neste prefixo (ver biblioteca/README.md). Não dá para saber de qual prefeitura é cada arquivo.']
  }
  return no
}
