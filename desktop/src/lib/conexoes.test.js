import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CONEXOES, buscarConexoes, conexaoPorId } from './conexoes.js'

test('catálogo: ids únicos, Google Drive disponível, o resto em breve', () => {
  assert.equal(new Set(CONEXOES.map(c => c.id)).size, CONEXOES.length)
  assert.equal(conexaoPorId('google-drive').disponivel, true)
  assert.ok(CONEXOES.filter(c => !c.disponivel).length >= 1)
  assert.equal(conexaoPorId('nao-existe'), undefined)
})

test('disponíveis vêm antes dos que estão em breve', () => {
  const ordem = buscarConexoes('').map(c => c.disponivel)
  assert.deepEqual(ordem, [...ordem].sort((a, b) => Number(b) - Number(a)))
})

test('busca sem acento por nome, descrição ou categoria', () => {
  assert.deepEqual(buscarConexoes('drive').map(c => c.id), ['google-drive'])
  assert.ok(buscarConexoes('ARMAZENAMENTO').some(c => c.id === 'google-drive'))
  assert.ok(buscarConexoes('copia de seguranca').some(c => c.id === 'google-drive')) // "cópia de segurança"
  assert.deepEqual(buscarConexoes('xyz-nada'), [])
})
