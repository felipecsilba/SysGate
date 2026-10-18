const { test } = require('node:test')
const assert = require('node:assert/strict')
const { setupLocalDisponivel } = require('./setupLocal')

test('disponível no desktop com banco sem usuários', () => {
  assert.equal(setupLocalDisponivel({ KRAKION_DESKTOP: '1' }, 0), true)
})

test('indisponível no desktop quando já existe usuário', () => {
  assert.equal(setupLocalDisponivel({ KRAKION_DESKTOP: '1' }, 1), false)
})

test('indisponível fora do desktop (VPS), mesmo com banco vazio', () => {
  assert.equal(setupLocalDisponivel({}, 0), false)
  assert.equal(setupLocalDisponivel({ KRAKION_DESKTOP: 'true' }, 0), false)
})
