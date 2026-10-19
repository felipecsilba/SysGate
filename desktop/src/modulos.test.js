import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GRUPOS, MODULOS, grupoDaRota } from './modulos.js'

test('menu tem os módulos combinados, com ids únicos', () => {
  assert.deepEqual(MODULOS.map(m => m.id), [
    'analisador-json', 'checagem', 'conhecimento', 'notas', 'historico',
    'api',
    'municipios',
    'biblioteca',
    'gerador',
    'sistemas', 'tokens', 'betha-admin', 'importar',
  ])
  assert.equal(new Set(MODULOS.map(m => m.rota)).size, MODULOS.length)
})

test('grupoDaRota acha o grupo do módulo, inclusive em sub-rotas', () => {
  assert.equal(grupoDaRota('/tokens').id, 'configuracoes')
  assert.equal(grupoDaRota('/notas/42').id, 'ferramentas')
  assert.equal(grupoDaRota('/biblioteca').id, 'biblioteca')
})

test('grupoDaRota cai no primeiro grupo para rota desconhecida', () => {
  assert.equal(grupoDaRota('/').id, GRUPOS[0].id)
})
