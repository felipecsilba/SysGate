// Analisador JSON — lógica pura (sem tela): interpretar, caminhos, estatísticas, comparação, busca e tabela.
import { normalizar } from './texto.js'

// ─── Interpretar ──────────────────────────────────────────────────────────────

export function cursor(texto, posicao) {
  const antes = texto.slice(0, posicao).split('\n')
  return { linha: antes.length, coluna: antes[antes.length - 1].length + 1 }
}

// JSON.parse não diz onde errou de forma estável (a mensagem muda entre versões do V8),
// então, quando falha, um leitor próprio refaz o caminho e acha a posição exata.
function localizarErro(t) {
  let i = 0
  const falha = (esperava) => {
    const err = new Error()
    err.pos = i
    err.fim = i >= t.length
    err.esperava = esperava
    throw err
  }
  const espacos = () => { while (i < t.length && ' \t\n\r'.includes(t[i])) i++ }
  const literal = (p) => { if (t.startsWith(p, i)) i += p.length; else falha(`"${p}"`) }
  const texto = () => {
    i++
    while (i < t.length && t[i] !== '"') {
      if (t.charCodeAt(i) < 0x20) falha('fim do texto entre aspas')
      if (t[i] === '\\') {
        i++
        if (t[i] === 'u') { if (!/^[0-9a-fA-F]{4}$/.test(t.slice(i + 1, i + 5))) falha('\\u seguido de 4 dígitos hexadecimais'); i += 5 }
        else if (i < t.length && '"\\/bfnrt'.includes(t[i])) i++
        else falha('um escape válido (\\n, \\", \\\\…)')
      } else i++
    }
    if (i >= t.length) falha('"')
    i++
  }
  const valor = () => {
    espacos()
    const c = t[i]
    if (c === '{') {
      i++; espacos()
      if (t[i] === '}') { i++; return }
      for (;;) {
        espacos()
        if (t[i] !== '"') falha('o nome do campo entre aspas')
        texto(); espacos()
        if (t[i] !== ':') falha('":"')
        i++; valor(); espacos()
        if (t[i] === ',') { i++; continue }
        if (t[i] === '}') { i++; return }
        falha('"," ou "}"')
      }
    }
    if (c === '[') {
      i++; espacos()
      if (t[i] === ']') { i++; return }
      for (;;) {
        valor(); espacos()
        if (t[i] === ',') { i++; continue }
        if (t[i] === ']') { i++; return }
        falha('"," ou "]"')
      }
    }
    if (c === '"') return texto()
    if (c === 't') return literal('true')
    if (c === 'f') return literal('false')
    if (c === 'n') return literal('null')
    const num = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(t.slice(i))
    if (num) { i += num[0].length; return }
    falha('um valor')
  }
  try {
    valor(); espacos()
    if (i < t.length) falha('o fim do JSON')
  } catch (err) {
    if (err.pos === undefined) throw err
    return err
  }
  return { pos: t.length, fim: true, esperava: 'um JSON válido' }
}

export function interpretar(texto) {
  if (!String(texto ?? '').trim()) return { vazio: true }
  try {
    return { valor: JSON.parse(texto) }
  } catch {
    const { pos, fim, esperava } = localizarErro(texto)
    const mensagem = fim
      ? `O JSON terminou antes da hora — esperava ${esperava}`
      : `Caractere inesperado « ${texto[pos]} » — esperava ${esperava}`
    return { erro: { mensagem, posicao: pos, ...cursor(texto, pos) } }
  }
}

// ─── Colorir ──────────────────────────────────────────────────────────────────

// Classes por tipo de trecho; o padrão funciona no tema claro e no escuro.
export const CORES_JSON = {
  chave: 'text-sky-700 dark:text-sky-300',
  texto: 'text-emerald-700 dark:text-emerald-300',
  numero: 'text-amber-700 dark:text-amber-200',
  booleano: 'text-fuchsia-700 dark:text-fuchsia-300',
  nulo: 'italic text-slate-500 dark:text-slate-400',
}

