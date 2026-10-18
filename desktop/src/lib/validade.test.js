import { test } from 'node:test'
import assert from 'node:assert/strict'
import { diasRestantes, estadoValidade, limitesData } from './validade.js'

const hoje = new Date(2026, 9, 17, 23, 30) // 17/10/2026 às 23h30, hora local

test('sem data → null', () => {
  assert.equal(diasRestantes(null, hoje), null)
  assert.equal(diasRestantes('', hoje), null)
})

test('conta dias pela data, ignorando hora e fuso (sem o dia a menos do web)', () => {
  // A API devolve meia-noite UTC; em UTC−3 isso cairia no dia anterior
  assert.equal(diasRestantes('2026-10-20T00:00:00.000Z', hoje), 3)
  assert.equal(diasRestantes('2026-10-17T00:00:00.000Z', hoje), 0)
  assert.equal(diasRestantes('2026-10-15', hoje), -2)
})

test('estadoValidade escolhe rótulo e tom', () => {
  assert.equal(estadoValidade(null), null)
  assert.deepEqual(estadoValidade(-1), { rotulo: 'Expirado há 1 dia', tom: 'vermelho' })
  assert.deepEqual(estadoValidade(-3), { rotulo: 'Expirado há 3 dias', tom: 'vermelho' })
  assert.deepEqual(estadoValidade(0), { rotulo: 'Vence hoje', tom: 'laranja' })
  assert.deepEqual(estadoValidade(1), { rotulo: 'Vence amanhã', tom: 'laranja' })
  assert.deepEqual(estadoValidade(7), { rotulo: 'Vence em 7 dias', tom: 'laranja' })
  assert.deepEqual(estadoValidade(8), { rotulo: 'Vence em 8 dias', tom: 'amarelo' })
  assert.deepEqual(estadoValidade(30), { rotulo: 'Vence em 30 dias', tom: 'amarelo' })
  assert.deepEqual(estadoValidade(31), { rotulo: 'Vence em 31 dias', tom: 'verde' })
})

test('limitesData vai de hoje a hoje + 15 dias (validade máxima de um token Betha)', () => {
  assert.deepEqual(limitesData(new Date(2026, 9, 25)), { min: '2026-10-25', max: '2026-11-09' })
})

test('dataMaisDias: hoje + N dias no formato do campo de data (validade do token emitido)', async () => {
  const { dataMaisDias } = await import('./validade.js')
  assert.equal(dataMaisDias(15, new Date(2026, 9, 18, 23, 50)), '2026-11-02')
  assert.equal(dataMaisDias(0, new Date(2026, 0, 31)), '2026-01-31')
})

test('resumoValidade: conta vencidos e o que vence em até 3 dias (o mais próximo)', async () => {
  const { resumoValidade } = await import('./validade.js')
  const hoje = new Date(2026, 9, 18)
  assert.deepEqual(resumoValidade(['2026-10-13', '2026-10-20', '2026-10-30', null], hoje), { vencidos: 1, venceEmDias: 2 })
  assert.deepEqual(resumoValidade(['2026-10-18'], hoje), { vencidos: 1, venceEmDias: null }) // vence hoje = já precisa renovar
  assert.deepEqual(resumoValidade(['2026-10-25', null], hoje), { vencidos: 0, venceEmDias: null })
  assert.deepEqual(resumoValidade([], hoje), { vencidos: 0, venceEmDias: null })
})
