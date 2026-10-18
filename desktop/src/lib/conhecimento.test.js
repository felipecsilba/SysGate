import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseConteudo, montarArtigo, trocarTipo, filtrarArtigos, formDoArtigo } from './conhecimento.js'

test('parseConteudo: JSON de blocos, texto plano antigo e vazio', () => {
  assert.deepEqual(parseConteudo('[{"tipo":"codigo","valor":"x"}]'), [{ tipo: 'codigo', valor: 'x' }])
  assert.deepEqual(parseConteudo('texto antigo'), [{ tipo: 'texto', valor: 'texto antigo' }])
  assert.deepEqual(parseConteudo(''), [{ tipo: 'texto', valor: '' }])
  assert.deepEqual(parseConteudo('[]'), [{ tipo: 'texto', valor: '' }])
})

test('montarArtigo: mesmo formato do web (blocos em JSON; passos vazios descartados)', () => {
  const comum = { titulo: ' Erro 422 ', descricao: ' ', vertical: '', sistema: 'Tributos', etiquetas: ['api'] }
  assert.deepEqual(montarArtigo({ ...comum, tipo: 'erro', blocos: [{ tipo: 'texto', valor: 'a' }], passos: [] }), {
    titulo: 'Erro 422', tipo: 'erro', descricao: null, conteudo: '[{"tipo":"texto","valor":"a"}]', passos: [],
    vertical: null, sistema: 'Tributos', etiquetas: ['api'],
  })
  const p = montarArtigo({ ...comum, tipo: 'passo-a-passo', blocos: [], passos: [{ blocos: [{ tipo: 'texto', valor: '1' }] }, { blocos: [{ tipo: 'texto', valor: ' ' }] }] })
  assert.equal(p.conteudo, '[]')
  assert.deepEqual(p.passos, [{ texto: '[{"tipo":"texto","valor":"1"}]' }])
})

test('formDoArtigo lê o artigo salvo (inclusive passos) de volta para o editor', () => {
  const f = formDoArtigo({ titulo: 'T', tipo: 'passo-a-passo', descricao: null, conteudo: '[]', passos: [{ texto: '[{"tipo":"codigo","valor":"GET"}]' }], vertical: null, sistema: null, etiquetas: [] })
  assert.deepEqual(f.passos, [{ blocos: [{ tipo: 'codigo', valor: 'GET' }] }])
  assert.equal(f.descricao, '')
})

test('trocar para passo a passo: cada linha de texto vira um passo; e de volta', () => {
  const f = { tipo: 'faq', blocos: [{ tipo: 'texto', valor: 'abrir\nclicar' }, { tipo: 'codigo', valor: 'x' }], passos: [] }
  const p = trocarTipo(f, 'passo-a-passo')
  assert.deepEqual(p.passos.map(x => x.blocos[0].valor), ['abrir', 'clicar'])
  const v = trocarTipo(p, 'dica')
  assert.deepEqual(v.blocos, [{ tipo: 'texto', valor: 'abrir' }, { tipo: 'texto', valor: 'clicar' }])
})

test('filtra por busca sem acento (título, resumo, blocos, passos, etiquetas), tipo, vertical e sistema', () => {
  const a = [
    { id: 1, titulo: 'Guia não emite', tipo: 'erro', descricao: null, conteudo: '[{"tipo":"codigo","valor":"POST /api/guias"}]', passos: [], vertical: 'Arrecadação', sistema: 'Tributos', etiquetas: [] },
    { id: 2, titulo: 'Gerar token', tipo: 'passo-a-passo', descricao: 'pelo Betha Admin', conteudo: '[]', passos: [{ texto: '[{"tipo":"texto","valor":"escolher a revenda"}]' }], vertical: null, sistema: null, etiquetas: ['token'] },
  ]
  assert.deepEqual(filtrarArtigos(a, { busca: 'nao emite' }).map(x => x.id), [1])
  assert.deepEqual(filtrarArtigos(a, { busca: '/api/guias' }).map(x => x.id), [1])
  assert.deepEqual(filtrarArtigos(a, { busca: 'revenda' }).map(x => x.id), [2])
  assert.deepEqual(filtrarArtigos(a, { busca: 'admin' }).map(x => x.id), [2])
  assert.deepEqual(filtrarArtigos(a, { tipo: 'erro' }).map(x => x.id), [1])
  assert.deepEqual(filtrarArtigos(a, { vertical: 'Arrecadação', sistema: 'Tributos' }).map(x => x.id), [1])
})
