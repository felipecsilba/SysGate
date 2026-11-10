import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nosDeFonte, nosDeEndpoint, arestasMapeia } from './fontes.mjs'

const catalogo = [
  { nome: 'imoveis', descricao: 'Imóveis', operacao: 'busca', natureza: 'LEITURA', path: '/imoveis' },
  { nome: 'imoveis', descricao: 'Imóveis', operacao: 'buscaCamposAdicionais', natureza: 'LEITURA', path: '/imoveis/campos-adicionais' },
  { nome: 'certidoes-negativas', descricao: 'Certidões negativas', operacao: 'busca', natureza: 'LEITURA', path: '/certidoes-negativas' },
  { nome: 'semMapa', descricao: 'Sem mapa', operacao: 'cria', natureza: 'CRIACAO', path: '/sem-mapa' },
]
const mapa = { por_operacao: {
  'imoveis|busca|/imoveis': { bfc: 'imoveis', usos_producao: 1760 },
  'imoveis|buscaCamposAdicionais|/imoveis/campos-adicionais': { bfc: 'imoveis.camposAdicionais', usos_producao: 300 },
  'certidoes-negativas|busca|/certidoes-negativas': { bfc: 'certidaoNegativa', usos_producao: 5 },
} }

test('nosDeFonte: um nó por nome BFC, com as operações dentro', () => {
  const nos = nosDeFonte(catalogo, mapa)
  assert.deepEqual(nos.map(n => n.id), ['fonte:certidaoNegativa', 'fonte:imoveis', 'fonte:imoveis.camposAdicionais', 'fonte:semMapa'])
  const im = nos.find(n => n.id === 'fonte:imoveis')
  assert.deepEqual(im, { id: 'fonte:imoveis', tipo: 'fonte', rotulo: 'Imóveis', confirmado: true, usos: 1760,
    operacoes: [{ operacao: 'busca', path: '/imoveis', natureza: 'LEITURA' }] })
  assert.equal(nos.find(n => n.id === 'fonte:semMapa').confirmado, false)
})

test('nosDeEndpoint: um nó por recurso de /api, métodos somados, rótulo do Swagger', () => {
  const swagger = { paths: {
    '/api/imoveis': { post: {}, delete: {} },
    '/api/imoveis/{id}': { get: {} },
    '/api/certidoesNegativas': { get: {} },
    '/api/config-homologacao-tributos': { get: {} },
    '/health': { get: {} },
  } }
  const recursos = { imoveis: { rotulo: 'imóveis', modulo: 'Cadastros' } }
  assert.deepEqual(nosDeEndpoint(swagger, recursos), [
    { id: 'endpoint:certidoesNegativas', tipo: 'endpoint', rotulo: 'Certidoes Negativas', metodos: ['GET'] },
    { id: 'endpoint:config-homologacao-tributos', tipo: 'endpoint', rotulo: 'Config-homologacao-tributos', metodos: ['GET'] },
    { id: 'endpoint:imoveis', tipo: 'endpoint', rotulo: 'imóveis', metodos: ['DELETE', 'GET', 'POST'], modulo: 'Cadastros' },
  ])
})

test('arestasMapeia: fonte → endpoint pelo 1º trecho do path, ignorando hífen e caixa', () => {
  const fontes = nosDeFonte(catalogo, mapa)
  const endpoints = [{ id: 'endpoint:imoveis' }, { id: 'endpoint:certidoesNegativas' }]
  assert.deepEqual(arestasMapeia(fontes, endpoints), [
    { de: 'fonte:certidaoNegativa', tipo: 'mapeia', para: 'endpoint:certidoesNegativas', origem: 'inferida' },
    { de: 'fonte:imoveis', tipo: 'mapeia', para: 'endpoint:imoveis', origem: 'inferida' },
    { de: 'fonte:imoveis.camposAdicionais', tipo: 'mapeia', para: 'endpoint:imoveis', origem: 'inferida' },
  ])
})
