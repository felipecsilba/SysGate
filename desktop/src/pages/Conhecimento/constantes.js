// Tipo de artigo: rótulo + cor do pontinho (cor só onde informa)
export const TIPOS = [
  { id: 'faq', rotulo: 'FAQ', cor: '#0ea5e9' },
  { id: 'erro', rotulo: 'Erro', cor: '#ef4444' },
  { id: 'passo-a-passo', rotulo: 'Passo a passo', cor: '#10b981' },
  { id: 'dica', rotulo: 'Dica', cor: '#f59e0b' },
  { id: 'outro', rotulo: 'Outro', cor: '#9ca3af' },
]
export const tipoDe = id => TIPOS.find(t => t.id === id) ?? TIPOS[TIPOS.length - 1]

export const BLOCOS = [
  { tipo: 'texto', rotulo: 'Parágrafo', icone: 'texto' },
  { tipo: 'subtitulo', rotulo: 'Subtítulo', icone: 'subtitulo' },
  { tipo: 'codigo', rotulo: 'Código', icone: 'codigo' },
  { tipo: 'nota', rotulo: 'Observação', icone: 'notas' },
]

export function tempoRelativo(data) {
  const min = Math.floor((Date.now() - new Date(data).getTime()) / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30) return `há ${d} ${d === 1 ? 'dia' : 'dias'}`
  return new Date(data).toLocaleDateString('pt-BR')
}
