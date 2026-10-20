// Mapa de dependências — quem depende de quem na API Betha (Service Layer Tributos), como excluir cada dependente
// (endpoints) e como descobri-lo (fonte BFC).
//
// Duas camadas:
//  - INFERIDA: um recurso depende de outro quando o POST dele tem um campo id<Outro> (idImovel, idImoveis,
//    idImoveisMovimentacoes…). A fonte BFC sai do catálogo casando o nome do recurso com o path da fonte.
//  - CURADA (biblioteca/FontesDeDados/dependencias_confirmadas.json): o que a prática confirmou. Sempre vence,
//    acrescenta arestas que a inferência não vê (histórico liga por "entityId") e traz as notas.
// Funções puras — a leitura dos arquivos fica no main (carregarMapa).

import fs from 'node:fs'
import path from 'node:path'

const ORDEM_CATEGORIA = { cadastro: 0, financeiro: 1, documentos: 2, outros: 3 }

function resolver(schema, componentes, profundidade = 0) {
  let s = schema
  while (s && s.$ref && profundidade < 10) {
    s = componentes[s.$ref.split('/').pop()]
    profundidade++
  }
  return s || {}
}

// Corpo do Service Layer: array de { idIntegracao, <recurso>: {...} } → [chave do recurso, propriedades]
function corpoDaOperacao(op, componentes) {
  const raiz = resolver(op?.requestBody?.content?.['application/json']?.schema, componentes)
  const item = resolver(raiz.items || raiz, componentes)
  const chave = Object.keys(item.properties || {}).find(k => k !== 'idIntegracao')
  if (!chave) return null
  return { chave, propriedades: resolver(item.properties[chave], componentes).properties || {} }
}

const ROTULO = /(?:registros? de|processamento de)\s+(.+?)\.?\s*$/i

export function extrairRecursos(swagger) {
  const componentes = swagger.components?.schemas || {}
  const tags = Object.fromEntries((swagger.tags || []).map(t => [t.name, {
    localizacao: String(t.description || '').replace(/^Localização:\s*/i, '').trim() || null,
    ajuda: t.externalDocs?.url || null,
  }]))
  const recursos = {}
  for (const [p, ops] of Object.entries(swagger.paths || {})) {
    const m = /^\/api\/([A-Za-z]+)$/.exec(p)
    if (!m || !(ops.post || ops.delete)) continue
    const recurso = m[1]
    const corpo = corpoDaOperacao(ops.post || ops.put, componentes)
    const corpoDel = ops.delete ? corpoDaOperacao(ops.delete, componentes) : null
    const resumo = (ops.delete || ops.post || ops.put)?.summary || ''
    const tag = Object.values(ops).find(o => o?.tags?.length)?.tags[0] || null
    let corpoDelete = null
    if (corpoDel) {
      const idGerado = resolver(corpoDel.propriedades.idGerado, componentes).properties || { id: {} }
      corpoDelete = [{ idIntegracao: 'EXCLUIR-1', [corpoDel.chave]: { idGerado: Object.fromEntries(Object.keys(idGerado).map(k => [k, 0])) } }]
    }
    recursos[recurso] = {
      campos: corpo ? Object.keys(corpo.propriedades) : [],
      metodos: Object.keys(ops).map(k => k.toUpperCase()).sort(),
      rotulo: ROTULO.exec(resumo)?.[1]?.trim() || null,
      modulo: tag ? (/\(([^)]+)\)/.exec(tag)?.[1] || tag) : null,
      localizacao: tags[tag]?.localizacao || null,
      ajuda: tags[tag]?.ajuda || null,
      corpoDelete,
    }
  }
  return recursos
}

// id<Recurso> → nome do recurso (singular, plural, composto). Sem correspondência → null.
export function alvoDoCampo(campo, nomes) {
  const m = /^id([A-Z]\w*)$/.exec(campo)
  if (!m) return null
  const base = m[1][0].toLowerCase() + m[1].slice(1)
  const candidatos = [base, `${base}s`, base.replace(/l$/, 'is'), base.replace(/m$/, 'ns'), base.replace(/ao$/, 'oes'), base.replace(/r$/, 'res')]
  return candidatos.find(c => nomes.has(c)) || null
}

export function indexarDependentes(recursos) {
  const nomes = new Set(Object.keys(recursos))
  const dep = {}
  for (const [recurso, info] of Object.entries(recursos)) {
    for (const campo of info.campos) {
      const alvo = alvoDoCampo(campo, nomes)
      if (!alvo || alvo === recurso) continue
      dep[alvo] ??= []
      if (!dep[alvo].some(d => d.recurso === recurso)) dep[alvo].push({ recurso, campo })
    }
  }
  return dep
}

const FINANCEIRO = /divid|debit|guia|lancament|pagament|parcelament|receita|credit|compens|anisti|remiss|notifica|estorno|deduc|encerrament|integracoesContab|manutCalc|errosCalc|saldo|esfinge|baixa|arrecad|termosParc|acord/i
const DOCUMENTOS = /certid|documento|alvara|declarac|notaFiscal|notasFiscais/i

export function categoria(recurso) {
  if (FINANCEIRO.test(recurso)) return 'financeiro'
  if (DOCUMENTOS.test(recurso)) return 'documentos'
  return 'cadastro'
}

const letras = s => String(s).replace(/\{[^}]*\}/g, '').replace(/[^A-Za-z]/g, '').toLowerCase()
const singular = s => s.replace(/oes$/, 'ao').replace(/is$/, 'l').replace(/s$/, '')

