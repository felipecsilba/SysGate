// Monta o índice do corpus (peças de produção) ligado ao grafo curado. Função pura.
import { lerNomeFormula, lerNomeScript, familia, trechos, jaccard, municipioDe } from './corpus.mjs'
import { fontesUsadas } from './codigo.mjs'
import { slug } from './biblioteca.mjs'
import { areaDe } from './areas.mjs'

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

/**
 * entradas: { hash, limiar, areas, templates: [{ id, codigo }],
 *             pecas: [{ raiz: Formulas|Scripts|Relatorios, pasta, nome, codigo, info? }] }
 * grafo: o grafo curado (para resolver fontes, tipos de fórmula e templates)
 */
export function montarCorpus(e, grafo) {
  const nos = new Map(), arestas = []
  const addNo = n => { if (!nos.has(n.id)) nos.set(n.id, n) }
  const aresta = (de, tipo, para, via) => arestas.push(via ? { de, tipo, para, origem: 'inferida', via } : { de, tipo, para, origem: 'inferida' })

  const idsGrafo = new Set(grafo.nos.map(n => n.id))
  const fontes = new Map(grafo.nos.filter(n => n.tipo === 'fonte').map(n => [n.id.toLowerCase(), n.id]))
  const tiposDic = grafo.nos.filter(n => n.tipo === 'tipo-formula').map(n => n.id.slice('tipo-formula:'.length)).sort((a, b) => b.length - a.length)
  const tplTrechos = (e.templates || []).map(t => ({ id: t.id, s: trechos(t.codigo) })).filter(t => t.s.size)
  const limiar = e.limiar ?? 0.4

  const resolverFonte = ({ sistema, cadeia }) => {
    if (sistema !== 'tributos') return idsGrafo.has(`fonte:${sistema}/${cadeia}`) ? `fonte:${sistema}/${cadeia}` : null
    const p = cadeia.split('.')
    for (let k = p.length; k > 0; k--) {
      const id = fontes.get(`fonte:${p.slice(0, k).join('.')}`.toLowerCase())
      if (id) return id
    }
    return null
  }

  for (const p of e.pecas || []) {
    let info, rel, arquivo
    if (p.raiz === 'Formulas') {
      const f = lerNomeFormula(p.nome)
      rel = `Formulas/${p.pasta}/${p.nome.replace(/\.[^.]+$/, '')}`
      arquivo = `Formulas/${p.pasta}/${p.nome}`
      info = { subtipo: 'formula', municipio: f.municipio, especializacao: p.pasta, tipoFormula: f.tipoFormula, ano: f.ano,
        rotulo: (f.descricao || p.nome) + (f.ano ? ` (${f.ano})` : '') }
    } else if (p.raiz === 'Scripts') {
      const s = lerNomeScript(p.pasta, p.nome)
      rel = `Scripts/${p.pasta}/${p.nome.replace(/\.[^.]+$/, '')}`
      arquivo = `Scripts/${p.pasta}/${p.nome}`
      info = { subtipo: s.subtipo, municipio: s.municipio, rotulo: s.titulo, cadastro: s.cadastro, evento: s.evento }
    } else {
      const i = p.pasta.indexOf(' - ')
      rel = `Relatorios/${p.pasta}`
      arquivo = `Relatorios/${p.pasta}/${p.nome}`
      info = { subtipo: 'relatorio', municipio: i < 0 ? null : p.pasta.slice(0, i), rotulo: p.info?.titulo || (i < 0 ? p.pasta : p.pasta.slice(i + 3)),
        chaveNatureza: p.info?.chaveNatureza || null }
    }
    // nomes que só diferem em caixa/pontuação viram o mesmo slug: sufixo ~2, ~3… na ordem de leitura
    let id = `peca:${slug(rel)}`
    for (let k = 2; nos.has(id); k++) id = `peca:${slug(rel)}~${k}`
    const no = { id, tipo: 'peca', subtipo: info.subtipo, rotulo: info.rotulo, municipio: info.municipio, arquivo }
    for (const k of ['especializacao', 'tipoFormula', 'ano', 'cadastro', 'evento', 'chaveNatureza']) if (info[k]) no[k] = info[k]
    no.familia = familia(p.codigo)
    addNo(no)

    if (info.municipio) {
      const m = municipioDe(info.municipio)
      addNo(m)
      aresta(no.id, 'de-municipio', m.id)
    }
    if (info.tipoFormula) {
      const dic = tiposDic.find(t => info.tipoFormula === t || info.tipoFormula.startsWith(t + '_'))
      const alvo = `tipo-formula:${dic || info.tipoFormula}`
      if (!dic) addNo({ id: alvo, tipo: 'tipo-formula', rotulo: info.tipoFormula, status: 'sem-dicionario' })
      aresta(no.id, 'tipo', alvo)
    }
    const usadas = new Set()
    for (const f of fontesUsadas(p.codigo)) { const id = resolverFonte(f); if (id) usadas.add(id) }
    for (const id of [...usadas].sort()) aresta(no.id, 'usa-fonte', id)
    const texto = [info.rotulo, info.especializacao, info.tipoFormula, info.cadastro, info.chaveNatureza].filter(Boolean).join(' ')
    for (const a of areaDe({ id: 'peca:', rotulo: texto }, e.areas || [])) aresta(no.id, 'pertence', a)
    if (tplTrechos.length && p.raiz !== 'Formulas') {
      const s = trechos(p.codigo)
      for (const t of tplTrechos) {
        const j = jaccard(s, t.s)
        if (j >= limiar) aresta(no.id, 'variante-de', t.id, `semelhança ${j.toFixed(2).replace('.', ',')}`)
      }
    }
  }

  // famílias: quantas peças e quantos municípios têm exatamente o mesmo código
  const fam = new Map()
  for (const n of nos.values()) if (n.tipo === 'peca') {
    if (!fam.has(n.familia)) fam.set(n.familia, { qtd: 0, munis: new Set() })
    const f = fam.get(n.familia); f.qtd++; if (n.municipio) f.munis.add(n.municipio)
  }
  for (const n of nos.values()) if (n.tipo === 'peca') { const f = fam.get(n.familia); n.qtdFamilia = f.qtd; n.qtdMunicipiosFamilia = f.munis.size }

  return {
    versao: 1,
    hash: e.hash,
    nos: [...nos.values()].sort((a, b) => cmp(a.id, b.id)),
    arestas: arestas.sort((a, b) => cmp(a.de, b.de) || cmp(a.tipo, b.tipo) || cmp(a.para, b.para)),
  }
}
