#!/usr/bin/env node
// Grafo da biblioteca BFC: gera, checa e consulta. Toda a lógica está em lib/ (testada); aqui só há leitura
// de arquivo e argumentos. Uso: node biblioteca/_GRAFO/grafo.mjs <comando> — sem comando mostra a ajuda.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { agruparTemplates, casarReadme, lerTemplate } from './lib/biblioteca.mjs'
import { montarGrafo } from './lib/montar.mjs'
import { checar } from './lib/checar.mjs'
import { buscar, vizinhos } from './lib/consulta.mjs'
import { formatarNo, formatarBusca, formatarVizinhos, formatarResumo } from './lib/formatar.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const BIB = path.resolve(AQUI, '..')
const ARQ_GRAFO = path.join(AQUI, 'grafo.json')
const ARQ_CURADO = path.join(AQUI, 'curado.json')

const AJUDA = `Grafo da biblioteca BFC — onde olhar antes de abrir arquivo.

  node biblioteca/_GRAFO/grafo.mjs busca <termo> [--tipo t] [--area a]
  node biblioteca/_GRAFO/grafo.mjs no <id> [--todos]
  node biblioteca/_GRAFO/grafo.mjs vizinhos <id> [--aresta t] [--profundidade n] [--area a]
  node biblioteca/_GRAFO/grafo.mjs resumo
  node biblioteca/_GRAFO/grafo.mjs gerar      (depois de mudar template, conhecimento, catálogo ou curado.json)
  node biblioteca/_GRAFO/grafo.mjs checar     (pendências de curadoria)
  Qualquer consulta aceita --json.

Tipos de nó: area, template, funcao, tipo-formula, conhecimento, fonte, endpoint
Tipos de aresta: usa-fonte, mapeia, depende, documenta, pertence`

function args(argv) {
  const pos = [], op = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const k = argv[i].slice(2)
      if (argv[i + 1] && !argv[i + 1].startsWith('--') && !['json', 'todos'].includes(k)) op[k] = argv[++i]
      else op[k] = true
    } else pos.push(argv[i])
  }
  return { pos, op }
}

const ler = rel => fs.readFileSync(path.join(BIB, rel), 'utf8')
const lerJson = rel => JSON.parse(ler(rel))
const listar = rel => fs.readdirSync(path.join(BIB, rel)).sort()

function arquivosMd(rel) {
  const out = []
  for (const it of fs.readdirSync(path.join(BIB, rel), { withFileTypes: true })) {
    const r = `${rel}/${it.name}`
    if (it.isDirectory()) out.push(...arquivosMd(r))
    else if (it.name.endsWith('.md')) out.push(r)
  }
  return out.sort()
}

// Todas as entradas do grafo, com o caminho de cada uma (para o hash e para checar se está desatualizado).
function entradas() {
  const usados = []
  const lerU = rel => { usados.push(rel); return ler(rel) }
  const T = '_BIBLIOTECA/Templates'
  const nomesT = listar(T)
  const readmes = nomesT.filter(n => /^README.*\.md$/i.test(n))
  const templates = agruparTemplates(nomesT).map(g => {
    const readme = casarReadme(g.id, readmes)
    const no = lerTemplate({ ...g, readme, readmeTexto: readme ? lerU(`${T}/${readme}`) : null })
    return { no, codigo: g.arquivos.map(a => lerU(`${T}/${a}`)).join('\n') }
  })
  const F = '_BIBLIOTECA/Funcoes Prontas'
  const funcoes = listar(F).filter(n => n.endsWith('.txt'))
    .map(n => ({ nome: n.replace(/\.txt$/, ''), arquivo: `${F}/${n}`, codigo: lerU(`${F}/${n}`) }))
  const D = '_BIBLIOTECA/Dicionario de Formulas'
  const tipos = listar(D).filter(n => / - contexto da formula\.md$/.test(n))
    .map(n => ({ nome: n.replace(/ - contexto da formula\.md$/, ''), arquivo: `${D}/${n}` }))
  const conhecimentos = arquivosMd('_CONHECIMENTO')
    .map(rel => ({ rel: rel.slice('_CONHECIMENTO/'.length), texto: lerU(rel) }))
  const json = rel => { usados.push(rel); return lerJson(rel) }
  const e = {
    templates, funcoes, tipos, conhecimentos,
    catalogo: json('FontesDeDados/catalogo_v2.json'),
    mapaBfc: json('FontesDeDados/mapa_bfc_rest.json'),
    nomesBfc: json('FontesDeDados/nomes_bfc.json'),
    swagger: json('FontesDeDados/swagger/tributos-openapi.json'),
    dependencias: json('FontesDeDados/dependencias_confirmadas.json'),
    curado: json('_GRAFO/curado.json'),
  }
  usados.push(...funcoes.map(f => f.arquivo), ...tipos.map(t => t.arquivo))
  const h = crypto.createHash('sha256')
  for (const rel of [...new Set(usados)].sort()) h.update(rel).update(fs.readFileSync(path.join(BIB, rel)))
  e.hash = h.digest('hex').slice(0, 16)
  e.usados = [...new Set(usados)]
  return e
}

