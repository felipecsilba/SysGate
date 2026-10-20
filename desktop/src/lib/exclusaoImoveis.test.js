import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lerLevantamento, analisar, montarPlano, idDoIdIntegracao, aplicarRetorno, ETAPAS } from './exclusaoImoveis.js'

const vazio = { proprietarios: [], corresponsaveis: [], testadas: [], englobados: [], historico: [], movimentacoes: [], movimentacoesInscricao: [], beneficiosFiscais: 0 }
const fin0 = { debitos: 0, dividas: 0, parcelamentos: 0, lancamentos: 0, receitasDiversas: 0 }
const imovel = (id, codigo, filhos = {}, financeiro = {}, existe = true) =>
  ({ idImovel: id, existe, codigo, filhos: { ...vazio, ...filhos }, financeiro: { ...fin0, ...financeiro }, livre: existe && !Object.values({ ...fin0, ...financeiro }).some(Boolean) })

test('lerLevantamento: JSONL do zip ou colado do console (com hora na frente); ignora lixo e repetidos', () => {
  const texto = [
    JSON.stringify(imovel(1, 11)),
    '01:20:09 - ' + JSON.stringify(imovel(2, 12)),
    '',
    '01:20:09 - ------------------------------------------------------------',
    '{"idImovel": 3, "existe": tr', // cortada
    JSON.stringify(imovel(1, 11)), // repetido
    JSON.stringify({ outra: 'coisa' }),
  ].join('\n')
  const r = lerLevantamento(texto)
  assert.deepEqual(r.imoveis.map(i => i.idImovel), [1, 2])
  assert.equal(r.descartadas, 3)
})

test('analisar: livres entram no plano; financeiro, não encontrado e filho não validado vão para revisão', () => {
  const a = analisar([
    imovel(1, 11, { movimentacoesInscricao: [{ id: 9, idMovimentacao: 0 }] }),
    imovel(2, 12, { proprietarios: [70, 71], movimentacoes: [80], historico: ['5', '6'], movimentacoesInscricao: [{ id: 10, idMovimentacao: 0 }] }),
    imovel(3, 13, {}, { dividas: 2 }),
    imovel(4, 14, {}, {}, false),
    imovel(5, 15, { testadas: [55] }),
    imovel(6, 16, { beneficiosFiscais: 1, corresponsaveis: [4] }),
  ])
  assert.equal(a.total, 6)
  assert.deepEqual(a.noPlano.map(i => i.idImovel), [1, 2])
  assert.deepEqual(a.comFinanceiro.map(i => i.codigo), [13])
  assert.match(a.comFinanceiro[0].motivo, /dívidas: 2/)
  assert.deepEqual(a.inexistentes.map(i => i.idImovel), [4])
  assert.deepEqual(a.revisar.map(i => [i.codigo, i.motivo]), [[15, 'testadas: 1 (exclusão ainda não validada)'], [16, 'corresponsáveis: 1, benefícios fiscais: 1 (exclusão ainda não validada)']])
  const dep = Object.fromEntries(a.porDependencia.map(d => [d.chave, d]))
  assert.deepEqual([dep.proprietarios.registros, dep.proprietarios.imoveis], [2, 1])
  assert.deepEqual([dep.movimentacoesInscricao.registros, dep.movimentacoesInscricao.imoveis], [2, 2])
  assert.deepEqual([dep.historico.registros, dep.historico.imoveis], [2, 1])
  assert.deepEqual([dep.testadas.registros, dep.testadas.imoveis], [1, 1])
})

test('montarPlano: etapas na ordem da receita, lotes de até 50, etapa sem itens não gera lote', () => {
  const imoveis = Array.from({ length: 120 }, (_, k) => imovel(1000 + k, 11 + k, { movimentacoesInscricao: [{ id: k, idMovimentacao: 0 }] }))
  imoveis[0] = imovel(1000, 11, { proprietarios: [70], movimentacoes: [80, 81], movimentacoesInscricao: [{ id: 1, idMovimentacao: 0 }] })
  const plano = montarPlano(imoveis)
  assert.deepEqual(plano.map(e => e.chave), ETAPAS.map(e => e.chave))
  assert.deepEqual(plano.map(e => e.chave), ['proprietarios', 'movimentacoes', 'inscricao', 'imoveis'])
  const [prop, mov, insc, imv] = plano
  assert.equal(prop.itens.length, 1)
  assert.deepEqual(prop.lotes[0].body, [{ idIntegracao: 'EXCL-RESP-70', imoveisResponsaveis: { idGerado: { id: 70 } } }])
  assert.equal(mov.lotes[0].body.length, 2)
  assert.equal(mov.lotes[0].body[1].imoveisMovimentacoes.idGerado.id, 81)
  assert.deepEqual(insc.lotes.map(l => l.body.length), [50, 50, 20])
  assert.deepEqual(insc.lotes[0].body[0], { idImovel: 1000 })
  assert.equal(insc.metodo, 'PUT')
  assert.deepEqual(imv.lotes.map(l => l.body.length), [50, 50, 20])
  assert.deepEqual(imv.lotes[2].body[19], { idIntegracao: 'EXCL-IMOVEL-1119', imoveis: { idGerado: { id: 1119 } } })
  assert.equal(imv.lotes[1].indice, 2)
})

test('montarPlano: NUNCA gera lote vazio — sem inscrição, a etapa do PUT fica sem lotes', () => {
  const plano = montarPlano([imovel(1, 11), imovel(2, 12)])
  const insc = plano.find(e => e.chave === 'inscricao')
  assert.equal(insc.itens.length, 0)
  assert.deepEqual(insc.lotes, [])
  for (const e of plano) for (const l of e.lotes) assert.ok(l.body.length > 0)
  assert.deepEqual(montarPlano([]).flatMap(e => e.lotes), [])
})

test('idDoIdIntegracao e aplicarRetorno: status de cada id a partir do retorno do lote', () => {
  assert.equal(idDoIdIntegracao('EXCL-IMOVEL-34631457'), 34631457)
  assert.equal(idDoIdIntegracao('INTEGRACAO1'), null)
  const status = aplicarRetorno({}, { status: 'parcial', erros: [{ idIntegracao: 'EXCL-IMOVEL-2', mensagem: 'em uso' }] }, [1, 2, 3])
  assert.deepEqual(status, { 1: { ok: true }, 2: { ok: false, mensagem: 'em uso' }, 3: { ok: true } })
  assert.deepEqual(aplicarRetorno({ 9: { ok: true } }, { status: 'erro', mensagem: 'HTTP 401' }, [4]), { 9: { ok: true }, 4: { ok: false, mensagem: 'HTTP 401' } })
})
