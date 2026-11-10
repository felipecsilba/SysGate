import { test } from 'node:test'
import assert from 'node:assert/strict'
import { montarCorpus } from './montarCorpus.mjs'
import { buscar, exemplos, juntar } from './consulta.mjs'
import { formatarNo, formatarExemplos } from './formatar.mjs'

const grafo = {
  versao: 1, hash: 'g', naoResolvidas: [],
  nos: [
    { id: 'area:imoveis', tipo: 'area', rotulo: 'Imóveis e IPTU' },
    { id: 'area:acrescimos', tipo: 'area', rotulo: 'Acréscimos' },
    { id: 'fonte:imoveis', tipo: 'fonte', rotulo: 'Imóveis', operacoes: [] },
    { id: 'tipo-formula:FORMULA_ACRESCIMO_DEBITO', tipo: 'tipo-formula', rotulo: 'FORMULA_ACRESCIMO_DEBITO' },
    { id: 'tipo-formula:ITBI', tipo: 'tipo-formula', rotulo: 'ITBI' },
    { id: 'template:Busca_Imoveis', tipo: 'template', rotulo: 'Busca Imóveis', status: 'validado', validadoEm: '2026-10-01' },
  ],
  arestas: [],
}
const areas = [
  { id: 'area:imoveis', palavras: ['imove', 'imovel', 'iptu'] },
  { id: 'area:acrescimos', palavras: ['acrescimo'] },
]
const codigoTemplate = 'fonte = Dados.tributos.v2.imoveis\nlista = fonte.busca(criterio: "codigo >= 1", campos: "id, codigo")\nlista.each { imovel ->\n  imprimir imovel.codigo\n  total = total + 1\n}\nimprimir total'
const entradas = () => ({
  hash: 'c',
  limiar: 0.4,
  templates: [{ id: 'template:Busca_Imoveis', codigo: codigoTemplate }],
  areas,
  pecas: [
    { raiz: 'Formulas', pasta: 'Debitos Gerais', nome: 'Andradas - FORMULA_ACRESCIMO_DEBITO - 48611 - 1900.txt', codigo: 'valor = receita.valor * 0.02' },
    { raiz: 'Formulas', pasta: 'Debitos Gerais', nome: 'Atibaia - FORMULA_ACRESCIMO_DEBITO - 38951 - 2025.txt', codigo: '// Atibaia\nvalor  =  receita.valor * 0.02' },
    { raiz: 'Formulas', pasta: 'ITBI', nome: 'Ilhota - ITBI_TRANSFERENCIA_CREDITOS - Transferência - 2024.txt', codigo: 'x = 1' },
    { raiz: 'Formulas', pasta: 'Parcelamentos', nome: 'Ilhota - DESCONTO_PARCELAMENTO_TODOS - Refis - 2024.txt', codigo: 'y = 2' },
    { raiz: 'Scripts', pasta: 'Scripts', nome: 'Criciúma - Busca imóveis.txt', codigo: codigoTemplate.replace('"codigo >= 1"', '"codigo >= 500"') },
    { raiz: 'Scripts', pasta: 'Scripts', nome: 'Bom Jesus - Outra coisa.txt', codigo: 'z = Dados.tributos.v2.naoExiste.busca()' },
    { raiz: 'Relatorios', pasta: 'Atibaia - [PMA-MC] Espelho do IPTU', nome: 'fonte_dinamica.txt', codigo: 'w = Dados.tributos.v2.imoveis.busca()',
      info: { titulo: '[PMA-MC] Espelho do IPTU', descricao: null, chaveNatureza: 'ESPELHO_CADASTRAL_IMOVEL' } },
  ],
})

const aresta = (c, de, tipo, para) => c.arestas.find(a => a.de === de && a.tipo === tipo && a.para === para)
const pecaDe = (c, municipio, texto) => c.nos.find(n => n.tipo === 'peca' && n.municipio === municipio && (n.rotulo || '').includes(texto))

test('peças com o que o nome diz; municípios; família repetida entre cidades', () => {
  const c = montarCorpus(entradas(), grafo)
  assert.equal(c.hash, 'c')
  assert.equal(c.nos.filter(n => n.tipo === 'peca').length, 7)
  assert.deepEqual(c.nos.filter(n => n.tipo === 'municipio').map(n => n.id), ['municipio:andradas', 'municipio:atibaia', 'municipio:bom-jesus', 'municipio:criciuma', 'municipio:ilhota'])
  const a = pecaDe(c, 'Andradas', '48611')
  assert.equal(a.id, 'peca:formulas/debitos-gerais/andradas-formula_acrescimo_debito-48611-1900')
  assert.equal(a.subtipo, 'formula')
  assert.equal(a.tipoFormula, 'FORMULA_ACRESCIMO_DEBITO')
  assert.equal(a.arquivo, 'Formulas/Debitos Gerais/Andradas - FORMULA_ACRESCIMO_DEBITO - 48611 - 1900.txt')
  assert.equal(a.qtdFamilia, 2) // Andradas e Atibaia: mesmo código, comentário diferente
  const rel = c.nos.find(n => n.subtipo === 'relatorio')
  assert.equal(rel.chaveNatureza, 'ESPELHO_CADASTRAL_IMOVEL')
  assert.equal(rel.arquivo, 'Relatorios/Atibaia - [PMA-MC] Espelho do IPTU/fonte_dinamica.txt')
  assert.ok(c.nos.find(n => n.id === 'municipio:bom-jesus').notas[0].startsWith('⚠'))
})

