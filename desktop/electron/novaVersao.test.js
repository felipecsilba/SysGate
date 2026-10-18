import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classificarMudanca, maisForte } from './novaVersao.js'

test('arquivo da interface compilada pede recarregar', () => {
  assert.equal(classificarMudanca('dist', 'index.html'), 'interface')
  assert.equal(classificarMudanca('dist', 'assets\\index-abc123.js'), 'interface')
})

test('código do backend ou do núcleo do app pede reiniciar', () => {
  assert.equal(classificarMudanca('backend', 'routes\\endpoints.js'), 'completo')
  assert.equal(classificarMudanca('electron', 'main.js'), 'completo')
  assert.equal(classificarMudanca('electron', 'carregando.html'), 'completo')
  assert.equal(classificarMudanca('electron', 'preload.cjs'), 'completo')
})

test('testes, mapas e arquivos temporários não contam', () => {
  assert.equal(classificarMudanca('backend', 'lib\\checagem.test.js'), null)
  assert.equal(classificarMudanca('electron', 'aguardarUrl.test.js'), null)
  assert.equal(classificarMudanca('dist', 'assets\\index.js.map'), null)
  assert.equal(classificarMudanca('backend', 'routes\\x.js~'), null)
  assert.equal(classificarMudanca('backend', null), null)
})

test('maisForte: reiniciar vence recarregar', () => {
  assert.equal(maisForte(null, 'interface'), 'interface')
  assert.equal(maisForte('interface', 'completo'), 'completo')
  assert.equal(maisForte('completo', 'interface'), 'completo')
  assert.equal(maisForte('completo', null), 'completo')
})
