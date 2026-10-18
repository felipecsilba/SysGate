// Metadados de uma spec OpenAPI 3 / Swagger 2 — usados ao salvar o histórico de importações.
function metadadosSpec(spec) {
  const versao = spec.openapi || spec.swagger || '?'
  const urlBase =
    spec.servers?.[0]?.url ||
    (spec.host ? `${spec.schemes?.[0] || 'https'}://${spec.host}${spec.basePath || ''}` : null)
  return { versao, urlBase, titulo: spec.info?.title ?? null }
}

module.exports = { metadadosSpec }
