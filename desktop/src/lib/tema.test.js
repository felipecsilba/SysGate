import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolverTema, proximaPreferencia } from './tema.js'

test('preferência explícita ignora o sistema', () => {
  assert.equal(resolverTema('claro', true), 'claro')
  assert.equal(resolverTema('escuro', false), 'escuro')
})

test('"sistema" segue o Windows', () => {
  assert.equal(resolverTema('sistema', true), 'escuro')
  assert.equal(resolverTema('sistema', false), 'claro')
})

test('valor desconhecido é tratado como "sistema"', () => {
  assert.equal(resolverTema('roxo', true), 'escuro')
  assert.equal(resolverTema(undefined, false), 'claro')
})

test('alternador cicla sistema → claro → escuro → sistema', () => {
  assert.equal(proximaPreferencia('sistema'), 'claro')
  assert.equal(proximaPreferencia('claro'), 'escuro')
  assert.equal(proximaPreferencia('escuro'), 'sistema')
  assert.equal(proximaPreferencia('???'), 'claro')
})
