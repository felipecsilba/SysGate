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

function resumir({ sistemas, endpoints, municipios, notas = [], conhecimento = [] }) {
  const semSistema = endpoints.filter(e => e.sistemaId == null).length
  return {
    sistemas: sistemas.length,
    endpoints: endpoints.length - semSistema,
    endpointsSemSistema: semSistema,
    municipios: municipios.length,
    tokens: municipios.reduce((n, m) => n + (m.tokens?.length || 0), 0),
    notas: notas.length,
    conhecimento: conhecimento.length,
  }
}

module.exports = {
  normalizarNome, casarPorNome, prepararEndpoint, prepararTokens, resumir,
  planejarPorChave, prepararNota, prepararConhecimento,
}
