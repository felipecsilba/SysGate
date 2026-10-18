import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parametrosDoPath, preencherPath, urlFinal } from './caminho.js'

test('parametrosDoPath lista os {params} sem repetir', () => {
  assert.deepEqual(parametrosDoPath('/api/dividas/{id}/parcelas/{idParcela}'), ['id', 'idParcela'])
  assert.deepEqual(parametrosDoPath('/api/x/{id}/y/{id}'), ['id'])
  assert.deepEqual(parametrosDoPath('/api/dividas'), [])
  assert.deepEqual(parametrosDoPath(''), [])
})

test('preencherPath troca os preenchidos (com encode) e mantém os vazios', () => {
  assert.equal(preencherPath('/api/dividas/{id}', { id: '123' }), '/api/dividas/123')
  assert.equal(preencherPath('/api/x/{nome}', { nome: 'a b/c' }), '/api/x/a%20b%2Fc')
  assert.equal(preencherPath('/api/x/{a}/{b}', { a: '1', b: '  ' }), '/api/x/1/{b}')
})

test('urlFinal é exatamente o que o proxy chama: urlBase + path', () => {
  assert.equal(urlFinal('https://t.betha.cloud/sl', '/api/x'), 'https://t.betha.cloud/sl/api/x')
  assert.equal(urlFinal('', '/api/x'), '/api/x')
})
