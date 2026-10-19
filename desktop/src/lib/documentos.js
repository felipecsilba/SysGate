// Municípios — regras de tela dos documentos (o disco fica no Electron: electron/municipiosDocs.js)
import { normalizar } from './texto.js'

// Mesma lista do Electron (ids e prefixos precisam bater)
export const TIPOS_DOC = [
  { id: 'codigo-tributario', rotulo: 'Código Tributário', prefixo: 'Código Tributário' },
  { id: 'leis', rotulo: 'Leis', prefixo: 'Lei' },
  { id: 'decretos', rotulo: 'Decretos', prefixo: 'Decreto' },
  { id: 'portarias', rotulo: 'Portarias', prefixo: 'Portaria' },
  { id: 'anotacoes', rotulo: 'Anotações', prefixo: null },
  { id: 'outros', rotulo: 'Outros', prefixo: null },
]

// "Lei nº 524/2021" quando tem número; senão o assunto; senão o nome do arquivo
export function tituloDocumento(doc) {
  const t = TIPOS_DOC.find(x => x.id === doc.tipo)
  if (t?.prefixo && (doc.numero || doc.ano)) {
    const ident = doc.numero ? `nº ${doc.numero}${doc.ano ? `/${doc.ano}` : ''}` : doc.ano
    return `${t.prefixo} ${ident}`
  }
  return doc.assunto || doc.arquivo
}

// Linha de baixo: o assunto (quando o título já é o número) e o formato
export function detalheDocumento(doc) {
  const titulo = tituloDocumento(doc)
  return [doc.assunto && doc.assunto !== titulo ? doc.assunto : null, (doc.ext || '').toUpperCase() || null].filter(Boolean).join(' · ')
}

// Como mostrar: PDF no leitor embutido, texto editável, CSV em tabela, imagem, ou abrir no programa do Windows
export function visualizacao(ext) {
  const e = String(ext || '').toLowerCase()
  if (e === 'pdf') return 'pdf'
  if (['md', 'txt'].includes(e)) return 'texto'
  if (['csv'].includes(e)) return 'csv'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(e)) return 'imagem'
  return 'externo'
}

/** Documentos agrupados na ordem dos tipos, cada grupo por ano (mais novo) e número. Filtra sem acento. */
export function agruparDocumentos(docs, busca = '') {
  const palavras = normalizar(busca).split(/\s+/).filter(Boolean)
  const casa = d => !palavras.length || palavras.every(p => normalizar(`${tituloDocumento(d)} ${d.assunto} ${d.arquivo}`).includes(p))
  const num = v => Number(String(v).replace(/\D/g, '')) || 0
  return TIPOS_DOC.map(t => ({
    ...t,
    docs: docs.filter(d => d.tipo === t.id && casa(d))
      .sort((a, b) => num(b.ano) - num(a.ano) || num(b.numero) - num(a.numero) || tituloDocumento(a).localeCompare(tituloDocumento(b), 'pt-BR')),
  })).filter(g => g.docs.length)
}

export function tamanhoArquivo(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
}

// URL do protocolo do Electron que serve o arquivo direto do disco (PDF e imagem)
export const urlDocumento = id => `krakion-doc://municipios/${encodeURIComponent(id)}`

export function filtrarMunicipios(municipios, busca = '') {
  const t = normalizar(busca)
  return t ? municipios.filter(m => normalizar(`${m.nome} ${m.entidade ?? ''}`).includes(t)) : municipios
}
