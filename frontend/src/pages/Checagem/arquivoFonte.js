// Leitura do .jsonl exportado da fonte, direto no navegador.
//
// O extrato real de débitos tem ~29 MB para 16 mil registros e /checagem/verificar
// aceita 1 MB. Em vez de abrir o limite, o navegador guarda de cada registro só
// os caminhos que as regras e o laudo usam e manda em lotes — o servidor recebe
// o mesmo JSONL de sempre, só que magro. O perfil de campos (preenchimento,
// enum fora do catálogo) roda aqui mesmo, sobre o arquivo inteiro.

const LIMITE_LOTE_BYTES = 700 * 1024 // folga sob o 1 MB do express.json

// Campos que identificam o registro no laudo (mesma lista de identificar() no motor).
const CAMPOS_ID = ['id', 'idDivida', 'idDebito', 'idIntegracao', 'codigo']

export function lerJsonl(texto) {
  const registros = []
  let descartadas = 0
  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.trim()
    if (!linha) continue
    try {
      const obj = JSON.parse(linha)
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) registros.push(obj)
      else descartadas++
    } catch {
      descartadas++ // última linha cortada pelo Studio, em geral
    }
  }
  return { registros, descartadas }
}

const pegar = (obj, caminho) =>
  String(caminho).split('.').reduce((a, k) => (a === null || a === undefined ? undefined : a[k]), obj)

function por(obj, caminho, valor) {
  const partes = caminho.split('.')
  let atual = obj
  partes.slice(0, -1).forEach((p) => {
    if (typeof atual[p] !== 'object' || atual[p] === null) atual[p] = {}
    atual = atual[p]
  })
  atual[partes[partes.length - 1]] = valor
}

/** Caminhos que precisam sobreviver ao corte: onde + quando das regras, contexto do laudo e ids. */
export function caminhosNecessarios(regras, contexto = []) {
  const s = new Set([...CAMPOS_ID, ...contexto])
  for (const r of regras || []) {
    ;(r.onde || []).forEach((c) => s.add(c))
    ;(r.quando?.caminhos || []).forEach((c) => s.add(c))
  }
  return [...s]
}

export function reduzir(registro, caminhos) {
  const magro = {}
  for (const c of caminhos) {
    const v = pegar(registro, c)
    if (v !== undefined) por(magro, c, v)
  }
  return magro
}

/** Divide em lotes de JSONL que cabem no limite do servidor. */
export function montarLotes(registros, caminhos, limite = LIMITE_LOTE_BYTES) {
  const lotes = []
  let linhas = []
  let bytes = 0
  for (const r of registros) {
    const linha = JSON.stringify(reduzir(r, caminhos))
    if (linhas.length && bytes + linha.length + 1 > limite) {
      lotes.push(linhas.join('\n'))
      linhas = []
      bytes = 0
    }
    linhas.push(linha)
    bytes += linha.length + 1
  }
  if (linhas.length) lotes.push(linhas.join('\n'))
  return lotes
}

/** Junta as respostas de /verificar de cada lote num laudo só. */
export function mesclarResultados(parciais, { registros, descartadas }) {
  const porId = new Map()
  for (const p of parciais) {
    for (const r of p.regras) {
      const acc = porId.get(r.regraId)
      if (!acc) { porId.set(r.regraId, { ...r, exemplos: [...r.exemplos], ids: [...r.ids] }); continue }
      acc.aplicaveis += r.aplicaveis
      acc.faltam += r.faltam
      acc.ids.push(...r.ids)
      if (acc.exemplos.length < 3) acc.exemplos.push(...r.exemplos.slice(0, 3 - acc.exemplos.length))
      // erro/alerta de qualquer lote vale para o todo
      if (r.severidade === 'erro' || r.severidade === 'alerta') acc.severidade = r.severidade
      else if (acc.severidade === 'na' && r.severidade === 'ok') acc.severidade = 'ok'
    }
  }
  const regras = [...porId.values()]
  return {
    entrada: { formato: 'arquivo jsonl', registros, descartadas },
    regras,
    notas: parciais[0]?.notas || [],
    resumo: {
      erros: regras.filter((r) => r.severidade === 'erro').length,
      alertas: regras.filter((r) => r.severidade === 'alerta').length,
      ok: regras.filter((r) => r.severidade === 'ok').length,
      naoSeAplicam: regras.filter((r) => r.severidade === 'na').length,
    },
  }
}

