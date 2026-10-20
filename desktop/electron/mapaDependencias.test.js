import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  extrairRecursos, alvoDoCampo, indexarDependentes, categoria, fonteDoRecurso, criarMapa,
} from './mapaDependencias.js'

// Swagger mínimo no formato do Service Layer: POST/DELETE com array de { idIntegracao, <recurso>: {...} }
function rota(recurso, { campos = [], metodos = ['post', 'put', 'delete'], rotulo, tag = 'imoveis (Imóveis)' }) {
  const corpo = props => ({ type: 'array', items: { type: 'object', properties: { idIntegracao: { type: 'string' }, [recurso]: { type: 'object', properties: props } } } })
  const ops = {}
  for (const m of metodos) {
    const verbo = { post: 'Cria um registro de', put: 'Atualiza registros de', delete: 'Remove registros de' }[m]
    const props = m === 'delete' ? { idGerado: { type: 'object', properties: { id: { type: 'integer' } } } } : Object.fromEntries(campos.map(c => [c, { type: 'integer' }]))
    ops[m] = { summary: `${verbo} ${rotulo}`, tags: [tag], requestBody: { content: { 'application/json': { schema: corpo(props) } } } }
  }
  return ops
}

const swagger = {
  tags: [{ name: 'imoveis (Imóveis)', description: 'Localização: Módulo [Imobiliário] >> Administrando >> Imóveis', externalDocs: { url: 'https://ajuda/imoveis' } }],
  paths: {
    '/api/imoveis': rota('imoveis', { campos: ['codigo', 'idBairro'], rotulo: 'Imóvel' }),
    '/api/imoveis/{id}': { get: {} },
    '/api/bairros': rota('bairros', { campos: ['nome'], rotulo: 'Bairro', tag: 'bairros (Bairros)' }),
    '/api/imoveisResponsaveis': rota('imoveisResponsaveis', { campos: ['idPessoa', 'idImovel', 'percentual'], rotulo: 'Imóvel Responsável' }),
    '/api/imoveisMovimentacoes': rota('imoveisMovimentacoes', { campos: ['idImoveis', 'descricao'], rotulo: 'Imóveis Movimentações' }),
    '/api/imoveisMovDetalhes': rota('imoveisMovDetalhes', { campos: ['idImoveisMovimentacoes', 'detalhe'], rotulo: 'Imóveis Mov Detalhes' }),
    '/api/imoveisTestadas': rota('imoveisTestadas', { campos: ['idImovel', 'extensao'], rotulo: 'Imóvel Testada' }),
    '/api/dividas': rota('dividas', { campos: ['idImovel', 'valor'], rotulo: 'Dívida', tag: 'dividas (Inscrição em dívida)' }),
    '/api/dividasReceitas': rota('dividasReceitas', { campos: ['idDivida'], rotulo: 'Dívida Receita', tag: 'dividas (Inscrição em dívida)' }),
    '/api/certidoesNegativas': rota('certidoesNegativas', { campos: ['idImovel'], metodos: ['post'], rotulo: 'Certidão Negativa', tag: 'certidoes (Certidões)' }),
  },
}

const catalogo = [
  { nome: 'imoveis', operacao: 'buscaTestadas', path: '/imoveis/{idImovel}/testadas', natureza: 'LEITURA', filtros: [{ campo: 'id' }], parametros_obrigatorios: ['idImovel'], campos_retorno: [{ campo: 'id' }] },
  { nome: 'imoveis', operacao: 'busca', path: '/imoveis/movimentacoes', natureza: 'LEITURA', filtros: [{ campo: 'idImovel' }, { campo: 'id' }], parametros_obrigatorios: [], campos_retorno: [{ campo: 'id' }, { campo: 'idImovel' }] },
  { nome: 'dividas', operacao: 'busca', path: '/dividas', natureza: 'LEITURA', filtros: [{ campo: 'idImovel' }], parametros_obrigatorios: [], campos_retorno: [{ campo: 'id' }] },
  { nome: 'dividas', operacao: 'criar', path: '/dividas', natureza: 'CRIACAO', filtros: [], parametros_obrigatorios: [], campos_retorno: [] },
]
const mapaBfc = { por_operacao: {
  'imoveis|buscaTestadas|/imoveis/{idImovel}/testadas': { bfc: 'imovel.testadas' },
  'imoveis|busca|/imoveis/movimentacoes': { bfc: 'imoveis.movimentacoes' },
  'dividas|busca|/dividas': { bfc: 'dividas' },
} }

