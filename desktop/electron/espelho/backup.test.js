import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { anexarBackup, arquivoBackup } from './backup.js'

test('arquivoBackup: um .jsonl por cadastro e por dia; cadastro inválido é recusado', () => {
  assert.equal(arquivoBackup('/pasta', 'contribuintes', new Date('2026-10-30T12:00:00')), path.join('/pasta', 'contribuintes-2026-10-30.jsonl'))
  assert.throws(() => arquivoBackup('/pasta', '../fora', new Date()), /Cadastro inválido/)
})

test('anexarBackup: acrescenta uma linha JSON por registro, com a hora, sem apagar as anteriores', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'espelho-'))
  const agora = new Date('2026-10-30T12:00:00')
  anexarBackup(pasta, 'bairros', { id: 1, nome: 'Centro' }, agora)
  const arq = anexarBackup(pasta, 'bairros', { id: 2, nome: 'Vila Nova' }, agora)
  const linhas = fs.readFileSync(arq, 'utf8').trim().split('\n').map(l => JSON.parse(l))
  assert.deepEqual(linhas.map(l => l.registro.id), [1, 2])
  assert.equal(linhas[0].salvoEm, agora.toISOString())
})
