// Envio em lote — regras puras. A API de migração Betha é ASSÍNCRONA:
// POST devolve só { idLote }; o resultado de cada item sai de GET {path}/{idLote}.
//   PROCESSADO           → tudo gravou
//   PROCESSADO_COM_ERRO  → parcial; retorno[] traz status ERRO + mensagem por idIntegracao
//   NAO_PROCESSADO       → AINDA NA FILA (pode levar mais de 1 h) — nunca tratar como erro
//   200 sem idLote       → envelope recusado ({ message }), nada enfileirado
import { normalizar } from './texto.js'

export function colunasSemCabecalho(n) {
  return Array.from({ length: n }, (_, i) => (i < 26 ? String.fromCharCode(65 + i) : `Col${i + 1}`))
}

// Pré-mapeia campo → coluna quando o nome (sem acento/caixa) é igual
export function autoMapear(campos, colunas) {
  const porNome = new Map(colunas.map(c => [normalizar(c), c]))
  const mapa = {}
  for (const c of campos) {
    const coluna = porNome.get(normalizar(c.rotulo))
    if (coluna) mapa[c.campo] = { modo: 'coluna', coluna }
  }
  return mapa
}

function converter(campo, texto) {
  if (campo.tipo === 'number' || campo.tipo === 'integer') {
    const n = Number(String(texto).trim())
    return Number.isNaN(n) ? texto : n
  }
  if (campo.tipo === 'boolean' && /^(true|false)$/i.test(texto)) return texto.toLowerCase() === 'true'
  return texto
}

// mapa: { [campo]: { modo: 'coluna', coluna } | { modo: 'fixo', valor } } — campo sem mapa não vai.
// idIntegracao é a única chave que liga um erro da Betha de volta à linha: sem mapa, vira RUNID-L<n>.
export function construirBodyLinha(campos, mapa, linha, numeroLinha, runId) {
  const body = {}
  for (const c of campos) {
    const m = mapa[c.campo]
    if (!m) continue
    const texto = m.modo === 'fixo' ? m.valor : linha[m.coluna]
    if (texto === undefined || texto === null || String(texto).trim() === '') continue
    const valor = c.envolverId ? { id: converter(c, texto) } : converter(c, texto)
    if (c.pai) (body[c.pai] ??= {})[c.rotulo] = valor
    else body[c.campo] = valor
  }
  if (campos.some(c => c.campo === 'idIntegracao') && !body.idIntegracao) body.idIntegracao = `${runId}-L${numeroLinha}`
  return body
}

export function dividirEmLotes(linhas, tamanho) {
  const lotes = []
  for (let i = 0; i < linhas.length; i += tamanho) {
    lotes.push({ indice: lotes.length, primeiraLinha: i + 1, linhas: linhas.slice(i, i + tamanho) })
  }
  return lotes
}

const resumoJson = d => (typeof d === 'string' ? d : JSON.stringify(d ?? '')).slice(0, 200)

// Resposta do POST do lote
export function interpretarEnvio(res) {
  const ok = res.statusCode >= 200 && res.statusCode < 300
  if (!ok) return { status: 'erro', mensagem: `HTTP ${res.statusCode} — ${resumoJson(res.data)}` }
  const idLote = res.data?.idLote
  if (!idLote) {
    const recado = res.data?.message || res.data?.mensagem || res.data?.error
    return { status: 'erro', mensagem: `Lote recusado — ${recado || `resposta sem idLote: ${resumoJson(res.data)}`}` }
  }
  return { status: 'fila', idLote: String(idLote), mensagem: `Lote ${idLote} na fila` }
}

// Resposta do GET {path}/{idLote}
export function interpretarStatusLote(dados) {
  const st = dados?.statusLote
  if (st !== 'PROCESSADO' && st !== 'PROCESSADO_COM_ERRO') {
    return { status: 'fila', mensagem: 'Ainda na fila da Betha (NAO_PROCESSADO não é erro — consulte de novo depois)', ids: [], erros: [] }
  }
  const itens = dados.retorno || []
  const ids = itens.map(it => it.idGerado?.id ?? it.idGerado).filter(v => v != null).map(String)
  const erros = itens.filter(it => it.status === 'ERRO').map(it => ({ idIntegracao: it.idIntegracao, mensagem: it.mensagem }))
  if (st === 'PROCESSADO' && !erros.length) return { status: 'ok', mensagem: `${itens.length} item(ns) gravado(s)`, ids, erros }
  return { status: 'parcial', mensagem: `${itens.length - erros.length} de ${itens.length} gravado(s) — ${erros.length} com erro`, ids, erros }
}

// Registro do Histórico → consulta do lote mais tarde (a tela de envio perde o idLote ao fechar).
// O path sai da URL gravada menos o urlBase do sistema; sem lote aceito, null.
export function consultaDoLote(r) {
  const idLote = r?.resposta?.idLote
  const urlBase = r?.sistema?.urlBase
  if (!idLote || !urlBase || !['POST', 'PUT', 'PATCH'].includes(r.metodo) || !(r.statusCode >= 200 && r.statusCode < 300)) return null
  const url = r.url.split('?')[0]
  if (!url.startsWith(urlBase)) return null
  return { idLote: String(idLote), path: `${url.slice(urlBase.length)}/${encodeURIComponent(idLote)}` }
}

// HTTP 429: a Betha bloqueia por alguns minutos depois de ~120 chamadas em poucos minutos e não manda Retry-After.
// Espera e repete a MESMA chamada — marcar erro e seguir só queima os lotes seguintes.
const ESPERAS_429_MS = [30000, 60000, 120000, 300000]
export function esperaApos429(tentativa) {
  return ESPERAS_429_MS[Math.min(tentativa, ESPERAS_429_MS.length - 1)]
}

export function linhaDoIdIntegracao(idIntegracao, runId) {
  const m = String(idIntegracao || '').match(new RegExp(`^${runId}-L(\\d+)$`))
  return m ? Number(m[1]) : null
}

const celula = v => {
  const t = String(v ?? '')
  return /[;"\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

// Planilha de resultado (separador ; — abre direto no Excel em pt-BR)
export function csvResultados(resultados) {
  const linhas = [['lote', 'itens', 'status', 'mensagem', 'id_lote', 'ids_gerados', 'erros']]
  for (const r of resultados) {
    linhas.push([
      r.indice + 1, r.itens, r.status, r.mensagem, r.idLote ?? '',
      (r.ids || []).join(','), (r.erros || []).map(e => `${e.idIntegracao}: ${e.mensagem}`).join(' | '),
    ])
  }
  return linhas.map(l => l.map(celula).join(';')).join('\r\n')
}
