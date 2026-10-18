// Regras do módulo Notas. Tipos: texto e codigo usam `conteudo`; checklist e lista usam `itens`.
import { contem } from './texto.js'

const COM_ITENS = ['checklist', 'lista']

// Trocar o tipo não perde o que foi escrito: linhas viram itens e itens viram linhas
export function converterTipo({ tipo, conteudo = '', itens = [] }, novo) {
  if (!COM_ITENS.includes(tipo) && COM_ITENS.includes(novo)) {
    const linhas = conteudo.split('\n').map(l => l.trim()).filter(Boolean)
    if (linhas.length) return { tipo: novo, conteudo: '', itens: linhas.map(texto => ({ texto, feito: false })) }
  }
  if (COM_ITENS.includes(tipo) && !COM_ITENS.includes(novo) && itens.length) {
    return { tipo: novo, conteudo: itens.map(i => i.texto).join('\n'), itens: [] }
  }
  return { tipo: novo, conteudo, itens }
}

export function filtrarNotas(notas, { busca = '', tipo, etiqueta } = {}) {
  return notas.filter(n =>
    (!tipo || n.tipo === tipo) &&
    (!etiqueta || n.etiquetas.includes(etiqueta)) &&
    (!busca.trim() || contem(n.titulo, busca) || contem(n.conteudo, busca) || n.itens.some(i => contem(i.texto, busca)))
  )
}

export function previa(nota) {
  if (COM_ITENS.includes(nota.tipo)) {
    const textos = nota.itens.map(i => i.texto).filter(Boolean).join(' · ')
    if (nota.tipo === 'checklist' && nota.itens.length) return `${nota.itens.filter(i => i.feito).length}/${nota.itens.length} · ${textos}`
    return textos
  }
  return (nota.conteudo || '').split('\n').map(l => l.trim()).find(Boolean) ?? ''
}

export const normalizarEtiqueta = t => String(t ?? '').trim().toLowerCase()

export function todasEtiquetas(notas) {
  return [...new Set(notas.flatMap(n => n.etiquetas))].sort((a, b) => a.localeCompare(b))
}
