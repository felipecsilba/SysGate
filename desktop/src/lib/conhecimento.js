// Regras do módulo Conhecimento — mesmo formato de dados do Krakion web:
// `conteudo` = JSON de blocos [{ tipo: texto|subtitulo|codigo|nota, valor }];
// passo-a-passo usa `passos` = [{ texto: <JSON de blocos> }] e deixa conteudo = '[]'.
import { contem } from './texto.js'

const VAZIO = () => [{ tipo: 'texto', valor: '' }]

// Texto plano de artigo antigo vira um bloco de texto
export function parseConteudo(str) {
  if (!str || !str.trim()) return VAZIO()
  try {
    const blocos = JSON.parse(str)
    if (Array.isArray(blocos)) return blocos.length && typeof blocos[0].tipo === 'string' ? blocos : VAZIO()
  } catch { /* texto plano */ }
  return [{ tipo: 'texto', valor: str }]
}

const temValor = blocos => blocos.some(b => b.valor?.trim())

export function formDoArtigo(a) {
  return {
    titulo: a?.titulo ?? '',
    tipo: a?.tipo ?? 'faq',
    descricao: a?.descricao ?? '',
    blocos: parseConteudo(a?.conteudo),
    passos: a?.passos?.length ? a.passos.map(p => ({ blocos: parseConteudo(p.texto) })) : [{ blocos: VAZIO() }],
    vertical: a?.vertical ?? '',
    sistema: a?.sistema ?? '',
    etiquetas: a?.etiquetas ?? [],
  }
}

export function montarArtigo(f) {
  const passoAPasso = f.tipo === 'passo-a-passo'
  return {
    titulo: f.titulo.trim(),
    tipo: f.tipo,
    descricao: f.descricao.trim() || null,
    conteudo: passoAPasso ? '[]' : JSON.stringify(f.blocos),
    passos: passoAPasso ? f.passos.filter(p => temValor(p.blocos)).map(p => ({ texto: JSON.stringify(p.blocos) })) : [],
    vertical: f.vertical || null,
    sistema: f.sistema || null,
    etiquetas: f.etiquetas,
  }
}

// Trocar de/para passo-a-passo aproveita os textos já escritos
export function trocarTipo(f, novo) {
  if (novo === f.tipo) return f
  if (novo === 'passo-a-passo') {
    const linhas = f.blocos.filter(b => b.tipo === 'texto').flatMap(b => b.valor.split('\n')).map(l => l.trim()).filter(Boolean)
    return { ...f, tipo: novo, passos: linhas.length ? linhas.map(valor => ({ blocos: [{ tipo: 'texto', valor }] })) : [{ blocos: VAZIO() }] }
  }
  if (f.tipo === 'passo-a-passo') {
    const textos = f.passos.flatMap(p => p.blocos.filter(b => b.tipo === 'texto').map(b => b.valor)).filter(Boolean)
    return { ...f, tipo: novo, blocos: textos.length ? textos.map(valor => ({ tipo: 'texto', valor })) : VAZIO() }
  }
  return { ...f, tipo: novo }
}

// Todo o texto do artigo, para a busca achar até dentro de bloco de código e de passo
function textoDoArtigo(a) {
  const blocos = [...parseConteudo(a.conteudo), ...(a.passos || []).flatMap(p => parseConteudo(p.texto))]
  return [a.titulo, a.descricao, ...blocos.map(b => b.valor), ...(a.etiquetas || [])].filter(Boolean).join('\n')
}

export function filtrarArtigos(artigos, { busca = '', tipo, vertical, sistema } = {}) {
  return artigos.filter(a =>
    (!tipo || a.tipo === tipo) &&
    (!vertical || a.vertical === vertical) &&
    (!sistema || a.sistema === sistema) &&
    (!busca.trim() || contem(textoDoArtigo(a), busca))
  )
}
