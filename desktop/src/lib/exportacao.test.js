import { test } from 'node:test'
import assert from 'node:assert/strict'
import { montarCondicao, montarCriterio, montarScript, operadoresPara } from './exportacao.js'

const f = (campo, tipo, extra = {}) => ({ campo, tipo, eh_enum: false, ...extra })

test('montarCondicao: número sem aspas, texto e enum com aspas, aspa interna dobrada', () => {
  assert.equal(montarCondicao({ ...f('idCredito', 'Long'), operador: '=', valor: '285568' }), 'idCredito = 285568')
  assert.equal(montarCondicao({ ...f('situacao', 'SituacaoParcela', { eh_enum: true }), operador: '=', valor: 'ABERTO' }), "situacao = 'ABERTO'")
  assert.equal(montarCondicao({ ...f('nome', 'String'), operador: 'like', valor: "D'Ávila" }), "nome like '%D''Ávila%'")
  assert.equal(montarCondicao({ ...f('dtVencimento', 'LocalDate'), operador: '>=', valor: '2026-01-01' }), "dtVencimento >= '2026-01-01'")
})

test('montarCondicao: vazio, vazio-ou-zero, lista "in" e valor faltando', () => {
  assert.equal(montarCondicao({ ...f('idReceitaDiversa', 'Long'), operador: 'vazioOuZero' }), '(idReceitaDiversa is null or idReceitaDiversa = 0)')
  assert.equal(montarCondicao({ ...f('obs', 'String'), operador: 'is null' }), 'obs is null')
  assert.equal(montarCondicao({ ...f('ano', 'Integer'), operador: 'in', valor: '2024, 2025,' }), 'ano in (2024, 2025)')
  assert.equal(montarCondicao({ ...f('situacao', 'X', { eh_enum: true }), operador: 'in', valor: 'ABERTO,PAGO' }), "situacao in ('ABERTO', 'PAGO')")
  assert.equal(montarCondicao({ ...f('ano', 'Integer'), operador: '=', valor: '  ' }), null)
})

test('montarCriterio junta com "and" e ignora as incompletas', () => {
  assert.equal(montarCriterio([
    { ...f('idCredito', 'Long'), operador: '=', valor: '1' },
    { ...f('ano', 'Integer'), operador: '=', valor: '' },
    { ...f('idReceitaDiversa', 'Long'), operador: 'vazioOuZero' },
  ]), 'idCredito = 1 and (idReceitaDiversa is null or idReceitaDiversa = 0)')
})

test('operadoresPara: "contém" só em texto que não é enum', () => {
  assert.ok(operadoresPara(f('nome', 'String')).some(o => o.id === 'like'))
  assert.ok(!operadoresPara(f('ano', 'Integer')).some(o => o.id === 'like'))
  assert.ok(!operadoresPara(f('situacao', 'String', { eh_enum: true })).some(o => o.id === 'like'))
})

const debitos = { bfc: 'debitos', operacao: 'busca', descricao: 'Débitos', confirmado: true, ordenacao: ['id', 'ano'] }

test('montarScript: fonte, critério escapado, JSON maiúsculo, zip com JSONL + CSV e ordenação por id', () => {
  const s = montarScript({ fonte: debitos, criterio: "situacao = 'ABERTO' and obs like '%\"x\" $y%'", limite: 50, nomeBase: 'débitos crédito 1' })
  assert.match(s, /Dados\.tributos\.v2\.debitos\.busca\(criterio: CRITERIO, ordenacao: "id asc"\)/)
  assert.ok(s.includes(`CRITERIO = "situacao = 'ABERTO' and obs like '%\\"x\\" \\$y%'"`))
  assert.match(s, /LIMITE = 50/)
  assert.match(s, /JSON\.escrever\(registro\)/)
  assert.doesNotMatch(s, /\bJson\./) // "Json" não existe no BFC; arquivoJson é só o nome da variável
  assert.match(s, /NOME_ARQUIVO_JSON = "debitos_credito_1\.jsonl"/)
  assert.match(s, /zip\.adicionar\(arquivoCsv\)/)
  assert.doesNotMatch(s, /ATENÇÃO/)
  assert.doesNotMatch(s, /\?:/) // Elvis nunca testado no Studio
})

test('montarScript: parâmetro obrigatório vai em parametros:, sem CSV não tem 2ª passada, aviso de nome não confirmado', () => {
  const testadas = { bfc: 'imoveis', operacao: 'buscaTestadas', confirmado: false, ordenacao: [] }
  const s = montarScript({ fonte: testadas, parametros: [{ nome: 'idImovel', tipo: 'Long', valor: '' }], csv: false })
  assert.match(s, /idImovel = 0   \/\/ obrigatório/)
  assert.match(s, /buscaTestadas\(parametros: \["idImovel": idImovel\], criterio: CRITERIO\)/)
  assert.match(s, /buscaTestadas\(parametros: \["idImovel": idImovel\]\)/)
  assert.doesNotMatch(s, /arquivoCsv|1ª passada/)
  assert.match(s, /ATENÇÃO: "imoveis" é o nome da rota REST/)
  assert.match(montarScript({ fonte: { ...testadas, bfc: 'certidoes-negativas' } }), /Dados\.tributos\.v2\["certidoes-negativas"\]\.buscaTestadas/)
})
