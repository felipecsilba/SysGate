// Fontes BFC (catálogo) e endpoints REST (Swagger) como nós do grafo.
// O nome BFC sai da mesma regra do Gerador do App (nomeBfc), para os dois nunca divergirem.
import { nomeBfc } from '../../../desktop/electron/catalogoFontes.js'

const letras = s => String(s).replace(/\{[^}]*\}/g, '').replace(/[^A-Za-z]/g, '').toLowerCase()
const humanizar = r => r.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase())

/** Um nó por nome BFC (o nome que o script usa), com as operações do catálogo dentro. */
export function nosDeFonte(catalogo, mapa) {
  const nos = new Map()
  for (const f of catalogo || []) {
    if (!f?.nome || !f.path) continue
    const b = nomeBfc(f, mapa)
    const id = `fonte:${b.bfc}`
    if (!nos.has(id)) nos.set(id, { id, tipo: 'fonte', rotulo: f.descricao || b.bfc, confirmado: false, usos: 0, operacoes: [] })
    const no = nos.get(id)
    no.confirmado ||= b.confirmado
    no.usos = Math.max(no.usos, b.usos || 0)
    no.operacoes.push({ operacao: f.operacao, path: f.path, natureza: String(f.natureza || '').toUpperCase() })
  }
  for (const no of nos.values()) no.operacoes.sort((a, b) => a.path.localeCompare(b.path) || a.operacao.localeCompare(b.operacao))
  return [...nos.values()].sort((a, b) => a.id.localeCompare(b.id))
}

/** Um nó por recurso de /api/<recurso>; rótulo e módulo vêm de extrairRecursos quando existem. */
export function nosDeEndpoint(swagger, recursos = {}) {
  const nos = new Map()
  for (const [p, ops] of Object.entries(swagger?.paths || {})) {
    const m = /^\/api\/([A-Za-z][A-Za-z0-9-]*)/.exec(p)
    if (!m) continue
    const r = m[1]
    if (!nos.has(r)) nos.set(r, new Set())
    for (const k of Object.keys(ops || {})) if (/^(get|post|put|patch|delete)$/i.test(k)) nos.get(r).add(k.toUpperCase())
  }
  return [...nos].map(([r, metodos]) => {
    const info = recursos[r] || {}
    const no = { id: `endpoint:${r}`, tipo: 'endpoint', rotulo: info.rotulo || humanizar(r), metodos: [...metodos].sort() }
    if (info.modulo) no.modulo = info.modulo
    return no
  }).sort((a, b) => a.id.localeCompare(b.id))
}

/** fonte → endpoint quando o 1º trecho do path da fonte tem as mesmas letras do recurso REST. */
export function arestasMapeia(nosFonte, nosEndpoint) {
  const porLetras = new Map(nosEndpoint.map(e => [letras(e.id.slice('endpoint:'.length)), e.id]))
  const arestas = new Map()
  for (const f of nosFonte) {
    for (const op of f.operacoes || []) {
      const seg = op.path.split('/').filter(Boolean)[0]
      const alvo = seg && porLetras.get(letras(seg))
      if (alvo) arestas.set(f.id + '>' + alvo, { de: f.id, tipo: 'mapeia', para: alvo, origem: 'inferida' })
    }
  }
  return [...arestas.values()].sort((a, b) => a.de.localeCompare(b.de) || a.para.localeCompare(b.para))
}
