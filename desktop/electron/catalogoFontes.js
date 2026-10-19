import fs from 'node:fs'
import path from 'node:path'

// Catálogo de fontes do BFC-Script para o Gerador de Extensões, lido da pasta da biblioteca:
//   FontesDeDados/catalogo_v2.json   — 574 operações com filtros, ordenação, parâmetros e enums
//   FontesDeDados/mapa_bfc_rest.json — nome REST do catálogo → nome usado no editor da Betha
// O nome REST frequentemente difere do nome no script (certidoes-negativas → certidaoNegativa);
// sem confirmação, a tela avisa para conferir no editor (mesma regra do fonte.py).

let cache = null

export function chaveFonte(f) {
  return `${f.nome}|${f.operacao}|${f.path}`
}

// Nome BFC: 1) mapa por operação (path); 2) mapa por nome REST sem ambiguidade; 3) o próprio nome (não confirmado)
export function nomeBfc(f, mapa) {
  const porOp = mapa?.por_operacao?.[chaveFonte(f)]
  if (porOp?.bfc) return { bfc: porOp.bfc, confirmado: true, usos: porOp.usos_producao || 0 }
  const porNome = mapa?.rest_para_bfc?.[f.nome]
  if (porNome?.bfc) return { bfc: porNome.bfc, confirmado: true, usos: porNome.usos_producao || 0 }
  return { bfc: f.nome, confirmado: false, usos: 0 }
}

function lerJson(arquivo) {
  return JSON.parse(fs.readFileSync(arquivo, 'utf8'))
}

/** Lê (com cache por data de modificação) o catálogo e o mapa. null se a pasta não tiver o catálogo. */
export function carregar(raiz) {
  const dir = path.join(raiz, 'FontesDeDados')
  const arqCatalogo = path.join(dir, 'catalogo_v2.json')
  if (!fs.existsSync(arqCatalogo)) return null
  const arqMapa = path.join(dir, 'mapa_bfc_rest.json')
  const marca = `${raiz}|${fs.statSync(arqCatalogo).mtimeMs}|${fs.existsSync(arqMapa) ? fs.statSync(arqMapa).mtimeMs : 0}`
  if (cache?.marca === marca) return cache
  const bruto = lerJson(arqCatalogo)
  const mapa = fs.existsSync(arqMapa) ? lerJson(arqMapa) : {}
  const leitura = (Array.isArray(bruto) ? bruto : bruto.fontes || [])
    .filter(f => f?.nome && f.path && f.operacao && String(f.natureza || '').toUpperCase() === 'LEITURA')
  const porChave = new Map(leitura.map(f => [chaveFonte(f), { ...f, ...nomeBfc(f, mapa) }]))
  cache = { marca, porChave }
  return cache
}

/** Lista enxuta para o seletor da tela (mais usadas em produção primeiro). */
export function listarFontes(raiz) {
  const c = carregar(raiz)
  if (!c) return { existe: false, fontes: [] }
  const fontes = [...c.porChave.values()].map(f => ({
    chave: chaveFonte(f), nome: f.nome, operacao: f.operacao, path: f.path,
    descricao: f.descricao || null, descricaoOp: f.descricao_op || null,
    bfc: f.bfc, confirmado: f.confirmado, usos: f.usos,
    qtdFiltros: (f.filtros || []).length, parametros: (f.parametros_obrigatorios || []).map(p => p.nome),
  }))
  fontes.sort((a, b) => b.usos - a.usos || a.bfc.localeCompare(b.bfc) || a.path.localeCompare(b.path))
  return { existe: true, fontes }
}

/** Detalhe de uma operação: filtros (enums com os valores aceitos), ordenação, parâmetros e campos de retorno. */
export function detalheFonte(raiz, chave) {
  const f = carregar(raiz)?.porChave.get(chave)
  if (!f) return null
  const enums = f.enums || {}
  const valoresDe = tipo => (enums[tipo]?.values || []).map(v => ({ key: v.key, descricao: v.description || null }))
  return {
    chave, nome: f.nome, operacao: f.operacao, path: f.path, bfc: f.bfc, confirmado: f.confirmado, usos: f.usos,
    descricao: f.descricao || null, descricaoOp: f.descricao_op || null,
    filtros: (f.filtros || []).map(c => ({ ...c, valores: c.eh_enum ? valoresDe(c.tipo) : [] })),
    ordenacao: (f.ordenacao || []).map(c => c.campo),
    parametros: (f.parametros_obrigatorios || []).map(p => ({ nome: p.nome, tipo: p.tipo })),
    campos: (f.campos_retorno || []).map(c => ({ campo: c.campo, tipo: c.tipo, descricao: c.descricao || null })),
  }
}
