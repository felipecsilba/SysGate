import { test } from 'node:test'
import assert from 'node:assert/strict'
import { montarGrafo } from './montar.mjs'
import { checar } from './checar.mjs'

// Biblioteca em miniatura: 2 templates, 1 função, 1 tipo de fórmula, 2 conhecimentos, 3 fontes, 2 recursos REST.
const corpo = props => ({ requestBody: { content: { 'application/json': { schema: { type: 'array', items: { properties: { idIntegracao: {}, x: { properties: props } } } } } } } })
const entradas = () => ({
  hash: 'abc',
  templates: [
    { no: { id: 'template:Exporta_Debitos', tipo: 'template', rotulo: 'Exporta Débitos', arquivo: 'T/a.txt', status: 'validado', validadoEm: '2026-10-05' },
      codigo: '// usa Dados.tributos.v2.imoveis no comentário\nDados.tributos.v2.debitos.busca(criterio: c)' },
    { no: { id: 'template:Varredura_Imovel', tipo: 'template', rotulo: 'Varredura Imovel', arquivo: 'T/b.txt', status: 'sem-registro' },
      codigo: 'Dados.tributos.v2.imoveis.camposAdicionais.busca()\nDados.tributos.v2.naoExiste.busca()' },
  ],
  funcoes: [{ nome: 'Busca de Indexador numa Data', arquivo: 'F/i.txt', codigo: 'Dados.tributos.v2.indexadores.movimentacoes.busca()' }],
  tipos: [{ nome: 'ITBI', arquivo: 'D/ITBI.md' }],
  conhecimentos: [
    { rel: 'ITBI-Transferencias/casos/Divida.md', texto: '# Dívida não foi\nAs ITBI_TRANSFERENCIA_CREDITOS e o Exporta_Debitos. POST /api/imoveis. /api/inexistente' },
    { rel: '_COMUM/Mapa.md', texto: '# Mapa do sistema' },
  ],
  catalogo: [
    { nome: 'debitos', descricao: 'Débitos', operacao: 'busca', natureza: 'LEITURA', path: '/debitos' },
    { nome: 'imoveis', descricao: 'Imóveis', operacao: 'busca', natureza: 'LEITURA', path: '/imoveis' },
    { nome: 'imoveis', descricao: 'Imóveis', operacao: 'buscaCA', natureza: 'LEITURA', path: '/imoveis/campos-adicionais' },
  ],
  mapaBfc: { por_operacao: {
    'debitos|busca|/debitos': { bfc: 'debitos', usos_producao: 10 },
    'imoveis|busca|/imoveis': { bfc: 'imoveis', usos_producao: 20 },
    'imoveis|buscaCA|/imoveis/campos-adicionais': { bfc: 'imoveis.camposAdicionais', usos_producao: 5 },
  } },
  swagger: { paths: {
    '/api/imoveis': { post: corpo({ codigo: {} }), delete: {} },
    '/api/debitos': { post: corpo({ idImovel: {} }) },
    '/api/historicos': { get: {} },
  } },
  dependencias: { recursos: { historicos: { pais: [{ recurso: 'imoveis', campo: 'entityId' }] } } },
  curado: {
    areas: [
      { id: 'area:itbi', nome: 'ITBI e Transferências', palavras: ['itbi', 'transferenc'], pastas: ['ITBI-Transferencias'] },
      { id: 'area:debitos', nome: 'Débitos e Créditos', palavras: ['debito'], pastas: [] },
    ],
    arestas: [{ de: 'template:Varredura_Imovel', tipo: 'pertence', para: 'area:debitos', nota: 'teste' }],
    remover: [{ de: 'fonte:debitos', tipo: 'mapeia', para: 'endpoint:debitos' }],
    notas: { 'fonte:imoveis': ['Use .busca, nunca o nome da operação REST.'] },
  },
})

const aresta = (g, de, tipo, para) => g.arestas.find(a => a.de === de && a.tipo === tipo && a.para === para)

test('nós de todos os tipos, com ids estáveis e ordenados', () => {
  const g = montarGrafo(entradas())
  assert.equal(g.hash, 'abc')
  assert.deepEqual(g.nos.map(n => n.id), [
    'area:debitos', 'area:itbi',
    'conhecimento:_comum/mapa', 'conhecimento:itbi-transferencias/casos/divida',
    'endpoint:debitos', 'endpoint:historicos', 'endpoint:imoveis',
    'fonte:debitos', 'fonte:imoveis', 'fonte:imoveis.camposAdicionais', 'fonte:indexadores.movimentacoes', 'fonte:naoExiste',
    'funcao:busca-de-indexador-numa-data',
    'template:Exporta_Debitos', 'template:Varredura_Imovel',
    'tipo-formula:ITBI',
  ])
  const ids = g.nos.map(n => n.id)
  assert.deepEqual(ids, [...ids].sort())
})

