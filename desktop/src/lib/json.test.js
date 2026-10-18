import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  interpretar, caminhoFilho, analisar, comparar, buscar, resumoValor, tabela, ordenarLinhas, csvTabela, cursor, colorirJson,
} from './json.js'

test('interpretar: texto vazio não é erro nem valor', () => {
  assert.deepEqual(interpretar('   '), { vazio: true })
})

test('interpretar: JSON válido devolve o valor', () => {
  assert.deepEqual(interpretar('{"a":[1,2]}'), { valor: { a: [1, 2] } })
  assert.deepEqual(interpretar('null'), { valor: null })
})

test('interpretar: erro aponta linha e coluna, com texto em português', () => {
  const r = interpretar('{\n  "a": 1\n  "b": 2\n}')
  assert.equal(r.erro.linha, 3)
  assert.equal(r.erro.coluna, 3)
  assert.match(r.erro.mensagem, /inesperado/i)
})

test('interpretar: fim antes da hora aponta o fim do texto', () => {
  const r = interpretar('{"a": [1, 2')
  assert.equal(r.erro.linha, 1)
  assert.equal(r.erro.coluna, 12)
  assert.match(r.erro.mensagem, /terminou/i)
})

test('caminhoFilho: chave simples com ponto, chave estranha entre colchetes, índice', () => {
  assert.equal(caminhoFilho('$', 'nome'), '$.nome')
  assert.equal(caminhoFilho('$', 'meu-campo'), '$["meu-campo"]')
  assert.equal(caminhoFilho('$', 'diz "oi"'), '$["diz \\"oi\\""]')
  assert.equal(caminhoFilho('$.itens', 3), '$.itens[3]')
})

test('analisar: conta tipos, chaves e profundidade', () => {
  const s = analisar({ a: 1, b: 'x', c: [true, null, { d: 2 }] })
  assert.deepEqual(s, { chaves: 4, objetos: 2, arrays: 1, textos: 1, numeros: 2, booleanos: 1, nulos: 1, profundidade: 3 })
})

test('comparar: adicionado, removido e alterado com caminho', () => {
  const d = comparar({ a: 1, b: { c: 2 }, x: [1] }, { a: 1, b: { c: 3 }, y: 'novo', x: [1, 2] })
  assert.deepEqual(d, [
    { caminho: '$.b.c', tipo: 'alterado', de: 2, para: 3 },
    { caminho: '$.x[1]', tipo: 'adicionado', valor: 2 },
    { caminho: '$.y', tipo: 'adicionado', valor: 'novo' },
  ])
  assert.deepEqual(comparar({ a: 1, b: 2 }, { a: 1 }), [{ caminho: '$.b', tipo: 'removido', valor: 2 }])
  assert.deepEqual(comparar([1], { 0: 1 }), [{ caminho: '$', tipo: 'alterado', de: [1], para: { 0: 1 } }])
  assert.deepEqual(comparar({ a: [1] }, { a: [1] }), [])
})

test('buscar: acha chave e valor sem acento nem caixa', () => {
  const r = buscar({ descricao: 'Dívida ativa', itens: [{ situacao: 'ATIVA' }], codigo: 1234 }, 'ativ')
  assert.deepEqual(r.map(x => [x.caminho, x.em]), [['$.descricao', 'valor'], ['$.itens[0].situacao', 'valor']])
  assert.deepEqual(buscar({ situação: 1 }, 'situacao').map(x => x.em), ['chave'])
  assert.deepEqual(buscar({ codigo: 1234 }, '23').map(x => x.caminho), ['$.codigo'])
  assert.deepEqual(buscar({ a: 1 }, '  '), [])
})

test('buscar: para em 500 resultados', () => {
  const muitos = Array.from({ length: 800 }, () => 'x')
  assert.equal(buscar(muitos, 'x').length, 500)
})

test('resumoValor: curto, com aspas em texto e reticências', () => {
  assert.equal(resumoValor('oi'), '"oi"')
  assert.equal(resumoValor(null), 'null')
  assert.equal(resumoValor(undefined), '—')
  assert.equal(resumoValor({ a: 1 }), '{"a":1}')
  assert.equal(resumoValor('x'.repeat(100)).length, 83)
})

test('tabela: array de objetos vira colunas na ordem em que aparecem', () => {
  const t = tabela([{ id: 1, nome: 'A' }, { id: 2, extra: true }, 5, null])
  assert.deepEqual(t.colunas, ['id', 'nome', 'extra'])
  assert.equal(t.linhas.length, 2)
  assert.equal(t.ignorados, 2)
  assert.equal(tabela({ a: 1 }), null)
})

test('tabela: objeto com um único array de objetos usa esse array (envelope)', () => {
  const t = tabela({ content: [{ id: 1 }], total: 1 })
  assert.deepEqual(t.colunas, ['id'])
  assert.equal(t.origem, 'content')
})

test('tabela: objeto aninhado vira colunas com ponto; array e objeto vazio ficam inteiros', () => {
  const t = tabela([{ id: 1, credito: { id: 42, tipo: { valor: 'IPTU' } }, tags: [1], extra: {} }])
  assert.deepEqual(t.colunas, ['id', 'credito.id', 'credito.tipo.valor', 'tags', 'extra'])
  assert.deepEqual(t.linhas[0]['credito.tipo.valor'], 'IPTU')
  assert.deepEqual(t.linhas[0].tags, [1])
})

test('ordenarLinhas: números como números, texto pt-BR, vazios por último', () => {
  const linhas = [{ v: 10 }, { v: 9 }, {}, { v: null }, { v: 100 }]
  assert.deepEqual(ordenarLinhas(linhas, 'v', 'asc').map(l => l.v), [9, 10, 100, null, undefined])
  assert.deepEqual(ordenarLinhas(linhas, 'v', 'desc').map(l => l.v), [100, 10, 9, null, undefined])
  assert.deepEqual(ordenarLinhas([{ n: 'b' }, { n: 'Á' }], 'n', 'asc').map(l => l.n), ['Á', 'b'])
})

test('csvTabela: ponto e vírgula, aspas escapadas, objeto como JSON', () => {
  const csv = csvTabela(['id', 'obs', 'sub'], [{ id: 1, obs: 'a;b "c"', sub: { x: 1 } }, { id: 2 }])
  assert.equal(csv, 'id;obs;sub\r\n1;"a;b ""c""";"{""x"":1}"\r\n2;;')
})

test('colorirJson: escapa HTML antes de colorir e marca cada tipo', () => {
  const cores = { chave: 'K', texto: 'T', numero: 'N', booleano: 'B', nulo: 'Z' }
  const html = colorirJson('{"a": "<script>", "n": 1, "b": true, "z": null}', cores)
  assert.ok(!html.includes('<script>'))
  assert.ok(html.includes('&lt;script&gt;'))
  for (const c of ['K', 'T', 'N', 'B', 'Z']) assert.ok(html.includes(`class="${c}"`), c)
})

test('cursor: linha e coluna da posição no texto', () => {
  assert.deepEqual(cursor('ab\ncde', 0), { linha: 1, coluna: 1 })
  assert.deepEqual(cursor('ab\ncde', 5), { linha: 2, coluna: 3 })
})
