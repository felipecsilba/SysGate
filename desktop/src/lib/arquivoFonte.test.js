import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  lerJsonl, caminhosNecessarios, reduzir, montarLotes, mesclarResultados, vazioNoCampo, perfilCampos,
  indexarPorId, concentracao, itemInicial, listarCampos, escolherFonte, CONTEXTO,
} from './arquivoFonte.js'

// Débitos no formato real da fonte: enum como { valor, descricao }, 0 como ausência em id
const debito = (id, extra = {}) => ({
  id, situacao: { valor: 'ABERTO', descricao: 'Aberto' }, ano: 2025, dtVencimento: '2025-03-10',
  idReceitaDiversa: 77, vlTributo: 10.5, referente: { tipo: { valor: 'IMOVEL', descricao: 'Imóvel' } }, ...extra,
})

test('lerJsonl: um registro por linha; linha cortada e não-objeto contam como descartadas', () => {
  const r = lerJsonl('{"id":1}\r\n\n{"id":2}\n[1,2]\n{"id":3,"nome":"cor')
  assert.deepEqual(r.registros, [{ id: 1 }, { id: 2 }])
  assert.equal(r.descartadas, 2)
})

test('caminhosNecessarios junta ids, contexto, onde e quando das regras', () => {
  const c = caminhosNecessarios([{ onde: ['idReceitaDiversa'], quando: { caminhos: ['referente.tipo'] } }], ['ano'])
  for (const k of ['id', 'idIntegracao', 'ano', 'idReceitaDiversa', 'referente.tipo']) assert.ok(c.includes(k), k)
})

test('reduzir guarda só os caminhos pedidos, preservando o aninhamento', () => {
  assert.deepEqual(reduzir(debito(1), ['id', 'referente.tipo', 'naoExiste']), { id: 1, referente: { tipo: { valor: 'IMOVEL', descricao: 'Imóvel' } } })
})

test('montarLotes respeita o limite em BYTES (acento conta 2)', () => {
  const regs = Array.from({ length: 10 }, (_, i) => ({ id: i, nome: 'ã'.repeat(40) }))
  const lotes = montarLotes(regs, ['id', 'nome'], 200)
  for (const l of lotes) assert.ok(new TextEncoder().encode(l).length <= 200, 'lote passou do limite')
  assert.equal(lotes.join('\n').split('\n').length, 10)
})

test('mesclarResultados soma lotes; erro de qualquer lote vale para o todo; n/a + ok = ok', () => {
  const lote = (sev, ap, fa, ids) => ({ regras: [{ regraId: 1, nome: 'R', severidade: sev, aplicaveis: ap, faltam: fa, ids, exemplos: ids.map(id => ({ id })) }], notas: [{ id: 9 }] })
  const m = mesclarResultados([lote('ok', 5, 0, []), lote('erro', 4, 2, [7, 8]), lote('na', 0, 0, [])], { registros: 9, descartadas: 1 })
  assert.equal(m.regras[0].severidade, 'erro')
  assert.equal(m.regras[0].aplicaveis, 9)
  assert.deepEqual(m.regras[0].ids, [7, 8])
  assert.deepEqual(m.resumo, { erros: 1, alertas: 0, ok: 0, naoSeAplicam: 0 })
  assert.equal(m.notas.length, 1)
  assert.equal(mesclarResultados([lote('na', 0, 0, []), lote('ok', 3, 0, [])], { registros: 3 }).regras[0].severidade, 'ok')
})

test('vazioNoCampo: 0 só é vazio em id/código; data 1800-01-01 e objeto vazio são vazios', () => {
  assert.equal(vazioNoCampo('idReceitaDiversa', 0), true)
  assert.equal(vazioNoCampo('credito.codigo', '0'), true)
  assert.equal(vazioNoCampo('vlDesconto', 0), false)
  assert.equal(vazioNoCampo('dtVencimento', '1800-01-01T00:00:00'), true)
  assert.equal(vazioNoCampo('referente', {}), true)
  assert.equal(vazioNoCampo('obs', 'x'), false)
})

