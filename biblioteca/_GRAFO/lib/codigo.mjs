// Leitura de código BFC (fórmulas, scripts, templates) para o grafo.

// Tira comentários // e /* */ sem mexer em strings e preservando as quebras de linha
// (assim um "não é Dados.tributos.v2.x" num comentário não vira uso da fonte).
export function semComentarios(texto) {
  let out = ''
  let i = 0
  let aspas = null
  while (i < texto.length) {
    const c = texto[i], d = texto[i + 1]
    if (aspas) {
      out += c
      if (c === '\\') { out += d ?? ''; i += 2; continue }
      if (c === aspas) aspas = null
      i++
      continue
    }
    if (c === '"' || c === "'") { aspas = c; out += c; i++; continue }
    if (c === '/' && d === '/') { while (i < texto.length && texto[i] !== '\n') i++; continue }
    if (c === '/' && d === '*') {
      i += 2
      while (i < texto.length && !(texto[i] === '*' && texto[i + 1] === '/')) { if (texto[i] === '\n') out += '\n'; i++ }
      i += 2
      continue
    }
    out += c
    i++
  }
  return out
}

// Verbos que encerram a cadeia: Dados.tributos.v2.imoveis.camposAdicionais.busca(...) → imoveis.camposAdicionais
const METODOS = new Set(['busca', 'buscar', 'cria', 'criar', 'atualiza', 'atualizar', 'altera', 'alterar',
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