test('usa-fonte: só código fora de comentário; cadeia composta; fonte fora do catálogo vira nó marcado', () => {
  const g = montarGrafo(entradas())
  assert.ok(aresta(g, 'template:Exporta_Debitos', 'usa-fonte', 'fonte:debitos'))
  assert.ok(!aresta(g, 'template:Exporta_Debitos', 'usa-fonte', 'fonte:imoveis'))
  assert.ok(aresta(g, 'template:Varredura_Imovel', 'usa-fonte', 'fonte:imoveis.camposAdicionais'))
  assert.ok(aresta(g, 'funcao:busca-de-indexador-numa-data', 'usa-fonte', 'fonte:indexadores.movimentacoes'))
  assert.equal(g.nos.find(n => n.id === 'fonte:naoExiste').status, 'fora-do-catalogo')
})

test('depende: inferida pelo id<Recurso> e curada pelos pais do dependencias_confirmadas', () => {
  const g = montarGrafo(entradas())
  assert.deepEqual(aresta(g, 'endpoint:debitos', 'depende', 'endpoint:imoveis'), { de: 'endpoint:debitos', tipo: 'depende', para: 'endpoint:imoveis', origem: 'inferida', via: 'idImovel' })
  assert.equal(aresta(g, 'endpoint:historicos', 'depende', 'endpoint:imoveis').origem, 'curada')
})

test('documenta: conhecimento → template, tipo (por subtipo), endpoint; citação sem nó vai para naoResolvidas', () => {
  const g = montarGrafo(entradas())
  const k = 'conhecimento:itbi-transferencias/casos/divida'
  assert.ok(aresta(g, k, 'documenta', 'template:Exporta_Debitos'))
  assert.ok(aresta(g, k, 'documenta', 'tipo-formula:ITBI'))
  assert.ok(aresta(g, k, 'documenta', 'endpoint:imoveis'))
  assert.deepEqual(g.naoResolvidas, [{ de: k, ref: 'endpoint:inexistente' }])
})

test('pertence: pasta, palavra-chave e curado; curado remove e anota', () => {
  const g = montarGrafo(entradas())
  assert.ok(aresta(g, 'conhecimento:itbi-transferencias/casos/divida', 'pertence', 'area:itbi'))
  assert.ok(aresta(g, 'tipo-formula:ITBI', 'pertence', 'area:itbi'))
  assert.ok(aresta(g, 'template:Exporta_Debitos', 'pertence', 'area:debitos'))
  assert.deepEqual(aresta(g, 'template:Varredura_Imovel', 'pertence', 'area:debitos'), { de: 'template:Varredura_Imovel', tipo: 'pertence', para: 'area:debitos', origem: 'curada', nota: 'teste' })
  assert.ok(!aresta(g, 'fonte:debitos', 'mapeia', 'endpoint:debitos'))
  assert.ok(aresta(g, 'fonte:imoveis', 'mapeia', 'endpoint:imoveis'))
  assert.deepEqual(g.nos.find(n => n.id === 'fonte:imoveis').notas, ['Use .busca, nunca o nome da operação REST.'])
})

test('checar: aponta template sem registro, fonte fora do catálogo, citação sem nó e curado com id inexistente', () => {
  const e = entradas()
  e.curado.notas['fonte:fantasma'] = ['x']
  const g = montarGrafo(e)
  const avisos = checar(g, e.curado)
  const tipos = avisos.map(a => a.tipo + ' ' + a.id)
  assert.deepEqual(tipos.sort(), [
    'citacao-sem-no conhecimento:itbi-transferencias/casos/divida',
    'curado-id-inexistente fonte:fantasma',
    'fonte-fora-do-catalogo fonte:indexadores.movimentacoes',
    'fonte-fora-do-catalogo fonte:naoExiste',
    'template-sem-registro template:Varredura_Imovel',
  ])
})

test('checar: template que o README diz não validado tem aviso próprio', () => {
  const e = entradas()
  e.templates[1].no.status = 'nao-validado'
  const avisos = checar(montarGrafo(e), e.curado)
  assert.ok(avisos.some(a => a.tipo === 'template-nao-validado' && a.id === 'template:Varredura_Imovel'))
  assert.ok(!avisos.some(a => a.tipo === 'template-sem-registro'))
})

test('checar: aresta órfã', () => {
  const g = montarGrafo(entradas())
  g.arestas.push({ de: 'template:Exporta_Debitos', tipo: 'usa-fonte', para: 'fonte:sumiu', origem: 'inferida' })
  assert.ok(checar(g, {}).some(a => a.tipo === 'aresta-orfa'))
})
