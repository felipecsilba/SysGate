// Mapa de dependências — lógica pura da tela (agrupar, filtrar, textos do painel)

export const CATEGORIAS = [
  { categoria: 'cadastro', rotulo: 'Dados cadastrais' },
  { categoria: 'financeiro', rotulo: 'Financeiro' },
  { categoria: 'documentos', rotulo: 'Documentos' },
  { categoria: 'outros', rotulo: 'Outros' },
]

export function agruparPorCategoria(nos, { categorias, soConfirmados = false } = {}) {
  return CATEGORIAS
    .filter(c => !categorias || categorias.has(c.categoria))
    .map(c => ({ ...c, nos: nos.filter(n => n.categoria === c.categoria && (!soConfirmados || n.status === 'confirmado')) }))
    .filter(g => g.nos.length)
}

export function chamadaFonte(fonte) {
  if (!fonte?.bfc) return null
  const base = `Dados.tributos.v2.${fonte.bfc}.busca`
  if (fonte.filtro) return `${base}(criterio: "${fonte.filtro} in (…)")`
  if (fonte.parametro) return `${base}(parametros: ["${fonte.parametro}": …])`
  return `${base}(…)`
}

export function descricaoAcao(no, rotuloDe = r => r) {
  if (no.acao === 'saiJunto') return `Sai junto com ${rotuloDe(no.saiCom)} — não exclua à parte`
  if (no.acao === 'reprocessar') return 'Derivado — reprocessar (sem DELETE)'
  if (no.acao === 'naoExcluir') return 'Não excluir'
  if (no.temDelete) return 'Excluir pelo DELETE'
  return 'Sem DELETE na API'
}

// Notas que começam com ⚠ são perigo (ex.: PUT com body vazio reprocessa a entidade toda) — vão em destaque
export function separarNotas(lista = []) {
  const alertas = []
  const notas = []
  for (const n of lista || []) {
    const t = String(n).trim()
    if (t.startsWith('⚠')) alertas.push(t.replace(/^⚠\s*/, ''))
    else notas.push(t)
  }
  return { alertas, notas }
}