// Um nó/aresta por linha: arquivo pequeno e diff legível no git.
function escreverGrafo(g) {
  const bloco = (nome, itens, ultimo) => `"${nome}":[\n${itens.map(i => JSON.stringify(i)).join(',\n')}\n]${ultimo ? '' : ','}\n`
  const txt = `{"versao":${g.versao},"hash":"${g.hash}",\n` + bloco('nos', g.nos) + bloco('arestas', g.arestas) + bloco('naoResolvidas', g.naoResolvidas, true) + '}\n'
  fs.writeFileSync(ARQ_GRAFO, txt)
  return txt.length
}

function carregarGrafo() {
  if (!fs.existsSync(ARQ_GRAFO)) { console.error('grafo.json não existe. Rode: node biblioteca/_GRAFO/grafo.mjs gerar'); process.exit(1) }
  const g = JSON.parse(fs.readFileSync(ARQ_GRAFO, 'utf8'))
  // aviso barato de desatualização: alguma entrada mais nova que o grafo
  const t = fs.statSync(ARQ_GRAFO).mtimeMs
  const pastas = ['_BIBLIOTECA/Templates', '_BIBLIOTECA/Funcoes Prontas', '_CONHECIMENTO', 'FontesDeDados', '_GRAFO/curado.json']
  const maisNovo = p => { const s = fs.statSync(p); return s.isDirectory() ? fs.readdirSync(p).some(n => maisNovo(path.join(p, n))) : s.mtimeMs > t }
  try { if (pastas.some(p => maisNovo(path.join(BIB, p)))) console.error('(aviso: há arquivo mais novo que o grafo — rode "grafo.mjs gerar")') } catch { /* sem aviso */ }
  return g
}

const { pos: [cmd, alvo, ...resto], op } = args(process.argv.slice(2))
const saida = (obj, txt) => console.log(op.json ? JSON.stringify(obj, null, 1) : txt)

switch (cmd) {
  case 'gerar': {
    const e = entradas()
    const g = montarGrafo(e)
    const bytes = escreverGrafo(g)
    console.log(`grafo.json gerado (${Math.round(bytes / 1024)} KB, hash ${g.hash})`)
    console.log(formatarResumo(g))
    break
  }
  case 'checar': {
    const g = carregarGrafo()
    const avisos = checar(g, lerJson('_GRAFO/curado.json'))
    if (op.json) { saida(avisos); break }
    const porTipo = new Map()
    for (const a of avisos) porTipo.set(a.tipo, [...(porTipo.get(a.tipo) || []), a])
    for (const [tipo, lista] of porTipo) {
      console.log(`${tipo} (${lista.length}) — ${lista[0].msg.split(':')[0]}`)
      for (const a of lista) console.log(`  ${a.id}${a.tipo === 'citacao-sem-no' ? ' → ' + a.msg.split(': ')[1] : ''}`)
    }
    if (!avisos.length) console.log('Nenhuma pendência.')
    if (avisos.some(a => a.tipo === 'aresta-orfa' || a.tipo === 'curado-id-inexistente')) process.exitCode = 1
    break
  }
  case 'resumo': { const g = carregarGrafo(); saida({ nos: g.nos.length, arestas: g.arestas.length }, formatarResumo(g)); break }
  case 'busca': {
    const termo = [alvo, ...resto].filter(Boolean).join(' ')
    if (!termo) { console.log(AJUDA); break }
    const r = buscar(carregarGrafo(), termo, { tipo: op.tipo, area: op.area, limite: Number(op.limite) || 20 })
    saida(r, formatarBusca(r))
    break
  }
  case 'no': {
    if (!alvo) { console.log(AJUDA); break }
    const g = carregarGrafo()
    saida({ no: g.nos.find(n => n.id === alvo) || null, vizinhos: vizinhos(g, alvo) }, formatarNo(g, alvo, { todos: !!op.todos }))
    break
  }
  case 'vizinhos': {
    if (!alvo) { console.log(AJUDA); break }
    const v = vizinhos(carregarGrafo(), alvo, { aresta: op.aresta, area: op.area, profundidade: Number(op.profundidade) || 1 })
    saida(v, formatarVizinhos(v))
    break
  }
  default:
    console.log(AJUDA)
}
