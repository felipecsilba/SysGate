import { test } from 'node:test'
import assert from 'node:assert/strict'
import { expandirSchema } from './corpo.js'
import {
  colunasSemCabecalho, autoMapear, construirBodyLinha, dividirEmLotes,
  interpretarEnvio, interpretarStatusLote, linhaDoIdIntegracao, csvResultados,
} from './lote.js'

const campos = expandirSchema([
  { _exemplo: true, json: { credito: { idGerado: { id: 1 }, descricao: 'x' } } },
  { campo: 'idIntegracao', tipo: 'string', obrigatorio: true },
  { campo: 'nome', tipo: 'string' },
  { campo: 'valor', tipo: 'number' },
  { campo: 'credito', tipo: 'object' },
])

test('colunasSemCabecalho: A, B, … Z, depois Col27', () => {
  assert.deepEqual(colunasSemCabecalho(3), ['A', 'B', 'C'])
  assert.equal(colunasSemCabecalho(28)[26], 'Col27')
})

test('autoMapear casa nome do campo com a coluna, sem acento nem caixa', () => {
  assert.deepEqual(autoMapear(campos, ['NOME', 'Valor', 'idGerado', 'outra']), {
    nome: { modo: 'coluna', coluna: 'NOME' },
    valor: { modo: 'coluna', coluna: 'Valor' },
    'credito.idGerado': { modo: 'coluna', coluna: 'idGerado' },
  })
})

test('construirBodyLinha: coluna, valor fixo, tipos, {id} e idIntegracao automático por linha', () => {
  const mapa = {
    nome: { modo: 'coluna', coluna: 'N' },
    valor: { modo: 'coluna', coluna: 'V' },
    'credito.idGerado': { modo: 'fixo', valor: '42' },
    'credito.descricao': { modo: 'coluna', coluna: 'vazia' },
  }
  const body = construirBodyLinha(campos, mapa, { N: 'Ana', V: '10.5', vazia: '' }, 7, 'AB12')
  assert.deepEqual(body, { nome: 'Ana', valor: 10.5, credito: { idGerado: { id: 42 } }, idIntegracao: 'AB12-L7' })
})

test('construirBodyLinha respeita idIntegracao mapeado pelo usuário', () => {
  const body = construirBodyLinha(campos, { idIntegracao: { modo: 'coluna', coluna: 'ID' } }, { ID: 'MEU-1' }, 1, 'AB12')
  assert.equal(body.idIntegracao, 'MEU-1')
})

test('dividirEmLotes guarda a linha inicial de cada lote', () => {
  const l = dividirEmLotes(['a', 'b', 'c', 'd', 'e'], 2)
  assert.deepEqual(l.map(x => [x.indice, x.primeiraLinha, x.linhas.length]), [[0, 1, 2], [1, 3, 2], [2, 5, 1]])
})

test('interpretarEnvio: HTTP erro, envelope recusado (200 sem idLote) e fila aceita', () => {
  assert.equal(interpretarEnvio({ statusCode: 400, data: { mensagem: 'x' } }).status, 'erro')
  const recusado = interpretarEnvio({ statusCode: 200, data: { message: 'idIntegracao é obrigatório' } })
  assert.equal(recusado.status, 'erro')
  assert.match(recusado.mensagem, /Lote recusado — idIntegracao é obrigatório/)
  assert.deepEqual(interpretarEnvio({ statusCode: 200, data: { idLote: 'L1' } }), { status: 'fila', idLote: 'L1', mensagem: 'Lote L1 na fila' })
})

test('interpretarStatusLote: PROCESSADO, parcial com erros e NAO_PROCESSADO (ainda na fila, não erro)', () => {
  const ok = interpretarStatusLote({ statusLote: 'PROCESSADO', retorno: [{ status: 'SUCESSO', idGerado: { id: 9 } }, { idGerado: 10 }] })
  assert.equal(ok.status, 'ok')
  assert.deepEqual(ok.ids, ['9', '10'])

  const parcial = interpretarStatusLote({ statusLote: 'PROCESSADO_COM_ERRO', retorno: [
    { status: 'SUCESSO', idGerado: { id: 9 }, idIntegracao: 'AB12-L1' },
    { status: 'ERRO', idIntegracao: 'AB12-L2', mensagem: 'CPF inválido' },
  ] })
  assert.equal(parcial.status, 'parcial')
  assert.deepEqual(parcial.erros, [{ idIntegracao: 'AB12-L2', mensagem: 'CPF inválido' }])
  assert.match(parcial.mensagem, /1 de 2 gravado/)

  assert.equal(interpretarStatusLote({ statusLote: 'NAO_PROCESSADO' }).status, 'fila')
  assert.equal(interpretarStatusLote(null).status, 'fila')
})

test('linhaDoIdIntegracao devolve a linha do CSV a partir de RUNID-Lnnn', () => {
  assert.equal(linhaDoIdIntegracao('AB12-L37', 'AB12'), 37)
  assert.equal(linhaDoIdIntegracao('MEU-1', 'AB12'), null)
})

test('csvResultados: uma linha por lote, com ids e erros', () => {
  const csv = csvResultados([
    { indice: 0, itens: 2, status: 'ok', mensagem: '2 gravados', idLote: 'L1', ids: ['9', '10'], erros: [] },
    { indice: 1, itens: 1, status: 'parcial', mensagem: 'x; "y"', idLote: 'L2', ids: [], erros: [{ idIntegracao: 'R-L3', mensagem: 'CPF' }] },
  ])
  const linhas = csv.split('\r\n')
  assert.equal(linhas[0], 'lote;itens;status;mensagem;id_lote;ids_gerados;erros')
  assert.equal(linhas[1], '1;2;ok;2 gravados;L1;9,10;')
  assert.equal(linhas[2], '2;1;parcial;"x; ""y""";L2;;R-L3: CPF')
})
