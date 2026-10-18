import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extrairId } from './ids.js'

test('extrairId pega o primeiro id conhecido', () => {
  assert.equal(extrairId({ id: 98765 }), '98765')
  assert.equal(extrairId({ idGerado: { id: 5 } }), '5')
  assert.equal(extrairId({ idLote: 'abc' }), 'abc')
  assert.equal(extrairId({ idEconomico: 0 }), '0')
})

test('extrairId sem id → null', () => {
  assert.equal(extrairId({ mensagem: 'ok' }), null)
  assert.equal(extrairId(null), null)
  assert.equal(extrairId('texto'), null)
  assert.equal(extrairId([{ id: 1 }]), null)
})
