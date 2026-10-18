// Regras puras da importação "Krakion web → Krakion Desktop".
// Reimportar não duplica: sistema e município casam por nome normalizado,
// endpoints de cada sistema são substituídos e tokens fazem upsert por município × sistema.

function normalizarNome(nome) {
  return String(nome ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
}

// [{ remoto, localId|null }] — localId null = registro novo
function casarPorNome(remotos, locais) {
  const porNome = new Map(locais.map(l => [normalizarNome(l.nome), l.id]))
  return remotos.map(remoto => ({ remoto, localId: porNome.get(normalizarNome(remoto.nome)) ?? null }))
}

// Endpoint como a API devolve (bodySchema já parseado) → dados para o Prisma local
function prepararEndpoint(ep, sistemaId) {
  const schema = Array.isArray(ep.bodySchema) && ep.bodySchema.length ? JSON.stringify(ep.bodySchema) : null
  return {
    modulo: ep.modulo,
    nome: ep.nome,
    path: ep.path,
    metodo: ep.metodo,
    descricao: ep.descricao ?? null,
    bodySchema: schema,
    sistemaId,
  }
}

// Tokens dos municípios remotos com ids traduzidos para os locais.
// Token de sistema que não existe localmente é ignorado (e contado).
function prepararTokens(municipiosRemotos, mapaSistemas, mapaMunicipios) {
  const tokens = []
  let ignorados = 0
  for (const m of municipiosRemotos) {
    const municipioId = mapaMunicipios.get(m.id)
    for (const t of m.tokens || []) {
      const sistemaId = mapaSistemas.get(t.sistemaId)
      if (!municipioId || !sistemaId) { ignorados++; continue }
      tokens.push({
        municipioId,
        sistemaId,
        token: t.token,
        dataVencimento: t.dataVencimento ? new Date(t.dataVencimento) : null,
      })
    }
  }
  return { tokens, ignorados }
}

// Notas e conhecimento não têm nome único: o par título + data de criação identifica o registro
// (a importação grava a criadoEm da VPS, então reimportar acha o mesmo registro).
const chave = r => `${normalizarNome(r.titulo)}|${new Date(r.criadoEm).toISOString()}`

// [{ remoto, localId, acao }] — 'criar' | 'atualizar' (VPS mais nova) | 'manter' (local editado depois)
function planejarPorChave(remotos, locais) {
  const porChave = new Map(locais.map(l => [chave(l), l]))
  return remotos.map(remoto => {
    const local = porChave.get(chave(remoto))
    if (!local) return { remoto, localId: null, acao: 'criar' }
    const maisNova = new Date(remoto.atualizadoEm) > new Date(local.atualizadoEm)
    return { remoto, localId: local.id, acao: maisNova ? 'atualizar' : 'manter' }
  })
}

const datas = r => ({ criadoEm: new Date(r.criadoEm), atualizadoEm: new Date(r.atualizadoEm) })

// Nota como a API devolve (itens/etiquetas já parseados) → dados do Prisma, com o dono local
function prepararNota(n, usuarioId) {
  return {
    titulo: n.titulo, tipo: n.tipo, conteudo: n.conteudo ?? '',
    itens: JSON.stringify(n.itens || []), cor: n.cor, fixada: !!n.fixada, ordem: n.ordem ?? 0,
    etiquetas: JSON.stringify(n.etiquetas || []), usuarioId, ...datas(n),
  }
}

function prepararConhecimento(c, autorId) {
  return {
    titulo: c.titulo, tipo: c.tipo, descricao: c.descricao ?? null, conteudo: c.conteudo ?? '',
    passos: JSON.stringify(c.passos || []), vertical: c.vertical ?? null, sistema: c.sistema ?? null,
    etiquetas: JSON.stringify(c.etiquetas || []), autorId, ...datas(c),
  }
}

// ─── Checagem (regras, notas, catálogo de fontes, campos marcados) ──────────────
// Nada é apagado: cada registro casa por uma chave natural e é atualizado com o da VPS.

const chaveRegra = r => [r.frente, r.cadastro, normalizarNome(r.nome)].join('|')
const chaveNotaChecagem = n => [n.path, n.tipo, normalizarNome(n.texto)].join('|')

// Regra como a rota devolve (onde/quando parseados) → dados do Prisma
function prepararRegra(r, sistemaId) {
  return {
    sistemaId, frente: r.frente, cadastro: r.cadastro, nome: r.nome, porque: r.porque,
    onde: JSON.stringify(r.onde || []), quando: r.quando ? JSON.stringify(r.quando) : null,
    esperado: r.esperado ?? null, naoSabemos: r.naoSabemos ?? null, comoCorrigir: r.comoCorrigir ?? null,
    severidade: r.severidade || 'erro', ordem: r.ordem ?? 0,
  }
}

function prepararNotaChecagem(n, sistemaId) {
  return { sistemaId, path: n.path, tipo: n.tipo, texto: n.texto, ordem: n.ordem ?? 0 }
}

// Detalhe de /fontes/:id → linha de FonteDados. A rota anexa `valores` aos filtros de enum; não faz parte do catálogo.
// Só fontes de leitura existem no catálogo (a importação do catalogo_v2.json filtra).
function prepararFonte(d, sistemaId) {
  return {
    sistemaId, nome: d.nome, path: d.path, operacao: d.operacao || 'busca', verbo: 'GET', natureza: 'LEITURA',
    descricao: d.descricao ?? null, descricaoOp: d.descricaoOp ?? null, tipoRetorno: d.tipoRetorno ?? null,
    filtros: JSON.stringify((d.filtros || []).map(({ valores, ...f }) => f)),
    campos: JSON.stringify(d.campos || []), enums: JSON.stringify(d.enums || {}),
  }
}

// Resposta de /campos (spec + marcações mescladas) → só as marcações feitas à mão
function camposMarcados(resp, path, sistemaId) {
  return (resp?.campos || []).filter(c => c.marcado).map(c => ({
    sistemaId, path, campo: c.caminho, obrigatorio: !!c.obrigatorio, observacao: c.observacao?.trim() || null,
  }))
}

function resumir({ sistemas, endpoints, municipios, notas = [], conhecimento = [], checagem = [] }) {
  const semSistema = endpoints.filter(e => e.sistemaId == null).length
  const soma = campo => checagem.reduce((n, c) => n + (c[campo]?.length || 0), 0)
  return {
    sistemas: sistemas.length,
    endpoints: endpoints.length - semSistema,
    endpointsSemSistema: semSistema,
    municipios: municipios.length,
    tokens: municipios.reduce((n, m) => n + (m.tokens?.length || 0), 0),
    notas: notas.length,
    conhecimento: conhecimento.length,
    regras: soma('regras'),
    notasChecagem: soma('notas'),
    fontes: soma('fontes'),
  }
}

module.exports = {
  normalizarNome, casarPorNome, prepararEndpoint, prepararTokens, resumir,
  planejarPorChave, prepararNota, prepararConhecimento,
  chaveRegra, chaveNotaChecagem, prepararRegra, prepararNotaChecagem, prepararFonte, camposMarcados,
}
