const { test } = require('node:test')
const assert = require('node:assert/strict')
const { normalizarUrl } = require('./clienteKrakionWeb')

test('normalizarUrl tira barra final e caminho', () => {
  assert.equal(normalizarUrl('https://krakionlabs.cloud/'), 'https://krakionlabs.cloud')
  assert.equal(normalizarUrl(' https://krakionlabs.cloud/login '), 'https://krakionlabs.cloud')
  assert.equal(normalizarUrl('http://localhost:3001'), 'http://localhost:3001')
})

test('normalizarUrl completa https quando falta o protocolo', () => {
  assert.equal(normalizarUrl('krakionlabs.cloud'), 'https://krakionlabs.cloud')
})

test('normalizarUrl recusa o que não é http/https', () => {
  assert.throws(() => normalizarUrl('file:///etc/passwd'), /endereço/i)
  assert.throws(() => normalizarUrl(''), /endereço/i)
})
