import { contem } from './texto.js'

const ORDEM_METODO = { GET: 0, POST: 1, PUT: 2, PATCH: 3, DELETE: 4 }

// Endpoints agrupados por módulo (ordem alfabética), filtrados por busca sem acento.
export function agruparPorModulo(endpoints, busca) {
  const grupos = new Map()
  for (const ep of endpoints) {
    if (busca && ![ep.modulo, ep.nome, ep.path, ep.metodo].some(c => contem(c, busca))) continue
    const modulo = ep.modulo?.trim() || 'Sem módulo'
    if (!grupos.has(modulo)) grupos.set(modulo, [])
    grupos.get(modulo).push(ep)
  }
  return [...grupos]
    .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
    .map(([modulo, itens]) => ({
      modulo,
      itens: itens.sort((a, b) => a.path.localeCompare(b.path) || (ORDEM_METODO[a.metodo] ?? 9) - (ORDEM_METODO[b.metodo] ?? 9)),
    }))
}

// Busca do Sandbox: cada palavra do termo precisa casar (sem acento) com método, path, nome ou módulo.
// "dividas post" → só os POST de dívidas.
// Ordem por relevância: primeiro o que casa no path/módulo/método (paths curtos antes — /api/dividas
// antes de /api/dividasMovtosReceitas), depois o que só casa na descrição. Sem isso, endpoints que só
// citam "dívida" na descrição (SIMAM) enchiam o limite e o módulo dividas sumia.
export function buscarEndpoints(endpoints, termo, limite = 60) {
  const palavras = String(termo || '').split(/\s+/).filter(Boolean)
  if (!palavras.length) return endpoints.slice(0, limite)
  const fortes = []
  const fracos = []
  for (const ep of endpoints) {
    const principais = [ep.metodo, ep.path, ep.modulo]
    if (palavras.every(p => principais.some(c => contem(c, p)))) fortes.push(ep)
    else if (palavras.every(p => [...principais, ep.nome].some(c => contem(c, p)))) fracos.push(ep)
  }
  fortes.sort((a, b) => a.path.length - b.path.length || (ORDEM_METODO[a.metodo] ?? 9) - (ORDEM_METODO[b.metodo] ?? 9))
  return [...fortes, ...fracos].slice(0, limite)
}

// Recurso = path sem o {param} final: /api/dividas e /api/dividas/{id} são o mesmo recurso
// (o POST vai na coleção, o GET no /{id}) — o método se escolhe nos botões.
export function basePath(path) {
  return String(path || '').replace(/\/\{[^}]+\}$/, '')
}

// Seleção em dois níveis (como no web): módulo → recurso → método pelos botões.
export function modulosDe(endpoints, busca) {
  const paths = new Map()
  for (const ep of endpoints) {
    if (busca && !contem(ep.modulo, busca)) continue
    if (!paths.has(ep.modulo)) paths.set(ep.modulo, new Set())
    paths.get(ep.modulo).add(basePath(ep.path))
  }
  return [...paths]
    .map(([modulo, ps]) => ({ modulo, recursos: ps.size }))
    .sort((a, b) => a.modulo.localeCompare(b.modulo, 'pt-BR'))
}

// Recursos do módulo: um por basePath (curtos antes), com os métodos existentes em qualquer variante
export function recursosDoModulo(endpoints, modulo) {
  const porRecurso = new Map()
  for (const ep of endpoints) {
    if (ep.modulo !== modulo) continue
    const base = basePath(ep.path)
    if (!porRecurso.has(base)) porRecurso.set(base, [])
    porRecurso.get(base).push(ep)
  }
  return [...porRecurso]
    .map(([path, eps]) => ({
      path,
      endpoints: eps,
      metodos: [...new Set(eps.map(e => e.metodo))].sort((a, b) => (ORDEM_METODO[a] ?? 9) - (ORDEM_METODO[b] ?? 9)),
    }))
    .sort((a, b) => a.path.length - b.path.length || a.path.localeCompare(b.path))
}

export function metodoPadrao(metodos) {
  if (metodos.includes('POST')) return 'POST'
  return [...metodos].sort((a, b) => (ORDEM_METODO[a] ?? 9) - (ORDEM_METODO[b] ?? 9))[0]
}

// Os paths do Swagger Betha já começam com /api — URL base terminando em /api vira /api/api → 404.
export function avisoUrlBase(url) {
  if (!url || !/\/api\/?$/i.test(url.trim())) return null
  return 'A URL base termina em /api, mas os endpoints importados do Swagger já começam com /api — as chamadas iriam para /api/api e dariam 404. Remova o /api do final.'
}

// Nome legível do recurso — mesma regra do Krakion web (pages/Sandbox/utils.js):
// trecho depois de " - " no nome; senão o último segmento do path em palavras, sem o prefixo do módulo
export function nomeRecurso(ep, modulo = '') {
  const idx = ep.nome?.lastIndexOf(' - ') ?? -1
  if (idx !== -1) return ep.nome.slice(idx + 3)
  const partes = String(ep.path).split('/').filter(p => p && !p.startsWith('{'))
  if (!partes.length) return ep.nome
  const ultima = partes[partes.length - 1]
  const palavras = ultima.replace(/([A-Z])/g, ' $1').trim().split(/\s+/)
  const base = String(modulo).split(/[\s(]/)[0]
  if (base && palavras.length > 1 && palavras[0].toLowerCase() === base.toLowerCase()) palavras.shift()
  palavras[0] = palavras[0].charAt(0).toUpperCase() + palavras[0].slice(1)
  return palavras.join(' ')
}
