import { test } from 'node:test'
import assert from 'node:assert/strict'
import { expandirSchema, fixo, selecaoInicial, valoresIniciais, montarBody, exemploJson, pedeJsonLivre } from './corpo.js'

// bodySchema no formato do parser de Swagger: campos + sentinela _exemplo com o JSON de exemplo
const schema = [
  { _exemplo: true, json: { idIntegracao: 'X', sistemaOrigem: 'BETHA', valor: 10, ativo: true, credito: { idGerado: { id: 7 }, descricao: 'abc' }, tags: ['a'] } },
  { campo: 'idIntegracao', tipo: 'string', obrigatorio: true },
  { campo: 'sistemaOrigem', tipo: 'string', obrigatorio: false, exemplo: 'BETHA', enum: ['BETHA', 'OUTRO'] },
  { campo: 'valor', tipo: 'number', obrigatorio: true, exemplo: '10' },
  { campo: 'ativo', tipo: 'boolean' },
  { campo: 'credito', tipo: 'object', subFields: [{ campo: 'descricao', tipo: 'string', descricao: 'Descrição do crédito' }] },
  { campo: 'tags', tipo: 'array<string>' },
]

test('expandirSchema abre objeto 1 nível pelo exemplo e trata idGerado {id}', () => {
  const c = expandirSchema(schema)
  assert.deepEqual(c.map(x => x.campo), ['idIntegracao', 'sistemaOrigem', 'valor', 'ativo', 'credito.idGerado', 'credito.descricao', 'tags'])
  const idg = c.find(x => x.campo === 'credito.idGerado')
  assert.equal(idg.pai, 'credito')
  assert.equal(idg.rotulo, 'idGerado')
  assert.equal(idg.tipo, 'number')
  assert.equal(idg.envolverId, true)
  assert.equal(idg.exemplo, '7')
  assert.equal(c.find(x => x.campo === 'credito.descricao').descricao, 'Descrição do crédito')
  assert.equal(c.find(x => x.campo === 'valor').pai, null)
})

test('sem exemplo, objeto fica como campo único', () => {
  const c = expandirSchema([{ campo: 'credito', tipo: 'object' }])
  assert.deepEqual(c.map(x => [x.campo, x.pai]), [['credito', null]])
})

test('fixo: idIntegracao e idGerado não podem ser desmarcados', () => {
  const c = expandirSchema(schema)
  assert.deepEqual(c.filter(fixo).map(x => x.campo), ['idIntegracao', 'credito.idGerado'])
})

test('selecaoInicial marca obrigatórios, idIntegracao e idGerado; filhos de objeto começam desmarcados', () => {
  const s = selecaoInicial(expandirSchema(schema))
  assert.deepEqual(s, {
    idIntegracao: true, sistemaOrigem: false, valor: true, ativo: false,
    'credito.idGerado': true, 'credito.descricao': false, tags: false,
  })
})

test('valoresIniciais usa o exemplo e preenche idIntegracao/idGerado vazios', () => {
  const v = valoresIniciais(expandirSchema(schema))
  assert.equal(v.idIntegracao, 'INTEGRACAO1')
  assert.equal(v.sistemaOrigem, 'BETHA')
  assert.equal(v.valor, '10')
  assert.equal(v['credito.idGerado'], '7')
  assert.equal(v['credito.descricao'], 'abc')
})

test('montarBody: só marcados e não vazios, tipos convertidos, objeto aninhado e {id}', () => {
  const c = expandirSchema(schema)
  const sel = { ...selecaoInicial(c), ativo: true, 'credito.descricao': true, sistemaOrigem: true }
  const val = { ...valoresIniciais(c), ativo: 'false', valor: '150.5', sistemaOrigem: '' }
  assert.deepEqual(montarBody(c, sel, val), {
    idIntegracao: 'INTEGRACAO1', valor: 150.5, ativo: false,
    credito: { idGerado: { id: 7 }, descricao: 'abc' },
  })
})

test('montarBody mantém texto quando o número digitado não é número (a API acusa o erro)', () => {
  const c = expandirSchema([{ campo: 'valor', tipo: 'number' }])
  assert.deepEqual(montarBody(c, { valor: true }, { valor: '12,50' }), { valor: '12,50' })
})

test('exemploJson e pedeJsonLivre', () => {
  assert.equal(exemploJson(schema).valor, 10)
  assert.equal(exemploJson([{ campo: 'a' }]), undefined)
  assert.equal(pedeJsonLivre(expandirSchema(schema)), true)
  assert.equal(pedeJsonLivre(expandirSchema([{ campo: 'a', tipo: 'string' }])), false)
})
