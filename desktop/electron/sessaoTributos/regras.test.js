import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cabecalhosDaSessao, chamadaPermitida, URL_API } from './regras.js'

test('cabecalhosDaSessao: pega Authorization Bearer e User-Access das chamadas da própria tela', () => {
  const h = { 'Authorization': 'Bearer 56cd2504-c44a-4b1e-9f00-0123456789ab', 'User-Access': 'PkVul3OCrvWaXjpnXbYZgw==', Accept: '*/*' }
  assert.deepEqual(cabecalhosDaSessao(h), { authorization: h.Authorization, userAccess: h['User-Access'] })
  // nome do cabeçalho em minúsculas também vale
  assert.deepEqual(cabecalhosDaSessao({ authorization: 'Bearer x', 'user-access': 'y' }), { authorization: 'Bearer x', userAccess: 'y' })
})

test('cabecalhosDaSessao: sem Bearer ou sem User-Access não é sessão da tela', () => {
  assert.equal(cabecalhosDaSessao({ 'User-Access': 'y' }), null)
  assert.equal(cabecalhosDaSessao({ Authorization: 'Basic abc', 'User-Access': 'y' }), null)
  assert.equal(cabecalhosDaSessao({ Authorization: 'Bearer x' }), null)
  assert.equal(cabecalhosDaSessao(undefined), null)
})

test('chamadaPermitida: só GET e PUT de um crédito tributário por id', () => {
  assert.ok(chamadaPermitida('GET', '/api/cadastros/creditos-tributarios/307397'))
  assert.ok(chamadaPermitida('PUT', '/api/cadastros/creditos-tributarios/307397'))
  assert.ok(!chamadaPermitida('DELETE', '/api/cadastros/creditos-tributarios/307397'))
  assert.ok(!chamadaPermitida('POST', '/api/cadastros/creditos-tributarios'))
  assert.ok(!chamadaPermitida('GET', '/api/cadastros/creditos-tributarios/1/../../outra'))
  assert.ok(!chamadaPermitida('GET', '/api/arrecadacao/qualquer'))
  assert.equal(URL_API, 'https://tributos.betha.cloud/tributos/v1')
})

test('chamadaPermitida: GET e PUT de bairro e logradouro (endereços) por id', () => {
  assert.ok(chamadaPermitida('GET', '/api/cadastros/enderecos/bairros/6862519'))
  assert.ok(chamadaPermitida('PUT', '/api/cadastros/enderecos/logradouros/20981482'))
  assert.ok(!chamadaPermitida('DELETE', '/api/cadastros/enderecos/bairros/6862519'))
  assert.ok(!chamadaPermitida('GET', '/api/cadastros/enderecos/bairros'))
})

test('chamadaPermitida: GET e PUT de contribuinte por id', () => {
  assert.ok(chamadaPermitida('GET', '/api/cadastros/referentes/contribuintes/109271640'))
  assert.ok(chamadaPermitida('PUT', '/api/cadastros/referentes/contribuintes/109271640'))
  assert.ok(!chamadaPermitida('DELETE', '/api/cadastros/referentes/contribuintes/109271640'))
})
