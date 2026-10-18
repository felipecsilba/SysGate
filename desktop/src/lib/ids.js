// ID gerado numa resposta simples da Betha (para "Consultar resultado")
export function extrairId(dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return null
  for (const chave of ['id', 'idGerado', 'idEconomico', 'idLote']) {
    const v = dados[chave]
    if (v == null) continue
    if (typeof v === 'number' || typeof v === 'string') return String(v)
    if (typeof v === 'object' && v.id != null) return String(v.id)
  }
  return null
}