// Escapa o HTML ANTES de colorir: o texto pode vir de uma API externa e não pode virar marcação.
export function colorirJson(texto, cores = CORES_JSON) {
  const seguro = String(texto ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return seguro.replace(
    /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    trecho => {
      const tipo = trecho.startsWith('"') ? (trecho.endsWith(':') ? 'chave' : 'texto')
        : trecho === 'true' || trecho === 'false' ? 'booleano'
        : trecho === 'null' ? 'nulo' : 'numero'
      return `<span class="${cores[tipo]}">${trecho}</span>`
    }
  )
}

// ─── Caminho ($.a[0].b)───────────────────────────────────────────────────────

export function caminhoFilho(pai, chave) {
  if (typeof chave === 'number') return `${pai}[${chave}]`
  return /^[\p{L}_$][\p{L}\p{N}_$]*$/u.test(chave) ? `${pai}.${chave}` : `${pai}[${JSON.stringify(chave)}]`
}

const ehObjeto = v => v !== null && typeof v === 'object' && !Array.isArray(v)

// ─── Estatísticas ─────────────────────────────────────────────────────────────

export function analisar(valor) {
  const s = { chaves: 0, objetos: 0, arrays: 0, textos: 0, numeros: 0, booleanos: 0, nulos: 0, profundidade: 0 }
  const visitar = (v, nivel) => {
    s.profundidade = Math.max(s.profundidade, nivel)
    if (v === null) s.nulos++
    else if (typeof v === 'string') s.textos++
    else if (typeof v === 'number') s.numeros++
    else if (typeof v === 'boolean') s.booleanos++
    else if (Array.isArray(v)) { s.arrays++; v.forEach(item => visitar(item, nivel + 1)) }
    else { s.objetos++; for (const k in v) { s.chaves++; visitar(v[k], nivel + 1) } }
  }
  visitar(valor, 0)
  return s
}

// ─── Comparar ─────────────────────────────────────────────────────────────────

export function comparar(a, b, caminho = '$', saida = []) {
  if (Object.is(a, b)) return saida
  const compostos = a !== null && typeof a === 'object' && b !== null && typeof b === 'object'
  if (!compostos || Array.isArray(a) !== Array.isArray(b)) {
    saida.push({ caminho, tipo: 'alterado', de: a, para: b })
    return saida
  }
  const lista = Array.isArray(a)
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const sub = caminhoFilho(caminho, lista ? Number(k) : k)
    if (!(k in a)) saida.push({ caminho: sub, tipo: 'adicionado', valor: b[k] })
    else if (!(k in b)) saida.push({ caminho: sub, tipo: 'removido', valor: a[k] })
    else comparar(a[k], b[k], sub, saida)
  }
  return saida
}

export function resumoValor(v, limite = 80) {
  if (v === undefined) return '—'
  const corta = s => (s.length > limite ? s.slice(0, limite) + '…' : s)
  if (typeof v === 'string') return `"${corta(v)}"`
  return corta(v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v))
}

// ─── Busca (sem acento e sem caixa) ───────────────────────────────────────────

export function buscar(valor, termo, limite = 500) {
  const t = normalizar(termo)
  const achados = []
  if (!t) return achados
  const visitar = (v, caminho) => {
    if (achados.length >= limite) return
    if (Array.isArray(v)) { v.forEach((item, i) => visitar(item, caminhoFilho(caminho, i))); return }
    if (ehObjeto(v)) {
      for (const [k, filho] of Object.entries(v)) {
        if (achados.length >= limite) return
        const sub = caminhoFilho(caminho, k)
        if (normalizar(k).includes(t)) achados.push({ caminho: sub, em: 'chave', chave: k, valor: filho })
        visitar(filho, sub)
      }
      return
    }
    if (normalizar(v === null ? 'null' : String(v)).includes(t)) achados.push({ caminho, em: 'valor', valor: v })
  }
  visitar(valor, '$')
  return achados
}

// ─── Tabela ───────────────────────────────────────────────────────────────────

// Array de objetos → colunas + linhas. Um objeto com um único array de objetos dentro
// (envelope tipo { content: [...], total }) usa esse array.
export function tabela(valor) {
  let origem = null
  let lista = valor
  if (ehObjeto(valor)) {
    const candidatos = Object.entries(valor).filter(([, v]) => Array.isArray(v) && v.some(ehObjeto))
    if (candidatos.length !== 1) return null
    ;[origem, lista] = candidatos[0]
  }
  if (!Array.isArray(lista)) return null
  const objetos = lista.filter(ehObjeto)
  if (!objetos.length) return null
  const linhas = objetos.map(o => achatar(o))
  const colunas = [...new Set(linhas.flatMap(o => Object.keys(o)))]
  return { colunas, linhas, ignorados: lista.length - objetos.length, origem }
}

// Objetos aninhados viram colunas com ponto (credito.id); arrays e objetos vazios ficam inteiros.
function achatar(obj, prefixo = '', saida = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const nome = prefixo ? `${prefixo}.${k}` : k
    if (ehObjeto(v) && Object.keys(v).length) achatar(v, nome, saida)
    else saida[nome] = v
  }
  return saida
}

const textoCelula = v => (v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v))

export function ordenarLinhas(linhas, coluna, direcao = 'asc') {
  const peso = v => (v === undefined ? 2 : v === null ? 1 : 0)
  return [...linhas].sort((x, y) => {
    const a = x[coluna], b = y[coluna]
    if (peso(a) || peso(b)) return peso(a) - peso(b)
    const cmp = typeof a === 'number' && typeof b === 'number'
      ? a - b
      : textoCelula(a).localeCompare(textoCelula(b), 'pt-BR', { numeric: true, sensitivity: 'base' })
    return direcao === 'asc' ? cmp : -cmp
  })
}

// Separador ; — abre direto no Excel em pt-BR
export function csvTabela(colunas, linhas) {
  const celula = v => {
    const t = v === undefined || v === null ? '' : textoCelula(v)
    return /[;"\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
  }
  return [colunas.map(celula).join(';'), ...linhas.map(l => colunas.map(c => celula(l[c])).join(';'))].join('\r\n')
}
