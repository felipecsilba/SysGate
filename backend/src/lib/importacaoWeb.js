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

function resumir({ sistemas, endpoints, municipios }) {
  const semSistema = endpoints.filter(e => e.sistemaId == null).length
  return {
    sistemas: sistemas.length,
    endpoints: endpoints.length - semSistema,
    endpointsSemSistema: semSistema,
    municipios: municipios.length,
    tokens: municipios.reduce((n, m) => n + (m.tokens?.length || 0), 0),
  }
}

module.exports = { normalizarNome, casarPorNome, prepararEndpoint, prepararTokens, resumir }
