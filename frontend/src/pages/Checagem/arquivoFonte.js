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
    else if (ehEnum(v)) destino.push([c, v.valor, v.descricao])
    else destino.push([c, v])
  }
  return destino
}

const ehData = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)
const LIMITE_DISTINTOS = 50000 // teto de memória: acima disso só conta, não guarda o valor
const MAX_LISTADOS = 30        // até aqui a distribuição sai inteira
const MAX_FREQUENTES = 10      // acima, só os que mais se repetem

function novoAcumulador(campo) {
  return {
    campo, presentes: 0, preenchidos: 0, tipos: new Set(),
    valores: new Map(), descricoes: new Map(), estourou: false,
    num: null, data: null, anos: new Map(),
  }
}

function acumular(s, c, v, descricao) {
  s.presentes++
  if (vazioNoCampo(c, v)) return
  s.preenchidos++

  if (descricao !== undefined) s.tipos.add('enum')
  else if (typeof v === 'number') s.tipos.add('numero')
  else if (typeof v === 'boolean') s.tipos.add('booleano')
  else if (ehData(v)) s.tipos.add('data')
  else if (Array.isArray(v)) s.tipos.add('lista')
  else s.tipos.add('texto')

  if (typeof v === 'number') {
    if (!s.num) s.num = { min: v, max: v, soma: 0 }
    s.num.min = Math.min(s.num.min, v)
    s.num.max = Math.max(s.num.max, v)
    s.num.soma += v
  }
  if (ehData(v)) {
    const d = v.slice(0, 10)
    if (!s.data) s.data = { min: d, max: d }
    if (d < s.data.min) s.data.min = d
    if (d > s.data.max) s.data.max = d
    const ano = d.slice(0, 4)
    s.anos.set(ano, (s.anos.get(ano) || 0) + 1)
    return // data não entra na distribuição por valor: seria um valor por registro
  }

  const chave = Array.isArray(v) ? JSON.stringify(v) : String(v)
  if (s.valores.has(chave)) s.valores.set(chave, s.valores.get(chave) + 1)
  else if (s.valores.size < LIMITE_DISTINTOS) s.valores.set(chave, 1)
  else s.estourou = true
  if (descricao !== undefined && !s.descricoes.has(chave)) s.descricoes.set(chave, descricao)
}

/** Status do quadrado do campo: o que o usuário lê de relance. */
function statusCampo({ preenchidos, total, foraDoEnum }) {
  if (foraDoEnum > 0) return 'alerta'
  if (preenchidos === 0) return 'vazio'
  if (preenchidos < total) return 'parcial'
  return 'ok'
}

/**
 * campos: campos_retorno do catálogo ({ campo, tipo, eh_enum, descricao });
 * enums: mapa do catálogo { TipoX: { values: [{ key, description }] } }.
 *
 * Devolve o resumo (parciais, ausentes, fora do enum...) e `campos`: um item por
 * campo do arquivo, com status e a estatística que o painel de detalhe mostra.
 */