test('arestas: município, tipo (com subtipo ITBI_* e tipo fora do dicionário), fonte, área, variante', () => {
  const c = montarCorpus(entradas(), grafo)
  const a = pecaDe(c, 'Andradas', '48611').id
  assert.ok(aresta(c, a, 'de-municipio', 'municipio:andradas'))
  assert.ok(aresta(c, a, 'tipo', 'tipo-formula:FORMULA_ACRESCIMO_DEBITO'))
  assert.ok(aresta(c, a, 'pertence', 'area:acrescimos'))
  assert.ok(aresta(c, pecaDe(c, 'Ilhota', 'Transferência').id, 'tipo', 'tipo-formula:ITBI'))
  const refis = pecaDe(c, 'Ilhota', 'Refis').id
  assert.ok(aresta(c, refis, 'tipo', 'tipo-formula:DESCONTO_PARCELAMENTO_TODOS'))
  assert.equal(c.nos.find(n => n.id === 'tipo-formula:DESCONTO_PARCELAMENTO_TODOS').status, 'sem-dicionario')
  const cri = pecaDe(c, 'Criciúma', 'Busca').id
  assert.ok(aresta(c, cri, 'usa-fonte', 'fonte:imoveis'))
  const v = aresta(c, cri, 'variante-de', 'template:Busca_Imoveis')
  assert.ok(v && /^semelhança 0,\d\d$/.test(v.via))
  assert.ok(!c.arestas.some(x => x.de === pecaDe(c, 'Bom Jesus', 'Outra').id && x.tipo === 'usa-fonte'))
  assert.ok(!c.nos.some(n => n.id === 'fonte:naoExiste'))
})

test('nomes que viram o mesmo id (só caixa/pontuação diferente) não se perdem nem misturam arestas', () => {
  const e = entradas()
  e.pecas.push({ raiz: 'Scripts', pasta: 'Scripts', nome: 'Criciúma - BUSCA IMÓVEIS.txt', codigo: 'q = 1' })
  const c = montarCorpus(e, grafo)
  const ids = c.nos.filter(n => n.tipo === 'peca').map(n => n.id)
  assert.equal(ids.length, 8)
  assert.equal(new Set(ids).size, 8)
  const segunda = c.nos.find(n => n.arquivo === 'Scripts/Scripts/Criciúma - BUSCA IMÓVEIS.txt')
  assert.equal(segunda.id, 'peca:scripts/scripts/criciuma-busca-imoveis~2')
  assert.equal(c.arestas.filter(a => a.tipo === 'de-municipio' && a.de === segunda.id).length, 1)
  assert.ok(!c.arestas.some(a => a.de === segunda.id && a.tipo === 'variante-de'))
})

test('consulta: busca padrão ignora peças; --corpus mostra; exemplos uma por família', () => {
  const g = juntar(grafo, montarCorpus(entradas(), grafo))
  assert.ok(!buscar(g, 'acrescimo').some(n => n.tipo === 'peca'))
  assert.ok(buscar(g, 'acrescimo', { corpus: true }).some(n => n.tipo === 'peca'))
  const ex = exemplos(g, 'tipo-formula:FORMULA_ACRESCIMO_DEBITO')
  assert.equal(ex.total, 2)
  assert.equal(ex.familias, 1)
  assert.equal(ex.itens.length, 1) // mesmo código: mostra uma vez
  assert.equal(exemplos(g, 'template:Busca_Imoveis').itens[0].municipio, 'Criciúma')
  assert.deepEqual(exemplos(g, 'fonte:imoveis', { municipio: 'atibaia' }).itens.map(n => n.municipio), ['Atibaia'])
})

test('formatar: peças agrupadas por contagem no "no"; exemplos com município e arquivo', () => {
  const g = juntar(grafo, montarCorpus(entradas(), grafo))
  const no = formatarNo(g, 'fonte:imoveis')
  assert.match(no, /← usa-fonte · peca \(2 em 2 municípios\): .*— ver: grafo\.mjs exemplos fonte:imoveis/)
  const ex = formatarExemplos(exemplos(g, 'tipo-formula:FORMULA_ACRESCIMO_DEBITO'))
  assert.match(ex, /^2 peças \(1 código diferente, 2 municípios\)/)
  assert.match(ex, /Formulas\/Debitos Gerais\/.*FORMULA_ACRESCIMO_DEBITO.*\.txt/)
  assert.match(ex, /mesmo código em 2 municípios/)
})
