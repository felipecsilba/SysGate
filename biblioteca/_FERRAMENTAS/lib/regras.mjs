// Revisor de BFC-Script: as armadilhas que já custaram rodada no Studio, com linha e correção.
// Fontes das regras: memória bfc-script-armadilhas e CONTEXTO.md ("Lições aprendidas").
// Calibrado contra peças validadas: regra que acusa peça que roda em produção está errada.
import { semComentarios, METODOS } from '../../_GRAFO/lib/codigo.mjs'

/** Apaga o conteúdo das strings (mantém aspas, tamanho e quebras de linha) para regra não casar com texto. */
export function mascararStrings(texto) {
  let out = ''
  let i = 0
  while (i < texto.length) {
    const c = texto[i]
    if (c === '"' || c === "'") {
      const tripla = texto.startsWith(c.repeat(3), i)
      const fim = tripla ? c.repeat(3) : c
      out += fim
      i += fim.length
      while (i < texto.length && !texto.startsWith(fim, i)) {
        if (!tripla && texto[i] === '\n') break
        if (texto[i] === '\\') { out += '  '; i += 2; continue }
        out += texto[i] === '\n' ? '\n' : ' '
        i++
      }
      if (texto.startsWith(fim, i)) { out += fim; i += fim.length }
      continue
    }
    out += c
    i++
  }
  return out
}

const MSG = {
  'cast-as': 'O Studio proíbe cast ("não estão autorizados a usar … asType"). Para número: Math.round(v * 100) e def; para conjunto: lista + .unique().',
  'json-minusculo': 'É JSON em maiúsculas (JSON.escrever). "Json" não existe no Studio.',
  'imprimir-soma': 'Com parênteses logo depois de imprimir, só o 1º termo sai. Monte numa variável: linha = a + b; imprimir linha.',
  'zip-no-script': 'O Studio já entrega o resultado em zip. Um Resultado.arquivo(...) por arquivo; Resultado.arquivos não existe.',
  'metodo-sistema': 'No tributos o método é .busca(...); na procuradoria é .buscar(...).',
  'metodo-rest': 'No BFC o método é .busca (procuradoria: .buscar). Nome de operação REST do catálogo não existe no script — confira com fonte.py ver.',
  'se-lista': 'Essa variável recebe uma lista, e "se (lista)" é verdadeiro mesmo com a lista VAZIA. Compare explicitamente: if (!x.isEmpty()) ou se (x != null && x.size() > 0).',
  'it-em-se': 'Dentro de se (...) { } o "it" vira nulo. Use if, ou copie para uma variável antes (item = it).',
  'zero-ausencia': 'Em base migrada, id ausente costuma vir 0, não nulo. Trate os dois: v == nulo || v == 0.',
  'fonte-desconhecida': 'Fonte que não está no catálogo/grafo. Confira o nome no editor ou com fonte.py buscar.',
  'formula-def': 'Fórmula não aceita def: escreva o cálculo direto, sem função.',
  'formula-find': 'Fórmula não aceita .find{}: use laço simples.',
  'formula-dados': 'Fórmula não acessa Dados.*: use as variáveis de contexto do motor (Dicionario de Formulas/<TIPO>).',
}
const NIVEL = { 'se-lista': 'aviso', 'it-em-se': 'aviso', 'zero-ausencia': 'aviso', 'metodo-rest': 'aviso', 'fonte-desconhecida': 'aviso' }

function fecha(s, i, abre, fechaCh) {
  let d = 0
  for (let j = i; j < s.length; j++) {
    if (s[j] === abre) d++
    else if (s[j] === fechaCh && --d === 0) return j
  }
  return -1
}

/**
 * Achados do texto: [{ linha, nivel: erro|aviso, regra, trecho, msg }], por linha.
 * opcoes.formula: aplica as regras de fórmula. opcoes.fontesConhecidas: ids "fonte:x" do grafo.
 * opcoes.operacoesRest: nomes de operação do catálogo (liga a regra metodo-rest).
 */