const curado = {
  recursos: {
    imoveisResponsaveis: {
      status: 'confirmado', confirmadoEm: '2026-10-20', acao: 'excluir', rotulo: 'Proprietários (responsáveis)',
      fonte: { bfc: 'imoveis.proprietarios', filtro: 'idImovel' }, notas: ['"Responsáveis" na API = proprietários na fonte.'],
    },
    historicoAlteracaoImovel: {
      pais: [{ recurso: 'imoveis', campo: 'entityId' }], status: 'confirmado', acao: 'saiJunto', saiCom: 'imoveisMovimentacoes',
      notas: ['Sai junto com as movimentações.'],
    },
  },
}

test('extrairRecursos: um por rota /api/<recurso> com POST ou DELETE, com campos, métodos, rótulo e tag', () => {
  const r = extrairRecursos(swagger)
  assert.deepEqual(Object.keys(r).sort(), ['bairros', 'certidoesNegativas', 'dividas', 'dividasReceitas', 'imoveis', 'imoveisMovDetalhes', 'imoveisMovimentacoes', 'imoveisResponsaveis', 'imoveisTestadas'])
  assert.deepEqual(r.imoveisResponsaveis.campos, ['idPessoa', 'idImovel', 'percentual'])
  assert.deepEqual(r.imoveisResponsaveis.metodos, ['DELETE', 'POST', 'PUT'])
  assert.equal(r.imoveisResponsaveis.rotulo, 'Imóvel Responsável')
  assert.equal(r.imoveisResponsaveis.modulo, 'Imóveis')
  assert.equal(r.imoveisResponsaveis.localizacao, 'Módulo [Imobiliário] >> Administrando >> Imóveis')
  assert.equal(r.imoveisResponsaveis.ajuda, 'https://ajuda/imoveis')
  assert.deepEqual(r.imoveisResponsaveis.corpoDelete, [{ idIntegracao: 'EXCLUIR-1', imoveisResponsaveis: { idGerado: { id: 0 } } }])
  assert.equal(r.certidoesNegativas.corpoDelete, null) // sem DELETE
})

test('alvoDoCampo: id<Recurso> no singular, plural e composto; o resto não liga', () => {
  const nomes = new Set(['imoveis', 'imoveisMovimentacoes', 'dividas', 'bairros'])
  assert.equal(alvoDoCampo('idImovel', nomes), 'imoveis')
  assert.equal(alvoDoCampo('idImoveis', nomes), 'imoveis')
  assert.equal(alvoDoCampo('idImoveisMovimentacoes', nomes), 'imoveisMovimentacoes')
  assert.equal(alvoDoCampo('idDivida', nomes), 'dividas')
  assert.equal(alvoDoCampo('idBairro', nomes), 'bairros')
  assert.equal(alvoDoCampo('idPessoa', nomes), null)
  assert.equal(alvoDoCampo('codigo', nomes), null)
  assert.equal(alvoDoCampo('id', nomes), null)
})

test('indexarDependentes: quem aponta para quem, e por qual campo', () => {
  const dep = indexarDependentes(extrairRecursos(swagger))
  assert.deepEqual(dep.imoveis.map(d => d.recurso).sort(), ['certidoesNegativas', 'dividas', 'imoveisMovimentacoes', 'imoveisResponsaveis', 'imoveisTestadas'])
  assert.deepEqual(dep.imoveisMovimentacoes, [{ recurso: 'imoveisMovDetalhes', campo: 'idImoveisMovimentacoes' }])
  assert.deepEqual(dep.bairros, [{ recurso: 'imoveis', campo: 'idBairro' }])
})

test('categoria: financeiro, documentos e cadastro', () => {
  assert.equal(categoria('dividas'), 'financeiro')
  assert.equal(categoria('dividasReceitas'), 'financeiro')
  assert.equal(categoria('guiasUnificadas'), 'financeiro')
  assert.equal(categoria('lancamentos'), 'financeiro')
  assert.equal(categoria('pagamentosDetalhados'), 'financeiro')
  assert.equal(categoria('certidoesNegativas'), 'documentos')
  assert.equal(categoria('imoveisResponsaveis'), 'cadastro')
  assert.equal(categoria('imoveisMovimentacoes'), 'cadastro')
})

test('fonteDoRecurso: casa recurso camelCase com o path da fonte (ignora {params}), diz filtro ou parâmetro', () => {
  assert.deepEqual(fonteDoRecurso('imoveisTestadas', 'idImovel', catalogo, mapaBfc), { bfc: 'imovel.testadas', parametro: 'idImovel', path: '/imoveis/{idImovel}/testadas', inferida: true })
  assert.deepEqual(fonteDoRecurso('imoveisMovimentacoes', 'idImoveis', catalogo, mapaBfc), { bfc: 'imoveis.movimentacoes', filtro: 'idImovel', path: '/imoveis/movimentacoes', inferida: true })
  assert.deepEqual(fonteDoRecurso('dividas', 'idImovel', catalogo, mapaBfc), { bfc: 'dividas', filtro: 'idImovel', path: '/dividas', inferida: true })
  assert.equal(fonteDoRecurso('imoveisResponsaveis', 'idImovel', catalogo, mapaBfc), null)
})