test('perfilCampos: status por campo, enum fora do catálogo, ausentes e descrição do catálogo', () => {
  const regs = [debito(1), debito(2, { idReceitaDiversa: 0 }), debito(3, { situacao: { valor: 'XYZ', descricao: '?' }, dtVencimento: null })]
  const catalogo = [
    { campo: 'situacao', tipo: 'SituacaoDebito', eh_enum: true, descricao: 'Situação do débito' },
    { campo: 'idReceitaDiversa', tipo: 'Long', descricao: 'Receita diversa' },
    { campo: 'parcela', tipo: 'Integer' },
    { campo: 'referente', tipo: 'Referente' }, // pai com filhos presentes não conta como ausente
  ]
  const enums = { SituacaoDebito: { values: [{ key: 'ABERTO', description: 'Aberto' }, { key: 'PAGO', description: 'Pago' }] } }
  const p = perfilCampos(regs, catalogo, enums)
  const c = nome => p.campos.find(x => x.campo === nome)
  assert.equal(p.total, 3)
  assert.equal(c('situacao').status, 'alerta')
  assert.deepEqual(c('situacao').foraDoEnum, [{ valor: 'XYZ', qtd: 1 }])
  assert.deepEqual(c('situacao').enumAceitos.map(a => [a.key, a.presente]), [['ABERTO', true], ['PAGO', false]])
  assert.equal(c('idReceitaDiversa').status, 'parcial')
  assert.equal(c('idReceitaDiversa').descricao, 'Receita diversa')
  assert.equal(c('dtVencimento').preenchidos, 2)
  assert.deepEqual(c('dtVencimento').anos, [{ ano: '2025', qtd: 2 }])
  assert.equal(c('vlTributo').status, 'ok')
  assert.equal(c('vlTributo').num.soma, 31.5)
  assert.deepEqual(p.ausentes, ['parcela'])
  assert.equal(p.campos[0].status, 'alerta') // ordem: alerta, parcial, ok, vazio
})

test('concentracao agrupa os registros com falha por situação e ano', () => {
  const regs = [debito(1), debito(2, { ano: 2024 }), debito(3, { ano: 2024 })]
  const d = concentracao([2, 3, 999], indexarPorId(regs))
  assert.deepEqual(d.find(x => x.rotulo === 'Ano').valores, [{ valor: '2024', qtd: 2 }])
  assert.deepEqual(d.find(x => x.rotulo === 'Situação').valores, [{ valor: 'ABERTO', qtd: 2 }])
  assert.deepEqual(concentracao([], indexarPorId(regs)), [])
})

test('itemInicial abre o primeiro erro, senão o primeiro alerta', () => {
  assert.deepEqual(itemInicial({ regras: [{ regraId: 1, severidade: 'ok' }, { regraId: 2, severidade: 'alerta' }, { regraId: 3, severidade: 'erro' }] }), { tipo: 'regra', id: 3 })
  assert.deepEqual(itemInicial({ regras: [{ regraId: 1, severidade: 'ok' }, { regraId: 2, severidade: 'alerta' }] }), { tipo: 'regra', id: 2 })
  assert.equal(itemInicial({ regras: [] }), null)
})

test('listarCampos filtra por status e busca sem acento no nome e na descrição', () => {
  const perfil = { campos: [{ campo: 'situacao', status: 'ok', descricao: 'Situação' }, { campo: 'idObra', status: 'vazio' }], ausentesDetalhe: [{ campo: 'parcela', descricao: null }] }
  const r = listarCampos(perfil, { busca: 'SITUAÇ' })
  assert.deepEqual(r.visiveis.map(c => c.campo), ['situacao'])
  assert.deepEqual(r.contagem, { todos: 3, ok: 1, vazio: 1, ausente: 1 })
  assert.deepEqual(listarCampos(perfil, { status: 'ausente' }).visiveis.map(c => c.campo), ['parcela'])
})

test('escolherFonte prefere o path /<cadastro>', () => {
  const lista = [{ id: 1, nome: 'debitos', path: '/x', operacao: 'busca' }, { id: 2, nome: 'debitos', path: '/debitos', operacao: 'outra' }]
  assert.equal(escolherFonte(lista, 'debitos').id, 2)
  assert.equal(escolherFonte(lista.slice(0, 1), 'debitos').id, 1)
  assert.equal(escolherFonte(lista, 'dividas'), null)
  assert.ok(CONTEXTO.includes('situacao'))
})
