const { test } = require('node:test')
const assert = require('node:assert/strict')
const { mascararHeaders } = require('./mascararHeaders')

test('mascara o token do Authorization (mantém 8 caracteres)', () => {
  const h = mascararHeaders({ Authorization: 'Bearer abcdef1234567890', 'Content-Type': 'application/json' })
  assert.equal(h.Authorization, 'Bearer abcdef12••••')
  assert.equal(h['Content-Type'], 'application/json')
})

test('nome do cabeçalho em qualquer caixa', () => {
  assert.equal(mascararHeaders({ authorization: 'Bearer 1234567890' }).authorization, 'Bearer 12345678••••')
})

test('token sem "Bearer" também é mascarado', () => {
  assert.equal(mascararHeaders({ Authorization: 'tokencru123456' }).Authorization, 'tokencru••••')
})

test('não muda o objeto original e tolera vazio', () => {
  const orig = { Authorization: 'Bearer abcdef1234567890' }
  mascararHeaders(orig)
  assert.equal(orig.Authorization, 'Bearer abcdef1234567890')
  assert.equal(mascararHeaders(null), null)
  assert.deepEqual(mascararHeaders({}), {})
})

test('já mascarado continua igual', () => {
  assert.equal(mascararHeaders({ Authorization: 'Bearer abcdef12••••' }).Authorization, 'Bearer abcdef12••••')
})