test('fonteDoRecurso: parâmetro obrigatório que não é o id do pai não vira "filtra pelo pai"', () => {
  const cat = [{ nome: 'guias', operacao: 'busca', path: '/guias-unificadas/{idGuiaUnificada}', natureza: 'LEITURA', filtros: [], parametros_obrigatorios: ['idGuiaUnificada'] }]
  const mb = { por_operacao: { 'guias|busca|/guias-unificadas/{idGuiaUnificada}': { bfc: 'guiasUnificadas' } } }
  assert.deepEqual(fonteDoRecurso('guiasUnificadas', 'idImovel', cat, mb), { bfc: 'guiasUnificadas', path: '/guias-unificadas/{idGuiaUnificada}', inferida: true, semLigacao: true })
})

test('criarMapa: dependentes da entidade com tudo que o painel mostra; curado vence e acrescenta aresta', () => {
  const mapa = criarMapa({ swagger, catalogo, mapaBfc, curado })
  const deps = mapa.dependentes('imoveis')
  const por = Object.fromEntries(deps.map(d => [d.recurso, d]))
  assert.deepEqual(Object.keys(por).sort(), ['certidoesNegativas', 'dividas', 'historicoAlteracaoImovel', 'imoveisMovimentacoes', 'imoveisResponsaveis', 'imoveisTestadas'])

  // curado: rótulo, status, fonte e notas
  assert.equal(por.imoveisResponsaveis.rotulo, 'Proprietários (responsáveis)')
  assert.equal(por.imoveisResponsaveis.status, 'confirmado')
  assert.deepEqual(por.imoveisResponsaveis.fonte, { bfc: 'imoveis.proprietarios', filtro: 'idImovel' })
  assert.equal(por.imoveisResponsaveis.campo, 'idImovel')
  // aresta que só o curado conhece
  assert.equal(por.historicoAlteracaoImovel.campo, 'entityId')
  assert.equal(por.historicoAlteracaoImovel.acao, 'saiJunto')
  // inferido
  assert.equal(por.imoveisTestadas.status, 'inferido')
  assert.equal(por.imoveisTestadas.fonte.bfc, 'imovel.testadas')
  assert.equal(por.dividas.categoria, 'financeiro')
  assert.equal(por.dividas.qtdDependentes, 1) // dividasReceitas: mostra o ▸
  assert.equal(por.imoveisMovimentacoes.qtdDependentes, 1)
  assert.equal(por.certidoesNegativas.temDelete, false)
  assert.equal(por.imoveisTestadas.corpoDelete[0].imoveisTestadas.idGerado.id, 0)
})

test('criarMapa: entidades para o seletor, com contagem de dependentes, as que têm mais primeiro', () => {
  const mapa = criarMapa({ swagger, catalogo, mapaBfc, curado })
  const ents = mapa.entidades()
  assert.equal(ents[0].recurso, 'imoveis')
  assert.equal(ents[0].qtdDependentes, 6)
  assert.equal(ents.find(e => e.recurso === 'bairros').qtdDependentes, 1)
  assert.equal(mapa.dependentes('naoExiste').length, 0)
  assert.equal(mapa.info('imoveis').rotulo, 'Imóvel')
})

// Com o Swagger e o catálogo reais da biblioteca (se estiverem nesta máquina): os vínculos confirmados no caso dos imóveis aparecem
const BASE = fileURLToPath(new URL('../../biblioteca/FontesDeDados/', import.meta.url))
const temReais = fs.existsSync(path.join(BASE, 'swagger', 'tributos-openapi.json')) && fs.existsSync(path.join(BASE, 'catalogo_v2.json'))
test('dados reais: imóvel tem os dependentes confirmados na prática', { skip: !temReais && 'Swagger/catálogo ausentes' }, () => {
  const ler = f => JSON.parse(fs.readFileSync(path.join(BASE, f), 'utf8'))
  const mapa = criarMapa({ swagger: ler('swagger/tributos-openapi.json'), catalogo: ler('catalogo_v2.json'), mapaBfc: ler('mapa_bfc_rest.json'), curado: ler('dependencias_confirmadas.json') })
  const nomes = mapa.dependentes('imoveis').map(d => d.recurso)
  for (const r of ['imoveisResponsaveis', 'imoveisMovimentacoes', 'imoveisTestadas', 'imoveisCorresponsaveis', 'historicoAlteracaoImovel', 'dividas']) assert.ok(nomes.includes(r), r)
  assert.ok(nomes.length >= 30)
})
