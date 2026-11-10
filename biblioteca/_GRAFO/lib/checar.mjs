// Problemas do grafo que viram pendência de curadoria. Só aponta: nada é corrigido aqui.

export function checar(grafo, curado = {}) {
  const ids = new Set(grafo.nos.map(n => n.id))
  const avisos = []
  const add = (tipo, id, msg) => avisos.push({ tipo, id, msg })

  for (const a of grafo.arestas) {
    if (!ids.has(a.de) || !ids.has(a.para)) add('aresta-orfa', `${a.de} → ${a.para}`, `aresta ${a.tipo} aponta para nó que não existe`)
  }
  for (const n of grafo.nos) {
    if (n.tipo === 'template' && n.status === 'sem-registro') add('template-sem-registro', n.id, 'sem README, ou o README não diz se foi validado no Studio')
    if (n.tipo === 'template' && n.status === 'nao-validado') add('template-nao-validado', n.id, 'o README diz que ainda não foi validado no Studio')
    if (n.tipo === 'fonte' && n.status === 'fora-do-catalogo') add('fonte-fora-do-catalogo', n.id, 'usada em código, mas não está no catalogo_v2.json — conferir o nome no editor')
  }
  const porOrigem = new Map()
  for (const r of grafo.naoResolvidas || []) porOrigem.set(r.de, [...(porOrigem.get(r.de) || []), r.ref])
  for (const [de, refs] of porOrigem) add('citacao-sem-no', de, `cita o que o grafo não tem: ${refs.join(', ')}`)

  const citados = [
    ...(curado.arestas || []).flatMap(a => [a.de, a.para]),
    ...(curado.remover || []).flatMap(a => [a.de, a.para]),
    ...Object.keys(curado.notas || {}),
  ]
  for (const id of new Set(citados)) if (!ids.has(id)) add('curado-id-inexistente', id, 'o curado.json cita um id que o grafo não tem')

  return avisos.sort((a, b) => (a.tipo + a.id < b.tipo + b.id ? -1 : 1))
}
