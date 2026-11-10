// Monta o grafo a partir do que já foi lido dos arquivos. Função pura: a leitura fica no grafo.mjs.
import { extrairRecursos, indexarDependentes } from '../../../desktop/electron/mapaDependencias.js'
import { fontesUsadas } from './codigo.mjs'
import { slug, lerConhecimento } from './biblioteca.mjs'
import { nosDeFonte, nosDeEndpoint, arestasMapeia } from './fontes.mjs'
import { areaDe } from './areas.mjs'

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
const chave = a => `${a.de}|${a.tipo}|${a.para}`

/**
 * entradas: { hash, templates: [{ no, codigo }], funcoes: [{ nome, arquivo, codigo }], tipos: [{ nome, arquivo }],
 *             conhecimentos: [{ rel, texto }], catalogo, mapaBfc, swagger, dependencias, curado }
 * → { versao, hash, nos, arestas, naoResolvidas }
 */
export function montarGrafo(e) {
  const curado = e.curado || {}
  const nos = new Map()
  const arestas = new Map()
  const naoResolvidas = []
  const addNo = no => nos.set(no.id, no)
  const addAresta = a => arestas.set(chave(a), a)

  for (const a of curado.areas || []) addNo({ id: a.id, tipo: 'area', rotulo: a.nome })
  for (const t of e.templates || []) addNo(t.no)
  for (const f of e.funcoes || []) addNo({ id: `funcao:${slug(f.nome)}`, tipo: 'funcao', rotulo: f.nome, arquivo: f.arquivo })
  for (const t of e.tipos || []) addNo({ id: `tipo-formula:${t.nome}`, tipo: 'tipo-formula', rotulo: t.nome, arquivo: t.arquivo })

  const fontes = nosDeFonte(e.catalogo, e.mapaBfc)
  fontes.forEach(addNo)
  const recursos = extrairRecursos(e.swagger || {})
  const endpoints = nosDeEndpoint(e.swagger, recursos)
  endpoints.forEach(addNo)

  // Fonte citada → nó existente (sem caixa), tentando a cadeia inteira e depois os prefixos.
  const fontePorChave = new Map(fontes.map(f => [f.id.toLowerCase(), f.id]))
  const resolverFonte = ({ sistema, cadeia }) => {
    if (sistema !== 'tributos') return `fonte:${sistema}/${cadeia}`
    const partes = cadeia.split('.')
    for (let k = partes.length; k > 0; k--) {
      const id = fontePorChave.get(`fonte:${partes.slice(0, k).join('.')}`.toLowerCase())
      if (id) return id
    }
    return null
  }

  // usa-fonte: template/função → fonte (fonte fora do catálogo vira nó marcado)
  const usos = [
    ...(e.templates || []).map(t => ({ de: t.no.id, codigo: t.codigo })),
    ...(e.funcoes || []).map(f => ({ de: `funcao:${slug(f.nome)}`, codigo: f.codigo })),
  ]
  for (const u of usos) {
    for (const f of fontesUsadas(u.codigo)) {
      let para = resolverFonte(f)
      if (!para) {
        para = `fonte:${f.cadeia}`
        if (!nos.has(para)) addNo({ id: para, tipo: 'fonte', rotulo: f.cadeia, status: 'fora-do-catalogo' })
      } else if (!nos.has(para)) {
        addNo({ id: para, tipo: 'fonte', rotulo: f.cadeia, status: 'fora-do-catalogo' })
      }
      addAresta({ de: u.de, tipo: 'usa-fonte', para, origem: 'inferida' })
    }
  }

  // mapeia: fonte → endpoint
  arestasMapeia(fontes, endpoints).forEach(addAresta)

  // depende: endpoint → endpoint (inferida pelo id<Recurso>; curada pelos pais confirmados)
  for (const [alvo, lista] of Object.entries(indexarDependentes(recursos))) {
    for (const d of lista) addAresta({ de: `endpoint:${d.recurso}`, tipo: 'depende', para: `endpoint:${alvo}`, origem: 'inferida', via: d.campo })
  }
  for (const [recurso, c] of Object.entries(e.dependencias?.recursos || {})) {
    for (const pai of c.pais || []) addAresta({ de: `endpoint:${recurso}`, tipo: 'depende', para: `endpoint:${pai.recurso}`, origem: 'curada', via: pai.campo })
  }

  // documenta: conhecimento → o que o texto cita
  const conhecidos = {
    templates: (e.templates || []).map(t => t.no.id.slice('template:'.length)),
    tipos: (e.tipos || []).map(t => t.nome),
  }
  for (const k of e.conhecimentos || []) {
    const { no, refs } = lerConhecimento(k.rel, k.texto, conhecidos)
    addNo(no)
    for (const ref of refs) {
      const para = ref.startsWith('fonte:') && !ref.includes('/') ? resolverFonte({ sistema: 'tributos', cadeia: ref.slice(6) }) : ref
      if (para && nos.has(para)) addAresta({ de: no.id, tipo: 'documenta', para, origem: 'inferida' })
      else naoResolvidas.push({ de: no.id, ref })
    }
  }

  // pertence: qualquer peça → área
  const areas = curado.areas || []
  for (const no of nos.values()) {
    if (no.tipo === 'area') continue
    for (const area of areaDe(no, areas)) addAresta({ de: no.id, tipo: 'pertence', para: area, origem: 'inferida' })
  }

  // curado por último: acrescenta (vence a inferida), remove e anota
  for (const a of curado.arestas || []) {
    const nova = { de: a.de, tipo: a.tipo, para: a.para, origem: 'curada' }
    if (a.via) nova.via = a.via
    if (a.nota) nova.nota = a.nota
    addAresta(nova)
  }
  for (const a of curado.remover || []) arestas.delete(chave(a))
  for (const [id, notas] of Object.entries(curado.notas || {})) if (nos.has(id)) nos.get(id).notas = notas

  return {
    versao: 1,
    hash: e.hash,
    nos: [...nos.values()].sort((a, b) => cmp(a.id, b.id)),
    arestas: [...arestas.values()].sort((a, b) => cmp(a.de, b.de) || cmp(a.tipo, b.tipo) || cmp(a.para, b.para)),
    naoResolvidas: naoResolvidas.sort((a, b) => cmp(a.de, b.de) || cmp(a.ref, b.ref)),
  }
}
