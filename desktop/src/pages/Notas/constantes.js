// Mesmas cores do Krakion web (a nota importada mantém a dela) — aqui viram só um pontinho
export const CORES = [
  { hex: '#FFFDE7', nome: 'Amarelo' },
  { hex: '#F3E5F5', nome: 'Lilás' },
  { hex: '#E8F5E9', nome: 'Verde' },
  { hex: '#E3F2FD', nome: 'Azul' },
  { hex: '#FBE9E7', nome: 'Salmão' },
  { hex: '#FFF3E0', nome: 'Laranja' },
  { hex: '#E8EAF6', nome: 'Índigo' },
  { hex: '#FCE4EC', nome: 'Rosa' },
  { hex: '#E0F2F1', nome: 'Teal' },
  { hex: '#FAFAFA', nome: 'Branco' },
]

// Pastel não aparece no tema claro: o ponto usa uma versão saturada da mesma cor
export const PONTO = {
  '#FFFDE7': '#eab308', '#F3E5F5': '#a855f7', '#E8F5E9': '#22c55e', '#E3F2FD': '#3b82f6', '#FBE9E7': '#f97316',
  '#FFF3E0': '#f59e0b', '#E8EAF6': '#6366f1', '#FCE4EC': '#ec4899', '#E0F2F1': '#14b8a6', '#FAFAFA': '#9ca3af',
}
export const corPonto = hex => PONTO[String(hex).toUpperCase()] ?? PONTO['#FAFAFA']

export const TIPOS = [
  { id: 'texto', rotulo: 'Texto', icone: 'texto' },
  { id: 'checklist', rotulo: 'Checklist', icone: 'checklist' },
  { id: 'lista', rotulo: 'Lista', icone: 'lista' },
  { id: 'codigo', rotulo: 'Código', icone: 'codigo' },
]
