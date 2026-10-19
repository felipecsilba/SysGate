import { test } from 'node:test'
import assert from 'node:assert/strict'
import { contar, filtrarItens, grupos, municipios, linguagem, linhaComTermo, rotuloTipoFormula, secoes } from './biblioteca.js'

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

test('rotuloTipoFormula: nome conhecido e fallback legível', () => {
  assert.equal(rotuloTipoFormula('GERACAO_CREDITO_RECEITAS_DIVERSAS'), 'Geração de crédito · Receitas Diversas')
  assert.equal(rotuloTipoFormula('ITBI_TRANSFERENCIA_CREDITOS'), 'ITBI · Transferência de créditos')
  assert.equal(rotuloTipoFormula('NOVO_TIPO_X'), 'Novo tipo x')
  assert.equal(rotuloTipoFormula(null), 'Sem tipo')
})

test('secoes: Scripts por categoria, Fórmulas por tipo (ordem do rótulo), Relatórios sem subdivisão; respeita município', () => {
  const lista = [
    ...itens,
    { id: 'f2', tipo: 'formula', grupo: 'Parcelamentos', codigo: 'DESCONTO_PARCELAMENTO_DIVIDAS', municipio: 'Atibaia', nome: 'Desc' },
    { id: 'f3', tipo: 'formula', grupo: 'ITBI', codigo: 'ITBI_TRANSFERENCIA_CREDITOS', municipio: 'Atibaia', nome: 'T' },
  ]
  lista[3] = { ...lista[3], codigo: 'ITBI_TRANSFERENCIA_CREDITOS' }
  const s = secoes(lista)
  // Ordem pedida: Scripts, Relatórios, Fórmulas
  assert.deepEqual(s.map(x => [x.tipo, x.total]), [['script', 3], ['relatorio', 1], ['formula', 3]])
  assert.deepEqual(s[0].subgrupos.map(g => g.valor), ['Componentes', 'Criticas'])
  assert.deepEqual(s[1].subgrupos, [])
  assert.deepEqual(s[2].subgrupos.map(g => [g.rotulo, g.qtd]), [['ITBI · Transferência de créditos', 2], ['Parcelamento · Desconto em dívidas', 1]])
  const soAtibaia = secoes(lista, 'Atibaia')
  assert.deepEqual(soAtibaia.map(x => x.total), [2, 0, 2])
})

test('filtrarItens com subgrupo: categoria no script, tipo na fórmula', () => {
  const lista = [{ ...itens[3], codigo: 'ITBI_TRANSFERENCIA_CREDITOS' }, itens[1]]
  assert.deepEqual(filtrarItens(lista, { tipo: 'formula', subgrupo: 'ITBI_TRANSFERENCIA_CREDITOS' }).map(i => i.id), ['f1'])
  assert.deepEqual(filtrarItens(lista, { tipo: 'script', subgrupo: 'Criticas' }).map(i => i.id), ['s2'])
})
