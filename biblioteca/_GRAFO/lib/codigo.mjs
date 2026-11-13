// Leitura de código BFC (fórmulas, scripts, templates) para o grafo.

// Tira comentários // e /* */ sem mexer em strings e preservando as quebras de linha
// (assim um "não é Dados.tributos.v2.x" num comentário não vira uso da fonte).
export function semComentarios(texto) {
  return varrerCodigo(texto, { tirarComentarios: true })
}

/**
 * Lê BFC-Script/Groovy separando código, strings e comentários.
 * - tirarComentarios: apaga // e /* *\/ (mantém as quebras de linha).
 * - mascararStrings: troca o texto das strings por espaços (mantém aspas, tamanho e quebras de linha).
 * Entende interpolação em string de aspas duplas: o que está em ${...} é código, e aspas lá dentro
 * não fecham a string de fora ("in (${p.join(",")})"). String de aspa simples (não tripla) termina
 * na quebra de linha, para uma aspa solta não engolir o resto do arquivo.
 */
export function varrerCodigo(texto, { tirarComentarios = false, mascararStrings = false } = {}) {
  let out = ''
  let i = 0
  const pilha = [] // { str: '"' | "'" | '"""' | "'''" } ou { interp: profundidade de chaves }
  while (i < texto.length) {
    const c = texto[i], d = texto[i + 1]
    const topo = pilha[pilha.length - 1]
    if (topo && topo.str) {
      const tripla = topo.str.length === 3
      if (c === '\\') { out += mascararStrings ? '  ' : c + (d ?? ''); i += 2; continue }
      if (texto.startsWith(topo.str, i)) { out += topo.str; i += topo.str.length; pilha.pop(); continue }
      if (topo.str[0] === '"' && c === '$' && d === '{') { out += '${'; i += 2; pilha.push({ interp: 0 }); continue }
      if (c === '\n') { out += '\n'; i++; if (!tripla) pilha.pop(); continue }
      out += mascararStrings ? ' ' : c
      i++
      continue
    }
    // código (no nível de cima ou dentro de ${...})
    if (c === '"' || c === "'") {
      const q = texto.startsWith(c.repeat(3), i) ? c.repeat(3) : c
      out += q; i += q.length; pilha.push({ str: q }); continue
    }
    if (tirarComentarios && c === '/' && d === '/') { while (i < texto.length && texto[i] !== '\n') i++; continue }
    if (tirarComentarios && c === '/' && d === '*') {
      i += 2
      while (i < texto.length && !(texto[i] === '*' && texto[i + 1] === '/')) { if (texto[i] === '\n') out += '\n'; i++ }
      i += 2
      continue
    }
    if (topo && 'interp' in topo) {
      if (c === '{') topo.interp++
      else if (c === '}') { if (topo.interp === 0) { pilha.pop(); out += c; i++; continue } topo.interp-- }
    }
    out += c
    i++
  }
  return out
}

// Verbos que encerram a cadeia: Dados.tributos.v2.imoveis.camposAdicionais.busca(...) → imoveis.camposAdicionais
export const METODOS = new Set(['busca', 'buscar', 'cria', 'criar', 'atualiza', 'atualizar', 'altera', 'alterar',
  'exclui', 'excluir', 'remove', 'remover', 'salva', 'salvar', 'lista', 'listar', 'insere', 'inserir', 'obtem', 'obter'])

/** Fontes chamadas no código: [{ sistema, cadeia }], sem repetição, ordenadas. */
export function fontesUsadas(texto) {
  const re = /\bDados\.([a-zA-Z]+)\.v\d+\.([a-zA-Z]+(?:\.[a-zA-Z]+)*)/g
  const vistos = new Map()
  let m
  const limpo = semComentarios(String(texto || ''))
  while ((m = re.exec(limpo))) {
    const partes = m[2].split('.')
    while (partes.length > 1 && METODOS.has(partes[partes.length - 1])) partes.pop()
    const f = { sistema: m[1], cadeia: partes.join('.') }
    vistos.set(f.sistema + ':' + f.cadeia, f)
  }
  return [...vistos.values()].sort((a, b) => (a.sistema + a.cadeia).localeCompare(b.sistema + b.cadeia))
}
