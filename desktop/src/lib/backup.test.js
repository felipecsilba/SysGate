import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tamanhoLegivel, resumoBackup } from './backup.js'

test('tamanhoLegivel em B, KB, MB e GB com vírgula', () => {
  assert.equal(tamanhoLegivel(512), '512 B')
  assert.equal(tamanhoLegivel(1536), '1,5 KB')
  assert.equal(tamanhoLegivel(190 * 1024 * 1024), '190 MB')
  assert.equal(tamanhoLegivel(2.5 * 1024 ** 3), '2,5 GB')
})

test('resumoBackup junta o que foi enviado e o que não mudou', () => {
  const r = resumoBackup({
    enviados: [
      { tipo: 'banco', nome: 'banco-x.json.gz', tamanho: 2048 },
      { tipo: 'biblioteca', secao: 'Formulas', nome: 'Formulas-x.zip', tamanho: 3 * 1024 * 1024 },
    ],
    pulados: ['Scripts', 'Relatorios'],
  })
  assert.equal(r.enviado, 'banco (2 KB) · Formulas (3 MB)')
  assert.equal(r.semMudanca, 'Scripts, Relatorios')
  assert.equal(resumoBackup({ enviados: [], pulados: [] }).semMudanca, null)
})
