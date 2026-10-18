const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  normalizarNome, casarPorNome, prepararEndpoint, prepararTokens, resumir,
  planejarPorChave, prepararNota, prepararConhecimento,
  prepararRegra, chaveRegra, prepararNotaChecagem, chaveNotaChecagem, prepararFonte, camposMarcados,
} = require('./importacaoWeb')

test('normalizarNome ignora caixa, espaços e acentos', () => {
  assert.equal(normalizarNome('  Arrecadação  '), 'arrecadacao')
  assert.equal(normalizarNome('VISEU'), normalizarNome('viseu'))
  assert.equal(normalizarNome(null), '')
})

test('casarPorNome acha o local de mesmo nome e marca o que é novo', () => {
  const remotos = [{ id: 10, nome: 'Tributos' }, { id: 11, nome: 'Contábil' }]
  const locais = [{ id: 1, nome: 'tributos ' }]
  assert.deepEqual(casarPorNome(remotos, locais), [
    { remoto: remotos[0], localId: 1 },
    { remoto: remotos[1], localId: null },
  ])
})

test('prepararEndpoint serializa bodySchema, troca o sistema e descarta id', () => {
  const ep = {
    id: 99, modulo: 'Dívidas', nome: 'Criar', path: '/api/dividas', metodo: 'POST',
    descricao: 'x', bodySchema: [{ campo: 'a' }], sistemaId: 7, criadoEm: '2026-01-01',
  }
  assert.deepEqual(prepararEndpoint(ep, 3), {
    modulo: 'Dívidas', nome: 'Criar', path: '/api/dividas', metodo: 'POST',
    descricao: 'x', bodySchema: '[{"campo":"a"}]', sistemaId: 3,
  })
})

test('prepararEndpoint grava bodySchema vazio como null', () => {
  const base = { modulo: 'm', nome: 'n', path: '/p', metodo: 'GET' }
  assert.equal(prepararEndpoint({ ...base, bodySchema: [] }, 1).bodySchema, null)
  assert.equal(prepararEndpoint({ ...base, bodySchema: undefined }, 1).bodySchema, null)
  assert.equal(prepararEndpoint({ ...base }, 1).descricao, null)
})

test('prepararTokens mapeia ids remotos para locais e ignora sistema sem par', () => {
  const municipios = [
    { id: 50, tokens: [
      { sistemaId: 10, token: 'aaa', dataVencimento: '2026-10-20T00:00:00.000Z' },
      { sistemaId: 12, token: 'bbb', dataVencimento: null },
    ] },
    { id: 51, tokens: [] },
  ]
  const r = prepararTokens(municipios, new Map([[10, 1]]), new Map([[50, 5], [51, 6]]))
  assert.deepEqual(r.tokens, [
    { municipioId: 5, sistemaId: 1, token: 'aaa', dataVencimento: new Date('2026-10-20T00:00:00.000Z') },
  ])
  assert.equal(r.ignorados, 1)
})

test('resumir conta o que veio e separa endpoints sem sistema', () => {
  const dados = {
    sistemas: [{ id: 1 }, { id: 2 }],
    endpoints: [{ sistemaId: 1 }, { sistemaId: 2 }, { sistemaId: null }],
    municipios: [{ tokens: [{}, {}] }, { tokens: [{}] }],
  }
  assert.deepEqual(resumir(dados), {
    sistemas: 2, endpoints: 2, endpointsSemSistema: 1, municipios: 2, tokens: 3, notas: 0, conhecimento: 0,
    regras: 0, notasChecagem: 0, fontes: 0,
  })
})


test('notas e conhecimento casam por título + data de criação; só a versão mais nova da VPS sobrescreve', () => {
  const remotos = [
    { id: 1, titulo: 'Guias', criadoEm: '2026-10-01T10:00:00.000Z', atualizadoEm: '2026-10-05T00:00:00.000Z' },
    { id: 2, titulo: 'Dívidas', criadoEm: '2026-10-02T10:00:00.000Z', atualizadoEm: '2026-10-02T10:00:00.000Z' },
    { id: 3, titulo: 'Nova', criadoEm: '2026-10-03T10:00:00.000Z', atualizadoEm: '2026-10-03T10:00:00.000Z' },
  ]
  const locais = [
    { id: 7, titulo: 'guias', criadoEm: new Date('2026-10-01T10:00:00Z'), atualizadoEm: new Date('2026-10-04T00:00:00Z') },
    { id: 8, titulo: 'Dividas', criadoEm: new Date('2026-10-02T10:00:00Z'), atualizadoEm: new Date('2026-10-09T00:00:00Z') },
  ]
  assert.deepEqual(
    planejarPorChave(remotos, locais).map(p => [p.remoto.id, p.localId, p.acao]),
    [[1, 7, 'atualizar'], [2, 8, 'manter'], [3, null, 'criar']]
  )
})

test('prepararNota e prepararConhecimento: dono local, JSON serializado e datas da VPS preservadas', () => {
  const nota = prepararNota({ id: 9, titulo: 'A', tipo: 'checklist', conteudo: '', itens: [{ texto: 'x', feito: true }], cor: '#E3F2FD', fixada: true, ordem: 2, etiquetas: ['viseu'], usuarioId: 99, criadoEm: '2026-10-01T10:00:00.000Z', atualizadoEm: '2026-10-02T10:00:00.000Z', compartilhada: false }, 1)
  assert.deepEqual(nota, { titulo: 'A', tipo: 'checklist', conteudo: '', itens: '[{"texto":"x","feito":true}]', cor: '#E3F2FD', fixada: true, ordem: 2, etiquetas: '["viseu"]', usuarioId: 1, criadoEm: new Date('2026-10-01T10:00:00.000Z'), atualizadoEm: new Date('2026-10-02T10:00:00.000Z') })

  const c = prepararConhecimento({ id: 4, titulo: 'Erro 422', tipo: 'erro', descricao: null, conteudo: '[]', passos: [], vertical: 'Arrecadação', sistema: 'Tributos', etiquetas: [], autorId: 5, autor: { id: 5 }, criadoEm: '2026-10-01T10:00:00.000Z', atualizadoEm: '2026-10-01T10:00:00.000Z' }, 1)
  assert.equal(c.autorId, 1)
  assert.equal(c.passos, '[]')
  assert.equal(c.vertical, 'Arrecadação')
  assert.equal('autor' in c, false)
})

