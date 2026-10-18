import { test } from 'node:test'
import assert from 'node:assert/strict'
import { situacao, filtrarHistorico, agruparPorDia } from './historico.js'

const r = (id, extra) => ({
  id, metodo: 'POST', statusCode: 200, url: 'https://tributos.betha.cloud/service-layer-tributos/api/guias',
  idGerado: null, criadoEm: '2026-10-18T14:00:00', sistema: { id: 1, nome: 'Tributos' }, endpoint: { nome: 'Guias' }, ...extra,
})

test('situacao: 2xx = sucesso; 4xx, 5xx e sem resposta = erro', () => {
  assert.equal(situacao(201), 'sucesso')
  assert.equal(situacao(400), 'erro')
  assert.equal(situacao(503), 'erro')
  assert.equal(situacao(null), 'erro')
  assert.equal(situacao(0), 'erro')
})

test('filtra por situação e sistema', () => {
  const itens = [r(1), r(2, { statusCode: 400 }), r(3, { sistema: { id: 2, nome: 'Folha' } })]
  assert.deepEqual(filtrarHistorico(itens, { situacao: 'erro' }).map(i => i.id), [2])
  assert.deepEqual(filtrarHistorico(itens, { sistemaId: 2 }).map(i => i.id), [3])
  assert.deepEqual(filtrarHistorico(itens, {}).map(i => i.id), [1, 2, 3])
})

test('busca sem acento no path, no id gerado, no endpoint e no método', () => {
  const itens = [r(1, { idGerado: '98765' }), r(2, { url: 'https://x/api/dividas', endpoint: { nome: 'Dívidas' } }), r(3, { metodo: 'GET' })]
  assert.deepEqual(filtrarHistorico(itens, { busca: '9876' }).map(i => i.id), [1])
  assert.deepEqual(filtrarHistorico(itens, { busca: 'divida' }).map(i => i.id), [2])
  assert.deepEqual(filtrarHistorico(itens, { busca: 'get' }).map(i => i.id), [3])
})

test('agrupa por dia local: Hoje, Ontem e a data', () => {
  const agora = new Date(2026, 9, 18, 15, 0)
  const itens = [
    r(1, { criadoEm: new Date(2026, 9, 18, 9, 0).toISOString() }),
    r(2, { criadoEm: new Date(2026, 9, 18, 0, 5).toISOString() }),
    r(3, { criadoEm: new Date(2026, 9, 17, 23, 50).toISOString() }),
    r(4, { criadoEm: new Date(2026, 9, 3, 10, 0).toISOString() }),
  ]
  const grupos = agruparPorDia(itens, agora)
  assert.deepEqual(grupos.map(g => g.rotulo), ['Hoje', 'Ontem', '03/10/2026'])
  assert.deepEqual(grupos.map(g => g.itens.map(i => i.id)), [[1, 2], [3], [4]])
})
