const { test } = require('node:test')
const assert = require('node:assert/strict')
const { mascararCorpo } = require('./mascararCorpo')

test('formulário: campo de senha vira [mascarado], o resto fica', () => {
  const corpo = 'mainForm%3AiRevendas=67&mainForm%3Asenha=MinhaSenha%40123&mainForm%3Aemail='
  assert.equal(mascararCorpo(corpo), 'mainForm%3AiRevendas=67&mainForm%3Asenha=[mascarado]&mainForm%3Aemail=')
})

test('formulário: senha vazia continua vazia (dá para ver que não foi preenchida)', () => {
  assert.equal(mascararCorpo('mainForm%3Asenha=&x=1'), 'mainForm%3Asenha=&x=1')
})

test('JSON: chaves de senha em qualquer nível', () => {
  assert.deepEqual(
    mascararCorpo({ login: 'felipe', password: 'x', dados: { senhaAtual: 'y', nome: 'z' } }),
    { login: 'felipe', password: '[mascarado]', dados: { senhaAtual: '[mascarado]', nome: 'z' } }
  )
})

test('sem corpo ou texto comum: igual', () => {
  assert.equal(mascararCorpo(null), null)
  assert.equal(mascararCorpo('texto qualquer'), 'texto qualquer')
})
