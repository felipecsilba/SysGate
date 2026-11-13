// Catálogo de contexto das fórmulas (capturado do editor do Tributos) para o revisor:
// que classes utilitárias e métodos existem em cada tipo de fórmula.
// Fonte: _CONHECIMENTO/_bruto/formula-catalogo/<TIPO>.json. Ver _BIBLIOTECA/Dicionario de Formulas/README.md.

// Nome do tipo no corpus → nome do tipo no dicionário, quando não é o mesmo prefixo
const APELIDOS = {
  ITBI_TRANSFERENCIA_CREDITOS: 'ITBI',
  ACRESCIMO_PRE_FIXADA: 'ACRESCIMO_PARCELAMENTO',
}

/**
 * Métodos que rodam em produção sem estar no catálogo do editor (o catálogo não lista tudo).
 * Só entra aqui o que foi visto rodando, com a origem.
 */
export const METODOS_SEM_CATALOGO = new Map([
  ['Numeros.inteiro', 'receitas diversas em produção desde 2021 (2 municípios); ausente dos 21 catálogos (2026-11-13)'],
])

const nomeDoMetodo = m => String(m?.name || '').split('(')[0].trim()

/**
 * { TIPO: json do catálogo } → { tipos: { TIPO: { classes: Map(classe → Set(métodos)), variaveis: Set } },
 *   classesConhecidas: Map(classe → [tipos em que existe]) }
 */
export function indexarCatalogos(porTipo) {
  const tipos = {}
  const classesConhecidas = new Map()
  for (const tipo of Object.keys(porTipo).sort()) {
    const j = porTipo[tipo] || {}
    const classes = new Map((j.classes || []).map(c => [c.name, new Set((c.methods || []).map(nomeDoMetodo))]))
    tipos[tipo] = { classes, variaveis: new Set((j.variables || []).map(v => v.name)) }
    for (const nome of classes.keys()) {
      if (!classesConhecidas.has(nome)) classesConhecidas.set(nome, [])
      classesConhecidas.get(nome).push(tipo)
    }
  }
  return { tipos, classesConhecidas }
}

/** Tipo do dicionário a partir do nome do arquivo ("Município - TIPO - Nome - Ano.txt"); null se não reconhecer. */
export function tipoDoArquivo(nome, tiposConhecidos) {
  const m = String(nome || '').match(/ - ([A-Z][A-Z0-9_]+) - /)
  if (!m) return null
  const t = APELIDOS[m[1]] || m[1]
  const porTamanho = [...tiposConhecidos].sort((a, b) => b.length - a.length)
  return porTamanho.find(x => t === x || t.startsWith(x + '_')) || null
}
