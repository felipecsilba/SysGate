import { lerJsonl } from './arquivoFonte.js'

// Exclusão em cascata de imóveis — a partir do JSONL do Levantamento de vínculos
// (biblioteca/_BIBLIOTECA/Templates/Levantamento_Vinculos_Imoveis_BASE.txt).
// Só a receita VALIDADA entra no plano (biblioteca/_CONHECIMENTO/Imoveis/casos/Excluir imovel por API (migrado errado).md):
// proprietários → movimentações (o histórico sai junto) → reprocessar inscrição imobiliária → imóveis.

export const TAMANHO_LOTE = 50 // o PUT de inscrições aceita até 50; os DELETE seguem o mesmo tamanho

export const ETAPAS = [
  { chave: 'proprietarios', titulo: 'Excluir proprietários', metodo: 'DELETE', path: '/api/imoveisResponsaveis', recurso: 'imoveisResponsaveis', prefixo: 'RESP',
    ids: im => im.filhos?.proprietarios || [] },
  { chave: 'movimentacoes', titulo: 'Excluir movimentações', metodo: 'DELETE', path: '/api/imoveisMovimentacoes', recurso: 'imoveisMovimentacoes', prefixo: 'MOV',
    ids: im => im.filhos?.movimentacoes || [], nota: 'O histórico do imóvel sai junto.' },
  { chave: 'inscricao', titulo: 'Reprocessar inscrição imobiliária', metodo: 'PUT', path: '/api/imoveisMovimentacoesInscricoesImobiliarias',
    ids: im => ((im.filhos?.movimentacoesInscricao || []).length ? [im.idImovel] : []),
    nota: 'Remove a movimentação de inscrição (registro derivado). Responde 200 vazio, sem idLote: confirme rodando o levantamento de novo.' },
  { chave: 'imoveis', titulo: 'Excluir imóveis', metodo: 'DELETE', path: '/api/imoveis', recurso: 'imoveis', prefixo: 'IMOVEL',
    ids: im => [im.idImovel] },
]

const DEPENDENCIAS = [
  ['proprietarios', 'Proprietários (responsáveis)'],
  ['corresponsaveis', 'Corresponsáveis'],
  ['testadas', 'Testadas'],
  ['englobados', 'Englobados'],
  ['historico', 'Histórico de alterações'],
  ['movimentacoes', 'Movimentações do imóvel'],
  ['movimentacoesInscricao', 'Movimentações de inscrição imobiliária'],
  ['beneficiosFiscais', 'Benefícios fiscais'],
]
// Filhos cuja exclusão ainda não foi validada: imóvel com eles fica fora do plano
const NAO_VALIDADOS = [['corresponsaveis', 'corresponsáveis'], ['testadas', 'testadas'], ['englobados', 'englobados'], ['beneficiosFiscais', 'benefícios fiscais']]
const FINANCEIRO = [['debitos', 'débitos'], ['dividas', 'dívidas'], ['parcelamentos', 'parcelamentos'], ['lancamentos', 'lançamentos'], ['receitasDiversas', 'receitas diversas']]

const qtd = v => (Array.isArray(v) ? v.length : Number(v) || 0)

// JSONL do zip, ou colado do console do Studio (cada linha com "hh:mm:ss - " na frente)
export function lerLevantamento(texto) {
  const limpo = String(texto || '').split(/\r?\n/).map(l => l.replace(/^\s*\d{2}:\d{2}:\d{2}\s*-\s*/, '')).join('\n')
  const { registros, descartadas } = lerJsonl(limpo)
  const porId = new Map()
  let semId = 0
  for (const r of registros) {
    if (r.idImovel == null) { semId++; continue }
    porId.set(String(r.idImovel), r)
  }
  return { imoveis: [...porId.values()], descartadas: descartadas + semId }
}