test('resumir conta notas e artigos de conhecimento', () => {
  const r = resumir({ sistemas: [], endpoints: [], municipios: [], notas: [{}, {}], conhecimento: [{}] })
  assert.equal(r.notas, 2)
  assert.equal(r.conhecimento, 1)
})

test('prepararRegra: onde/quando voltam a ser texto JSON, sistema local, sem id nem autor', () => {
  const r = {
    id: 5, sistemaId: 9, frente: 'fonte', cadastro: 'debitos', nome: 'Vencimento informado', porque: 'p',
    onde: ['dtVencimento'], quando: { caminhos: ['tipo'], igualA: ['X'] }, esperado: null, naoSabemos: 'n',
    comoCorrigir: null, severidade: 'erro', ordem: 2, autorId: 1, criadoEm: '2026-10-01',
  }
  assert.deepEqual(prepararRegra(r, 3), {
    sistemaId: 3, frente: 'fonte', cadastro: 'debitos', nome: 'Vencimento informado', porque: 'p',
    onde: '["dtVencimento"]', quando: '{"caminhos":["tipo"],"igualA":["X"]}', esperado: null, naoSabemos: 'n',
    comoCorrigir: null, severidade: 'erro', ordem: 2,
  })
  assert.equal(prepararRegra({ ...r, quando: null }, 3).quando, null)
})

test('regra e nota da checagem casam pela mesma chave do seed (sem caixa nem acento)', () => {
  assert.equal(chaveRegra({ frente: 'fonte', cadastro: 'debitos', nome: 'Receita Vinculada' }),
    chaveRegra({ frente: 'fonte', cadastro: 'debitos', nome: 'receita vinculada ' }))
  assert.notEqual(chaveRegra({ frente: 'api', cadastro: 'debitos', nome: 'a' }), chaveRegra({ frente: 'fonte', cadastro: 'debitos', nome: 'a' }))
  assert.equal(chaveNotaChecagem({ path: '/api/dividas', tipo: 'regra', texto: ' Precisa da receita ' }),
    chaveNotaChecagem({ path: '/api/dividas', tipo: 'regra', texto: 'precisa da receita' }))
  assert.deepEqual(prepararNotaChecagem({ id: 1, sistemaId: 9, path: '/x', tipo: 'regra', texto: 't', ordem: 1, autorId: 2 }, 3),
    { sistemaId: 3, path: '/x', tipo: 'regra', texto: 't', ordem: 1 })
})

test('prepararFonte: detalhe da VPS → linha do catálogo, sem os valores que a rota anexa aos filtros', () => {
  const d = {
    id: 40, nome: 'debitos', path: '/debitos', operacao: 'busca', descricao: 'Débitos', descricaoOp: null, tipoRetorno: 'Debito',
    filtros: [{ campo: 'situacao', tipo: 'Situacao', eh_enum: true, valores: [{ key: 'A' }] }, { campo: 'id', tipo: 'Long' }],
    campos: [{ nome: 'id' }], enums: { Situacao: { values: [{ key: 'A' }] } },
  }
  assert.deepEqual(prepararFonte(d, 3), {
    sistemaId: 3, nome: 'debitos', path: '/debitos', operacao: 'busca', verbo: 'GET', natureza: 'LEITURA',
    descricao: 'Débitos', descricaoOp: null, tipoRetorno: 'Debito',
    filtros: '[{"campo":"situacao","tipo":"Situacao","eh_enum":true},{"campo":"id","tipo":"Long"}]',
    campos: '[{"nome":"id"}]', enums: '{"Situacao":{"values":[{"key":"A"}]}}',
  })
})

test('camposMarcados: só o que foi marcado à mão, com observação vazia virando null', () => {
  const resp = { campos: [
    { caminho: 'dividas.sistemaOrigem', marcado: true, obrigatorio: true, observacao: 'Sem ele o débito não cancela' },
    { caminho: 'dividas.idPessoa', marcado: false, obrigatorio: true, observacao: '' },
    { caminho: 'dividas.obs', marcado: true, obrigatorio: false, observacao: '' },
  ] }
  assert.deepEqual(camposMarcados(resp, '/api/dividas', 3), [
    { sistemaId: 3, path: '/api/dividas', campo: 'dividas.sistemaOrigem', obrigatorio: true, observacao: 'Sem ele o débito não cancela' },
    { sistemaId: 3, path: '/api/dividas', campo: 'dividas.obs', obrigatorio: false, observacao: null },
  ])
})

test('resumir conta regras, notas e fontes da checagem de todos os sistemas', () => {
  const r = resumir({ sistemas: [], endpoints: [], municipios: [], checagem: [
    { regras: [{}, {}], notas: [{}], fontes: [{}, {}, {}] }, { regras: [{}], notas: [], fontes: [] },
  ] })
  assert.equal(r.regras, 3)
  assert.equal(r.notasChecagem, 1)
  assert.equal(r.fontes, 3)
})
