const { test } = require('node:test')
const assert = require('node:assert/strict')

const { parseEntrada } = require('./parseEntrada')

test('array JSON direto', () => {
  const r = parseEntrada('[{"id":1},{"id":2}]')
  assert.equal(r.registros.length, 2)
  assert.equal(r.formato, 'array')
})

test('objeto único vira lista de um', () => {
  const r = parseEntrada('{"id":1}')
  assert.equal(r.registros.length, 1)
  assert.equal(r.registros[0].id, 1)
})

test('envelope paginado: data, content, list', () => {
  assert.equal(parseEntrada('{"total":9,"data":[{"id":1}]}').registros.length, 1)
  assert.equal(parseEntrada('{"content":[{"id":1},{"id":2}]}').registros.length, 2)
  assert.equal(parseEntrada('{"list":[{"id":1}]}').registros.length, 1)
})

test('NDJSON: um JSON por linha', () => {
  const r = parseEntrada('{"id":1}\n{"id":2}\n{"id":3}')
  assert.equal(r.registros.length, 3)
  assert.equal(r.formato, 'linhas')
})

test('log do Studio: prefixo de hora antes do JSON', () => {
  // É assim que a saída do BFC-Script chega quando copiada do Studio.
  const texto = [
    '11:52:01 - {"id":274988488,"credito":"LIDFE"}',
    '11:52:01 - {"id":274988649,"credito":"PAGVA"}',
  ].join('\n')
  const r = parseEntrada(texto)
  assert.equal(r.registros.length, 2)
  assert.equal(r.registros[0].id, 274988488)
  assert.equal(r.registros[1].credito, 'PAGVA')
})

test('log do Studio: ignora as linhas de cabeçalho e resumo', () => {
  const texto = [
    '11:52:01 - ============================================================',
    '11:52:01 - dividas RECEITAS_DIVERSAS SEM receita diversa vinculada: 1445',
    '11:52:01 - ============================================================',
    '11:52:01 - {"id":274988488}',
    'Não há eventos mais recentes neste momento.',
  ].join('\n')
  const r = parseEntrada(texto)
  assert.equal(r.registros.length, 1)
  assert.equal(r.registros[0].id, 274988488)
})

test('linha truncada é descartada sem derrubar o resto', () => {
  // O Studio corta a última linha quando o log é grande.
  const texto = '{"id":1}\n{"id":2}\n{"id":3,"nome":"corta aqui'
  const r = parseEntrada(texto)
  assert.equal(r.registros.length, 2)
  assert.equal(r.descartadas, 1)
})

test('texto vazio devolve lista vazia sem erro', () => {
  assert.deepEqual(parseEntrada('').registros, [])
  assert.deepEqual(parseEntrada('   ').registros, [])
})

test('texto que não é JSON nenhum devolve lista vazia', () => {
  const r = parseEntrada('isso aqui não é json')
  assert.deepEqual(r.registros, [])
  assert.equal(r.formato, 'desconhecido')
})

test('array dentro de linha de log também é aceito', () => {
  const r = parseEntrada('11:44:50 - [{"id":1},{"id":2}]')
  assert.equal(r.registros.length, 2)
})