export function analisar(imoveis) {
  const noPlano = []
  const comFinanceiro = []
  const inexistentes = []
  const revisar = []
  const contagem = Object.fromEntries(DEPENDENCIAS.map(([k]) => [k, { registros: 0, imoveis: 0 }]))

  for (const im of imoveis) {
    if (!im.existe) { inexistentes.push({ idImovel: im.idImovel, codigo: im.codigo ?? null }); continue }
    for (const [k] of DEPENDENCIAS) {
      const n = qtd(im.filhos?.[k])
      if (n) { contagem[k].registros += n; contagem[k].imoveis++ }
    }
    const fin = FINANCEIRO.filter(([k]) => Number(im.financeiro?.[k]) > 0)
    if (fin.length) { comFinanceiro.push({ idImovel: im.idImovel, codigo: im.codigo, motivo: fin.map(([k, r]) => `${r}: ${im.financeiro[k]}`).join(', ') }); continue }
    const pend = NAO_VALIDADOS.filter(([k]) => qtd(im.filhos?.[k]) > 0)
    if (pend.length) { revisar.push({ idImovel: im.idImovel, codigo: im.codigo, motivo: `${pend.map(([k, r]) => `${r}: ${qtd(im.filhos[k])}`).join(', ')} (exclusão ainda não validada)` }); continue }
    noPlano.push(im)
  }

  return {
    total: imoveis.length,
    noPlano,
    comFinanceiro,
    inexistentes,
    revisar,
    porDependencia: DEPENDENCIAS.map(([chave, rotulo]) => ({ chave, rotulo, ...contagem[chave] })),
  }
}

function corpo(etapa, id) {
  if (etapa.metodo === 'PUT') return { idImovel: id }
  return { idIntegracao: `EXCL-${etapa.prefixo}-${id}`, [etapa.recurso]: { idGerado: { id } } }
}

// Etapas com os lotes prontos. Lote vazio nunca é gerado (PUT de inscrições vazio reprocessa a entidade toda).
// tamanhoPut: lote do PUT de inscrições, separado — 43 PUTs de 50 seguidos deixaram a fila da Betha para trás.
export function montarPlano(imoveis, tamanho = TAMANHO_LOTE, tamanhoPut = tamanho) {
  return ETAPAS.map(etapa => {
    const itens = [...new Set(imoveis.flatMap(im => etapa.ids(im)).map(Number).filter(Boolean))]
    const porLote = Math.max(1, etapa.metodo === 'PUT' ? tamanhoPut : tamanho)
    const lotes = []
    for (let i = 0; i < itens.length; i += porLote) {
      const ids = itens.slice(i, i + porLote)
      if (ids.length) lotes.push({ indice: lotes.length + 1, ids, body: ids.map(id => corpo(etapa, id)) })
    }
    const { ids: _ids, ...resto } = etapa
    return { ...resto, itens, lotes }
  })
}

export function idDoIdIntegracao(idIntegracao) {
  const m = /^EXCL-[A-Z]+-(\d+)$/.exec(String(idIntegracao || ''))
  return m ? Number(m[1]) : null
}

// Marca o status de cada id do lote a partir do retorno interpretado (interpretarEnvio / interpretarStatusLote)
export function aplicarRetorno(estado, retorno, ids) {
  const novo = { ...estado }
  if (retorno.status === 'erro') {
    for (const id of ids) novo[id] = { ok: false, mensagem: retorno.mensagem }
    return novo
  }
  const erros = new Map((retorno.erros || []).map(e => [idDoIdIntegracao(e.idIntegracao), e.mensagem]))
  for (const id of ids) novo[id] = erros.has(id) ? { ok: false, mensagem: erros.get(id) } : { ok: true }
  return novo
}

// Entre uma rodada e outra: tira do plano quem o DELETE de imóveis já excluiu ("não encontrado" = já não existe).
// Quem deu "em uso" ou ainda não foi enviado fica — a próxima rodada manda o PUT só para eles, sem rodar o Levantamento.
const JA_EXCLUIDO = /n[ãa]o foi encontrado nenhum registro/i
const fora = (porId, id) => { const s = porId[id]; return !!s && (s.ok || JA_EXCLUIDO.test(s.mensagem || '')) }

export function faltamNoLote(ids, porId = {}) {
  return ids.filter(id => !fora(porId, id))
}

// Modo lote a lote: a Betha processa um PUT de inscrição por vez e descarta os que chegam no meio (visto em 2026-10-21:
// 4 rajadas, 1 lote valeu em cada). Então: PUT de um lote → DELETE dos mesmos imóveis até passar → próximo lote.
export function parearLotes(plano) {
  const insc = plano.find(e => e.chave === 'inscricao')
  const imv = plano.find(e => e.chave === 'imoveis')
  const delPorId = new Map(imv.lotes.flatMap(l => l.ids.map((id, k) => [id, l.body[k]])))
  return insc.lotes.map(l => ({ indice: l.indice, ids: l.ids, corpoPut: l.body, corpoDelete: l.ids.map(id => delPorId.get(id)).filter(Boolean) }))
}

export function semOsExcluidos(imoveis, porId = {}) {
  const restantes = imoveis.filter(im => !fora(porId, im.idImovel))
  return { restantes, removidos: imoveis.length - restantes.length }
}
