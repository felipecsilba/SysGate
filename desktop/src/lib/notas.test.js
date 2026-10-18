import { test } from 'node:test'
import assert from 'node:assert/strict'
import { converterTipo, filtrarNotas, previa, normalizarEtiqueta, todasEtiquetas } from './notas.js'

const n = (id, extra) => ({ id, titulo: '', tipo: 'texto', conteudo: '', itens: [], etiquetas: [], fixada: false, ...extra })

test('texto → checklist: cada linha não vazia vira item', () => {
  const r = converterTipo({ tipo: 'texto', conteudo: 'a\n\n b \nc', itens: [] }, 'checklist')
  assert.deepEqual(r, { tipo: 'checklist', conteudo: '', itens: [{ texto: 'a', feito: false }, { texto: 'b', feito: false }, { texto: 'c', feito: false }] })
})

test('lista → código: itens viram linhas; checklist ↔ lista mantém os itens', () => {
  assert.deepEqual(converterTipo({ tipo: 'lista', conteudo: '', itens: [{ texto: 'x' }, { texto: 'y' }] }, 'codigo'), { tipo: 'codigo', conteudo: 'x\ny', itens: [] })
  const itens = [{ texto: 'x', feito: true }]
  assert.deepEqual(converterTipo({ tipo: 'checklist', conteudo: '', itens }, 'lista'), { tipo: 'lista', conteudo: '', itens })
})

test('filtra por busca sem acento (título, conteúdo e itens), tipo e etiqueta', () => {
  const notas = [
    n(1, { titulo: 'Dívidas Viseu' }),
    n(2, { conteudo: 'rodar script de GUIAS' }),
    n(3, { tipo: 'checklist', itens: [{ texto: 'conferir receita' }], etiquetas: ['viseu'] }),
  ]
  assert.deepEqual(filtrarNotas(notas, { busca: 'divida' }).map(x => x.id), [1])
  assert.deepEqual(filtrarNotas(notas, { busca: 'guias' }).map(x => x.id), [2])
  assert.deepEqual(filtrarNotas(notas, { busca: 'receita' }).map(x => x.id), [3])
  assert.deepEqual(filtrarNotas(notas, { tipo: 'checklist' }).map(x => x.id), [3])
  assert.deepEqual(filtrarNotas(notas, { etiqueta: 'viseu' }).map(x => x.id), [3])
})

test('prévia: 1ª linha do texto ou itens; checklist mostra progresso', () => {
  assert.equal(previa(n(1, { conteudo: '\n primeira \nsegunda' })), 'primeira')
  assert.equal(previa(n(2, { tipo: 'lista', itens: [{ texto: 'a' }, { texto: 'b' }] })), 'a · b')
  assert.equal(previa(n(3, { tipo: 'checklist', itens: [{ texto: 'a', feito: true }, { texto: 'b' }] })), '1/2 · a · b')
  assert.equal(previa(n(4)), '')
})

test('etiquetas: minúsculas sem espaço nas pontas; lista única ordenada', () => {
  assert.equal(normalizarEtiqueta('  Viseu '), 'viseu')
  assert.deepEqual(todasEtiquetas([n(1, { etiquetas: ['b', 'a'] }), n(2, { etiquetas: ['a'] })]), ['a', 'b'])
})
