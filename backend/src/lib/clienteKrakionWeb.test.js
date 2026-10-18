const { test } = require('node:test')
const assert = require('node:assert/strict')
const { normalizarUrl, emParalelo } = require('./clienteKrakionWeb')

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

test('emParalelo mantém a ordem e nunca passa do limite de chamadas simultâneas', async () => {
  let ativas = 0, pico = 0
  const r = await emParalelo([5, 1, 4, 2, 3, 0], 2, async n => {
    ativas++; pico = Math.max(pico, ativas)
    await new Promise(ok => setTimeout(ok, n))
    ativas--
    return n * 10
  })
  assert.deepEqual(r, [50, 10, 40, 20, 30, 0])
  assert.equal(pico, 2)
  assert.deepEqual(await emParalelo([], 8, async n => n), [])
})
