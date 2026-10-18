import { test } from 'node:test'
import assert from 'node:assert/strict'
import { contar, filtrarItens, grupos, municipios, linguagem, linhaComTermo } from './biblioteca.js'

const itens = [
  { id: 's1', tipo: 'script', grupo: 'Componentes', municipio: 'Atibaia', nome: 'Similaridade Strings', detalhe: null },
  { id: 's2', tipo: 'script', grupo: 'Criticas', municipio: 'Atibaia', nome: 'Alteração de proprietários', detalhe: 'IMOVEIS · ALTERACAO' },
  { id: 's3', tipo: 'script', grupo: 'Criticas', municipio: 'Itaúna', nome: 'Validação', detalhe: 'PARCELAMENTOS · CRIACAO' },
  { id: 'f1', tipo: 'formula', grupo: 'ITBI', municipio: 'Bom Jesus', nome: 'Transferência de créditos', detalhe: 'ITBI_TRANSFERENCIA_CREDITOS · 2026' },
  { id: 'r1', tipo: 'relatorio', grupo: null, municipio: 'Andradas', nome: 'Dividas a prescrever', detalhe: null },
]

test('contar por tipo', () => {
  assert.deepEqual(contar(itens), { script: 3, formula: 1, relatorio: 1 })
})

test('grupos e municípios do tipo com contagem, em ordem alfabética', () => {
  assert.deepEqual(grupos(itens, 'script'), [{ valor: 'Componentes', qtd: 1 }, { valor: 'Criticas', qtd: 2 }])
  assert.deepEqual(municipios(itens, 'script').map(m => m.valor), ['Atibaia', 'Itaúna'])
  assert.deepEqual(grupos(itens, 'relatorio'), [])
})

test('filtrarItens: tipo, grupo, município e busca sem acento no nome, município e detalhe', () => {
  const ids = f => filtrarItens(itens, f).map(i => i.id)
  assert.deepEqual(ids({ tipo: 'script' }), ['s1', 's2', 's3'])
  assert.deepEqual(ids({ tipo: 'script', grupo: 'Criticas' }), ['s2', 's3'])
  assert.deepEqual(ids({ tipo: 'script', municipio: 'Itaúna' }), ['s3'])
  assert.deepEqual(ids({ tipo: 'script', busca: 'PROPRIETARIOS' }), ['s2'])
  assert.deepEqual(ids({ tipo: 'script', busca: 'itauna' }), ['s3'])
  assert.deepEqual(ids({ tipo: 'formula', busca: 'transferencia creditos' }), ['f1']) // várias palavras, em qualquer ordem
  assert.deepEqual(ids({ tipo: 'script', busca: 'parcelamentos' }), ['s3'])
})

test('linguagem do realce pelo nome do arquivo', () => {
  assert.equal(linguagem('Relatorio.jrxml'), 'xml')
  assert.equal(linguagem('fonte_dinamica.txt'), 'codigo')
  assert.equal(linguagem('parametros.txt'), 'texto')
  assert.equal(linguagem('relatorio_info.txt'), 'texto')
})

test('linhaComTermo acha a primeira linha (1-based) sem acento', () => {
  assert.equal(linhaComTermo('a\nb\nCréditos.transferir()', 'creditos'), 3)
  assert.equal(linhaComTermo('a', 'zz'), null)
  assert.equal(linhaComTermo('a', ''), null)
})
