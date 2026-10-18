import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lerModelos, salvarModelo, removerModelo, CHAVE_MODELOS } from './modelos.js'

function armazenamento(inicial) {
  const dados = { ...inicial }
  return { getItem: k => dados[k] ?? null, setItem: (k, v) => { dados[k] = v }, dados }
}

const base = { sistemaId: 1, sistemaNome: 'Tributos', metodo: 'POST', path: '/api/guias', modo: 'campos', selecao: {}, valores: {}, json: '', params: {} }

test('lista vazia quando não há nada ou o salvo está corrompido', () => {
  assert.deepEqual(lerModelos(armazenamento()), [])
  assert.deepEqual(lerModelos(armazenamento({ [CHAVE_MODELOS]: '{quebrado' })), [])
})

test('salvar cria com id e data, e o mais recente fica primeiro', () => {
  const a = armazenamento()
  const m1 = salvarModelo(a, { ...base, nome: 'Guias PAGA' }, new Date('2026-10-18T10:00:00Z'))
  const m2 = salvarModelo(a, { ...base, nome: 'Dívidas' }, new Date('2026-10-18T11:00:00Z'))
  assert.ok(m1.id && m2.id && m1.id !== m2.id)
  assert.deepEqual(lerModelos(a).map(m => m.nome), ['Dívidas', 'Guias PAGA'])
})

test('salvar com id existente atualiza no lugar (não duplica)', () => {
  const a = armazenamento()
  const m = salvarModelo(a, { ...base, nome: 'Guias' })
  salvarModelo(a, { ...m, valores: { 'guias.situacao': 'PAGA' } })
  const lista = lerModelos(a)
  assert.equal(lista.length, 1)
  assert.equal(lista[0].valores['guias.situacao'], 'PAGA')
})

test('remover tira só o escolhido', () => {
  const a = armazenamento()
  const m1 = salvarModelo(a, { ...base, nome: 'A' })
  salvarModelo(a, { ...base, nome: 'B' })
  removerModelo(a, m1.id)
  assert.deepEqual(lerModelos(a).map(m => m.nome), ['B'])
})