export function revisar(texto, { formula = false, fontesConhecidas = [], operacoesRest = [] } = {}) {
  const codigo = semComentarios(String(texto || ''))
  const m = mascararStrings(codigo)
  const inicios = [0]
  for (let i = 0; i < m.length; i++) if (m[i] === '\n') inicios.push(i + 1)
  const linhaDe = idx => { let lo = 0, hi = inicios.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (inicios[mid] <= idx) lo = mid; else hi = mid - 1 } return lo + 1 }
  const achados = []
  const add = (regra, idx, trecho) => achados.push({ linha: linhaDe(idx), nivel: NIVEL[regra] || 'erro', regra, trecho: trecho.trim(), msg: MSG[regra] })
  const todos = (re, regra, src = m, filtro = () => true) => { for (const x of src.matchAll(re)) if (filtro(x)) add(regra, x.index, x[0]) }

  todos(/\bas\s+[A-Z]\w*/g, 'cast-as')
  todos(/\bJson\./g, 'json-minusculo')
  todos(/\bimprimir\s*\([^()\n]*\)\s*\+/g, 'imprimir-soma')
  todos(/\bArquivo\.novo\s*\([^)\n]*['"]zip['"]/g, 'zip-no-script', codigo)
  todos(/\bResultado\.arquivos\s*\(/g, 'zip-no-script')
  todos(/\bDados\.tributos\.v\d+\.[A-Za-z.]+\.buscar\s*\(/g, 'metodo-sistema')
  todos(/\bDados\.procuradoria\.v\d+\.[A-Za-z.]+\.busca\s*\(/g, 'metodo-sistema')
  // metodo-rest: operação de leitura do catálogo (busca<Algo>) usada como método no lugar de .busca.
  // Calibrado no corpus: preenche, metadados, calcula… também são nomes do catálogo, mas são métodos BFC legítimos.
  const rest = new Set(operacoesRest)
  todos(/\bDados\.\w+\.v\d+\.([A-Za-z]+(?:\.[A-Za-z]+)+)\s*\(/g, 'metodo-rest', m, x => {
    const met = x[1].split('.').pop()
    return rest.has(met) && /^busca[A-Z]/.test(met) && !METODOS.has(met)
  })

  // se-lista: só quando a variável recebeu uma lista no arquivo (calibrado no corpus: "se (booleano)" é comum e correto)
  const listas = new Set()
  for (const re of [/\b([A-Za-z_]\w*)\s*=\s*\[/g, /\b([A-Za-z_]\w*)\s*<</g,
    /\b([A-Za-z_]\w*)\s*=\s*[^\n;=]*\.(?:findAll|collect|busca|buscar|unique|split|toList|sort|keySet|values)\s*[({]/g]) {
    for (const x of m.matchAll(re)) listas.add(x[1])
  }
  todos(/\bse\s*\(\s*!?\s*([A-Za-z_]\w*)\s*\)/g, 'se-lista', m, x => listas.has(x[1]))

  // it-em-se: "it." no 1º nível do bloco de um se (closure aninhada redefine o it e passa)
  for (const x of m.matchAll(/\bse\s*\(/g)) {
    const fimCond = fecha(m, x.index + x[0].length - 1, '(', ')')
    if (fimCond < 0) continue
    let k = fimCond + 1
    while (/\s/.test(m[k] || '')) k++
    if (m[k] !== '{') continue
    const fimBloco = fecha(m, k, '{', '}')
    let d = 0
    for (let j = k; j <= fimBloco; j++) {
      if (m[j] === '{') d++
      else if (m[j] === '}') d--
      else if (d === 1 && /^it\??\./.test(m.slice(j, j + 4)) && !/[\w.]/.test(m[j - 1] || '')) add('it-em-se', j, 'it.')
    }
  }

  // zero-ausencia: id comparado com nulo sem tratar o 0 na mesma linha
  for (const x of m.matchAll(/\b((?:[A-Za-z_]\w*\??\.)*id[A-Z]?\w*)\s*(?:==|!=)\s*(?:nulo|null)\b/g)) {
    const linha = m.slice(inicios[linhaDe(x.index) - 1], m.indexOf('\n', x.index) < 0 ? m.length : m.indexOf('\n', x.index)).replace(/\s+/g, '')
    const v = x[1].replace(/\s+/g, '')
    if (![`${v}==0`, `${v}!=0`, `${v}>0`, `${v}<=0`].some(s => linha.includes(s))) add('zero-ausencia', x.index, x[0])
  }

  // fonte-desconhecida: cadeia do tributos sem nenhum prefixo no grafo
  if (fontesConhecidas.length) {
    const conhecidas = new Set(fontesConhecidas.map(f => f.toLowerCase()))
    const vistas = new Set()
    for (const x of m.matchAll(/\bDados\.tributos\.v\d+\.([A-Za-z]+(?:\.[A-Za-z]+)*)/g)) {
      const partes = x[1].split('.')
      while (partes.length > 1 && METODOS.has(partes[partes.length - 1])) partes.pop()
      const cadeia = partes.join('.')
      if (vistas.has(cadeia)) continue
      vistas.add(cadeia)
      const ok = partes.some((_, k) => conhecidas.has(`fonte:${partes.slice(0, k + 1).join('.')}`.toLowerCase()))
      if (!ok) add('fonte-desconhecida', x.index, `Dados.tributos.v2.${cadeia}`)
    }
  }

  if (formula) {
    todos(/\bdef\s+[A-Za-z_]/g, 'formula-def')
    todos(/\.find\s*\{/g, 'formula-find')
    todos(/\bDados\./g, 'formula-dados')
  }

  return achados.sort((a, b) => a.linha - b.linha || (a.regra < b.regra ? -1 : 1))
}
