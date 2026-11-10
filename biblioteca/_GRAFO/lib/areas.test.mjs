import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tokens, areaDe } from './areas.mjs'

const areas = [
  { id: 'area:itbi', palavras: ['itbi', 'transferenc'], pastas: ['ITBI-Transferencias'] },
  { id: 'area:imoveis', palavras: ['imove', 'imovel', 'iptu'], pastas: ['Imoveis'] },
  { id: 'area:economicos', palavras: ['economic', 'iss'], pastas: [] },
]

test('tokens: separa camelCase, _ e espaço, sem acento', () => {
  assert.deepEqual(tokens('transferenciasImoveis Débitos_por-Crédito'), ['transferencias', 'imoveis', 'debitos', 'por', 'credito'])
})

test('areaDe: palavra-chave casa pelo começo do token, nunca no meio (iss ≠ emissão)', () => {
  assert.deepEqual(areaDe({ id: 'fonte:transferenciasImoveis', rotulo: 'Transferências de imóveis' }, areas), ['area:imoveis', 'area:itbi'])
  assert.deepEqual(areaDe({ id: 'fonte:emissaoGuias', rotulo: 'Emissão de guias' }, areas), [])
  assert.deepEqual(areaDe({ id: 'tipo-formula:ISS', rotulo: 'ISS' }, areas), ['area:economicos'])
})

test('areaDe: a pasta do conhecimento vence a palavra-chave', () => {
  assert.deepEqual(areaDe({ id: 'conhecimento:imoveis/casos/x', rotulo: 'Transferência de imóvel', pasta: 'Imoveis' }, areas), ['area:imoveis'])
})