// ── Perfil de campos ─────────────────────────────────────────────────────────

const ehEnum = (v) =>
  v && typeof v === 'object' && !Array.isArray(v) && 'valor' in v &&
  Object.keys(v).every((k) => k === 'valor' || k === 'descricao')

// Zero só é ausência em campo de id/código: em valor monetário, 0 é dado real.
const zeroEhVazio = (caminho) => /(^|\.)(id|codigo)/i.test(caminho)

export function vazioNoCampo(caminho, v) {
  if (v === null || v === undefined || v === '') return true
  if (typeof v === 'string' && v.startsWith('1800-01-01')) return true // nulo de data na base convertida
  if ((v === 0 || v === '0') && zeroEhVazio(caminho)) return true
  if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return true
  return false
}

/** Achata em caminhos com ponto; enum {valor,descricao} e objeto vazio são folhas. */
function achatar(obj, prefixo, destino) {
  for (const [k, v] of Object.entries(obj)) {
    const c = prefixo ? `${prefixo}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v) && !ehEnum(v) && Object.keys(v).length > 0) achatar(v, c, destino)
    else destino.push([c, ehEnum(v) ? v.valor : v])
  }
  return destino
}

/**
 * campos: campos_retorno do catálogo ({ campo, tipo, eh_enum });
 * enums: mapa do catálogo { TipoX: { values: [{ key }] } }.
 */
export function perfilCampos(registros, campos = [], enums = {}) {
  const stats = new Map()
  for (const r of registros) {
    for (const [c, v] of achatar(r, '', [])) {
      let s = stats.get(c)
      if (!s) { s = { campo: c, presentes: 0, preenchidos: 0, valores: new Map() }; stats.set(c, s) }
      s.presentes++
      if (!vazioNoCampo(c, v)) s.preenchidos++
      if (typeof v === 'string' && s.valores.size <= 50) s.valores.set(v, (s.valores.get(v) || 0) + 1)
    }
  }

  const total = registros.length
  const doCatalogo = new Map(campos.map((c) => [c.campo, c]))
  const noArquivo = [...stats.keys()]
  const temFilho = (c) => noArquivo.some((k) => k.startsWith(c + '.'))

  // Valor de enum que o catálogo não conhece = divergência de verdade.
  const foraDoEnum = []
  for (const c of campos.filter((x) => x.eh_enum)) {
    const s = stats.get(c.campo)
    const validos = new Set((enums[c.tipo]?.values || []).map((v) => v.key))
    if (!s || validos.size === 0) continue
    const fora = [...s.valores].filter(([v]) => v && !validos.has(v))
    if (fora.length) foraDoEnum.push({ campo: c.campo, tipo: c.tipo, valores: fora.map(([valor, qtd]) => ({ valor, qtd })) })
  }

  const linhas = [...stats.values()].map((s) => ({
    campo: s.campo,
    preenchidos: s.preenchidos,
    vazios: total - s.preenchidos,
    pct: total ? s.preenchidos / total : 0,
  }))

  return {
    total,
    foraDoEnum,
    // a fonte devolve, mas não veio no arquivo (pai com filhos presentes não conta)
    ausentes: campos.map((c) => c.campo).filter((c) => !stats.has(c) && !temFilho(c)),
    // veio no arquivo, mas o catálogo não conhece
    desconhecidos: campos.length ? noArquivo.filter((c) => !doCatalogo.has(c)) : [],
    parciais: linhas.filter((l) => l.preenchidos > 0 && l.vazios > 0).sort((a, b) => a.pct - b.pct),
    sempreVazios: linhas.filter((l) => l.preenchidos === 0).map((l) => l.campo).sort(),
    sempreCheios: linhas.filter((l) => l.vazios === 0).length,
  }
}