export function perfilCampos(registros, campos = [], enums = {}) {
  const stats = new Map()
  for (const r of registros) {
    for (const [c, v, descricao] of achatar(r, '', [])) {
      let s = stats.get(c)
      if (!s) { s = novoAcumulador(c); stats.set(c, s) }
      acumular(s, c, v, descricao)
    }
  }

  const total = registros.length
  const doCatalogo = new Map(campos.map((c) => [c.campo, c]))
  const noArquivo = [...stats.keys()]
  const temFilho = (c) => noArquivo.some((k) => k.startsWith(c + '.'))

  const detalhes = [...stats.values()].map((s) => {
    const cat = doCatalogo.get(s.campo)
    const aceitos = cat?.eh_enum ? (enums[cat.tipo]?.values || []) : []
    const validos = new Set(aceitos.map((v) => v.key))

    const ordenados = [...s.valores].sort((a, b) => b[1] - a[1])
    const listaCompleta = !s.estourou && s.valores.size <= MAX_LISTADOS
    // muitos valores (id, cpf, valor): a distribuição inteira não diz nada — só os que se repetem
    const listados = listaCompleta ? ordenados : ordenados.filter(([, q]) => q > 1).slice(0, MAX_FREQUENTES)
    const valores = listados.map(([valor, qtd]) => ({
      valor, qtd,
      descricao: s.descricoes.get(valor) || aceitos.find((a) => a.key === valor)?.description || null,
      foraDoEnum: validos.size > 0 && !validos.has(valor),
    }))
    const foraDoEnum = validos.size ? ordenados.filter(([v]) => !validos.has(v)) : []

    return {
      campo: s.campo,
      status: statusCampo({ preenchidos: s.preenchidos, total, foraDoEnum: foraDoEnum.length }),
      preenchidos: s.preenchidos,
      vazios: total - s.preenchidos,
      pct: total ? s.preenchidos / total : 0,
      tipo: s.tipos.size === 1 ? [...s.tipos][0] : (s.tipos.size ? 'misto' : null),
      descricao: cat?.descricao || null,
      tipoCatalogo: cat?.tipo || null,
      distintos: s.valores.size,
      muitos: s.estourou,
      // valores que aparecem em mais de um registro (num id, sinal de duplicidade)
      repetidos: ordenados.filter(([, q]) => q > 1).length,
      listaCompleta,
      valores,
      foraDoEnum: foraDoEnum.map(([valor, qtd]) => ({ valor, qtd })),
      enumAceitos: aceitos.map((a) => ({ key: a.key, descricao: a.description, presente: s.valores.has(a.key) })),
      num: s.num,
      data: s.data,
      anos: [...s.anos].sort((a, b) => b[0].localeCompare(a[0])).map(([ano, qtd]) => ({ ano, qtd })),
    }
  })

  const ausentes = campos.map((c) => c.campo).filter((c) => !stats.has(c) && !temFilho(c))
  const ORDEM = { alerta: 0, parcial: 1, ok: 2, vazio: 3 }

  return {
    total,
    campos: detalhes.sort((a, b) =>
      ORDEM[a.status] - ORDEM[b.status] || (a.status === 'parcial' ? a.pct - b.pct : 0) || a.campo.localeCompare(b.campo)),
    foraDoEnum: detalhes.filter((d) => d.foraDoEnum.length).map((d) => ({ campo: d.campo, tipo: d.tipoCatalogo, valores: d.foraDoEnum })),
    // a fonte devolve, mas não veio no arquivo (pai com filhos presentes não conta)
    ausentes,
    ausentesDetalhe: ausentes.map((c) => ({ campo: c, descricao: doCatalogo.get(c)?.descricao || null, tipoCatalogo: doCatalogo.get(c)?.tipo || null })),
    // veio no arquivo, mas o catálogo não conhece
    desconhecidos: campos.length ? noArquivo.filter((c) => !doCatalogo.has(c)) : [],
    parciais: detalhes.filter((d) => d.status === 'parcial' || (d.status === 'alerta' && d.vazios > 0 && d.preenchidos > 0))
      .sort((a, b) => a.pct - b.pct),
    sempreVazios: detalhes.filter((d) => d.preenchidos === 0).map((d) => d.campo).sort(),
    sempreCheios: detalhes.filter((d) => d.vazios === 0).length,
  }
}

// ── Concentração das falhas ──────────────────────────────────────────────────

/** Mesma identificação do motor (identificar() em regrasChecagem.js). */
export function idDoRegistro(r) {
  const id = CAMPOS_ID.map((c) => pegar(r, c)).find((v) => v !== undefined && v !== null && v !== '')
  return id === undefined ? null : String(id)
}

export function indexarPorId(registros) {
  const m = new Map()
  for (const r of registros) {
    const id = idDoRegistro(r)
    if (id !== null) m.set(id, r)
  }
  return m
}

// Dimensões que ajudam a decidir a correção: situação diz o que já virou
// dívida/pagamento, ano diz de que carga veio, crédito diz qual receita.
const DIMENSOES = [
  { rotulo: 'Situação', caminhos: ['situacao', 'situacaoDivida'] },
  { rotulo: 'Ano', caminhos: ['ano', 'anoInscricao'] },
  { rotulo: 'Crédito', caminhos: ['abreviaturaCredito', 'creditoTributario.abreviatura'] },
]

/** Agrupa os registros que falharam por situação, ano e crédito (só o que variar ou existir). */
export function concentracao(ids, porId, maxValores = 6) {
  const falhos = (ids || []).map((id) => porId.get(String(id))).filter(Boolean)
  if (falhos.length === 0) return []
  return DIMENSOES.map(({ rotulo, caminhos }) => {
    const cont = new Map()
    for (const r of falhos) {
      const bruto = caminhos.map((c) => pegar(r, c)).find((v) => v !== undefined && v !== null && v !== '')
      if (bruto === undefined) continue
      const v = String(ehEnum(bruto) ? bruto.valor : bruto)
      cont.set(v, (cont.get(v) || 0) + 1)
    }
    const valores = [...cont].sort((a, b) => b[1] - a[1]).map(([valor, qtd]) => ({ valor, qtd }))
    const resto = valores.slice(maxValores).reduce((s, v) => s + v.qtd, 0)
    return {
      rotulo,
      total: falhos.length,
      valores: resto ? [...valores.slice(0, maxValores), { valor: `outros (${valores.length - maxValores})`, qtd: resto }] : valores,
    }
  }).filter((d) => d.valores.length > 0)
}
