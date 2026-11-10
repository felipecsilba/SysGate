// Leitura das peças curadas da biblioteca: templates, conhecimento e as referências que o texto faz.
import { fontesUsadas } from './codigo.mjs'

export const semAcento = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
export const slug = s => semAcento(s).toLowerCase().replace(/[^a-z0-9/_]+/g, '-').replace(/-+/g, '-').replace(/(^-|-$)|-(?=\/)|(?<=\/)-/g, '')
const letras = s => semAcento(s).replace(/[^A-Za-z0-9]/g, '').toLowerCase()

/** Arquivos da pasta Templates → [{ id, arquivos }]. id = nome sem extensão e sem _BASE. */
export function agruparTemplates(nomes) {
  const grupos = new Map()
  for (const n of nomes) {
    if (/^README/i.test(n) || !/\.(txt|jrxml)$/i.test(n)) continue
    const id = n.replace(/\.[^.]+$/, '').replace(/_BASE$/, '')
    if (!grupos.has(id)) grupos.set(id, [])
    grupos.get(id).push(n)
  }
  return [...grupos].map(([id, arquivos]) => ({ id, arquivos: arquivos.sort() })).sort((a, b) => a.id.localeCompare(b.id))
}

// Palavras de ligação somem dos dois lados ("Campos Adicionais de Imoveis" = Campos_Adicionais_Imoveis).
const LIGACAO = new Set(['de', 'da', 'do', 'das', 'dos', 'com', 'e', 'em', 'por', 'para', 'a', 'o'])
const nomeChave = s => semAcento(s).split(/[^A-Za-z0-9]+/).filter(p => p && !LIGACAO.has(p.toLowerCase())).join('').toLowerCase()

/** README do template: mesmo nome sem separadores, ou o mais longo cujo nome é começo do id (variante). */
export function casarReadme(id, readmes) {
  const alvo = nomeChave(id)
  const cands = readmes
    .map(r => ({ r, l: nomeChave(r.replace(/^README\s*-\s*/i, '').replace(/\.md$/i, '')) }))
    .filter(c => c.l && (alvo === c.l || alvo.startsWith(c.l)))
    .sort((a, b) => b.l.length - a.l.length)
  return cands[0]?.r ?? null
}

/**
 * O que o README diz sobre a validação no Studio → { status: validado | nao-validado | sem-registro, data }.
 * data: AAAA-MM-DD, ou AAAA-MM quando o README só traz mês/ano, ou null quando diz que validou sem data.
 */
export function validacao(texto) {
  const t = String(texto || '')
  if (/n[ãa]o\s+(foi\s+)?validad[oa]/i.test(t)) return { status: 'nao-validado', data: null }
  const m = /validad[oa]/i.exec(t)
  if (!m) return { status: 'sem-registro', data: null }
  const janela = t.slice(m.index, m.index + 140)
  let d
  if ((d = /(\d{2})\/(\d{2})\/(\d{4})/.exec(janela))) return { status: 'validado', data: `${d[3]}-${d[2]}-${d[1]}` }
  if ((d = /(\d{4})-(\d{2})-(\d{2})/.exec(janela))) return { status: 'validado', data: `${d[1]}-${d[2]}-${d[3]}` }
  if ((d = /\b(\d{2})\/(\d{4})\b/.exec(janela))) return { status: 'validado', data: `${d[2]}-${d[1]}` }
  return { status: 'validado', data: null }
}

const titulo = texto => {
  const m = /^#\s+(.+)$/m.exec(String(texto || ''))
  return m ? m[1].trim() : null
}

export function lerTemplate({ id, arquivos, readme, readmeTexto }) {
  const base = '_BIBLIOTECA/Templates/'
  const principal = arquivos.find(a => a.endsWith('.txt')) || arquivos[0]
  const no = {
    id: `template:${id}`,
    tipo: 'template',
    rotulo: (readme && titulo(readmeTexto)?.replace(/\s+[—-]\s+como usar.*$/i, '')) || id.replace(/_/g, ' '),
    arquivo: base + principal,
  }
  if (arquivos.length > 1) no.outros = arquivos.filter(a => a !== principal).map(a => base + a)
  if (readme) no.readme = base + readme
  const v = readme ? validacao(readmeTexto) : { status: 'sem-registro', data: null }
  no.status = v.status
  if (v.data) no.validadoEm = v.data
  return no
}

/** Ids que o texto cita: templates conhecidos, tipos de fórmula (ITBI_X → ITBI), fontes Dados.*, endpoints /api/x. */
export function refsDoTexto(texto, { templates = [], tipos = [] }) {
  const t = String(texto || '')
  const refs = new Set()
  for (const id of templates) if (t.includes(id)) refs.add(`template:${id}`)
  const tiposOrd = [...tipos].sort((a, b) => b.length - a.length)
  for (const m of t.matchAll(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*\b/g)) {
    const tipo = tiposOrd.find(x => m[0] === x || m[0].startsWith(x + '_'))
    if (tipo) refs.add(`tipo-formula:${tipo}`)
  }
  for (const f of fontesUsadas(t)) refs.add(f.sistema === 'tributos' ? `fonte:${f.cadeia}` : `fonte:${f.sistema}/${f.cadeia}`)
  for (const m of t.matchAll(/\/api\/([A-Za-z]+)/g)) refs.add(`endpoint:${m[1]}`)
  return [...refs].sort()
}

export function lerConhecimento(rel, texto, conhecidos) {
  const nome = rel.split('/').pop().replace(/\.md$/i, '')
  const no = {
    id: `conhecimento:${slug(rel.replace(/\.md$/i, ''))}`,
    tipo: 'conhecimento',
    rotulo: titulo(texto) || nome,
    arquivo: `_CONHECIMENTO/${rel}`,
    pasta: rel.split('/')[0],
  }
  if (rel.startsWith('_bruto/')) no.status = 'bruto'
  return { no, refs: refsDoTexto(texto, conhecidos) }
}
