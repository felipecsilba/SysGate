import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { hashArquivo, precisaAplicarSchema } from './schemaHash.js'

test('aplica quando nunca foi aplicado', () => {
  assert.equal(precisaAplicarSchema('abc', undefined), true)
})

test('aplica quando o hash mudou', () => {
  assert.equal(precisaAplicarSchema('abc', 'xyz'), true)
})

test('não aplica quando o hash é o mesmo', () => {
  assert.equal(precisaAplicarSchema('abc', 'abc'), false)
})

test('hashArquivo é estável e muda com o conteúdo', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'schema-'))
  const arq = path.join(dir, 'schema.prisma')
  fs.writeFileSync(arq, 'model A { id Int @id }')
  const h1 = hashArquivo(arq)
  assert.match(h1, /^[0-9a-f]{64}$/)
  assert.equal(hashArquivo(arq), h1)
  fs.writeFileSync(arq, 'model B { id Int @id }')
  assert.notEqual(hashArquivo(arq), h1)
  fs.rmSync(dir, { recursive: true })
})
