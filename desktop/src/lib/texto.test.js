import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizar, contem } from './texto.js'

test('normalizar tira acento, caixa e espaços das pontas', () => {
  assert.equal(normalizar('  Belém do PARÁ '), 'belem do para')
  assert.equal(normalizar(null), '')
})

test('contem busca por trecho sem acento', () => {
  assert.equal(contem('Econômicos', 'eco'), true)
  assert.equal(contem('Belém', 'BELE'), true)
  assert.equal(contem('Viseu', 'xyz'), false)
  assert.equal(contem('qualquer', ''), true)
})