// Fonte BFC que encontra os registros do recurso: path da fonte (sem {params}) com as mesmas letras do recurso.
// Diz se filtra pelo campo de ligação (criterio) ou se exige o id do pai como parâmetro.
export function fonteDoRecurso(recurso, campo, catalogo, mapaBfc) {
  const alvo = letras(recurso)
  const porOp = mapaBfc?.por_operacao || {}
  const candidatos = (catalogo || [])
    .filter(f => String(f.natureza || '').toUpperCase() === 'LEITURA' && letras(f.path) === alvo)
    .map(f => ({ f, bfc: porOp[`${f.nome}|${f.operacao}|${f.path}`]?.bfc }))
    .filter(c => c.bfc)
  if (!candidatos.length) return null

  // nomes possíveis do filtro de ligação: idImoveis → idImovel, imovel.id
  const m = /^id([A-Z]\w*)$/.exec(campo || '')
  const baseSing = m ? singular(m[1][0].toLowerCase() + m[1].slice(1)) : null
  const aceitos = new Set([campo, baseSing && `id${baseSing[0].toUpperCase()}${baseSing.slice(1)}`, baseSing && `${baseSing}.id`].filter(Boolean).map(letras))
  const obrig = f => (f.parametros_obrigatorios || []).map(x => (typeof x === 'string' ? x : x.nome || x.campo))

  for (const { f, bfc } of candidatos) {
    const filtro = (f.filtros || []).map(x => x.campo).find(c => aceitos.has(letras(c)))
    if (filtro && !obrig(f).length) return { bfc, filtro, path: f.path, inferida: true }
  }
  for (const { f, bfc } of candidatos) {
    const ps = obrig(f)
    if (ps.length === 1 && aceitos.has(letras(ps[0]))) return { bfc, parametro: ps[0], path: f.path, inferida: true }
  }
  // A fonte existe, mas não filtra pelo pai (nem pede o id dele): serve para consultar, não para achar os vínculos
  return { bfc: candidatos[0].bfc, path: candidatos[0].f.path, inferida: true, semLigacao: true }
}

const humanizar = r => r.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase())

export function criarMapa({ swagger, catalogo = [], mapaBfc = {}, curado = {} }) {
  const recursos = extrairRecursos(swagger || {})
  const dep = indexarDependentes(recursos)
  const cur = curado.recursos || {}
  for (const [recurso, c] of Object.entries(cur)) {
    for (const pai of c.pais || []) {
      dep[pai.recurso] ??= []
      const existente = dep[pai.recurso].find(d => d.recurso === recurso)
      if (existente) existente.campo = pai.campo
      else dep[pai.recurso].push({ recurso, campo: pai.campo })
    }
  }

  function no(recurso, campo) {
    const info = recursos[recurso] || {}
    const c = cur[recurso] || {}
    const metodos = info.metodos || []
    return {
      recurso,
      campo: campo ?? null,
      rotulo: c.rotulo || info.rotulo || humanizar(recurso),
      categoria: c.categoria || categoria(recurso),
      status: c.status || 'inferido',
      confirmadoEm: c.confirmadoEm || null,
      acao: c.acao || (metodos.includes('DELETE') ? 'excluir' : null),
      saiCom: c.saiCom || null,
      notas: c.notas || [],
      // Só scripts validados na prática (curado) — nada gerado sem teste
      scripts: c.scripts || [],
      metodos,
      temDelete: metodos.includes('DELETE'),
      corpoDelete: info.corpoDelete || null,
      fonte: c.fonte || (campo ? fonteDoRecurso(recurso, campo, catalogo, mapaBfc) : null),
      modulo: info.modulo || null,
      localizacao: info.localizacao || null,
      ajuda: info.ajuda || null,
      qtdDependentes: (dep[recurso] || []).length,
    }
  }

  const ordenar = (a, b) =>
    ORDEM_CATEGORIA[a.categoria] - ORDEM_CATEGORIA[b.categoria]
    || (a.status === 'confirmado' ? 0 : 1) - (b.status === 'confirmado' ? 0 : 1)
    || a.rotulo.localeCompare(b.rotulo, 'pt-BR')

  return {
    dependentes: recurso => (dep[recurso] || []).map(d => no(d.recurso, d.campo)).sort(ordenar),
    info: recurso => no(recurso, null),
    entidades: () => Object.entries(dep)
      .map(([recurso, lista]) => ({ recurso, rotulo: no(recurso, null).rotulo, modulo: recursos[recurso]?.modulo || null, qtdDependentes: lista.length }))
      .sort((a, b) => b.qtdDependentes - a.qtdDependentes || a.rotulo.localeCompare(b.rotulo, 'pt-BR')),
  }
}

// Leitura dos arquivos da biblioteca (main). Falta de arquivo vira erro explicando o quê.
export function carregarMapa(pastaBiblioteca) {
  const base = path.join(pastaBiblioteca, 'FontesDeDados')
  const ler = (rel, obrigatorio = true) => {
    const p = path.join(base, rel)
    if (!fs.existsSync(p)) {
      if (!obrigatorio) return undefined
      throw new Error(`Arquivo não encontrado na biblioteca: FontesDeDados/${rel}`)
    }
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  }
  return criarMapa({
    swagger: ler('swagger/tributos-openapi.json'),
    catalogo: ler('catalogo_v2.json', false) || [],
    mapaBfc: ler('mapa_bfc_rest.json', false) || {},
    curado: ler('dependencias_confirmadas.json', false) || {},
  })
}
