import { test } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { aguardarUrl } from './aguardarUrl.js'

function servidor() {
  return http.createServer((req, res) => res.end('ok'))
}

function ouvir(srv, porta = 0) {
  return new Promise(resolve => srv.listen(porta, '127.0.0.1', () => resolve(srv.address().port)))
}

function portaLivre() {
  const srv = http.createServer()
  return ouvir(srv).then(porta => new Promise(resolve => srv.close(() => resolve(porta))))
}

test('resolve true quando a URL responde', async () => {
  const srv = servidor()
  const porta = await ouvir(srv)
  try {
    assert.equal(await aguardarUrl(`http://127.0.0.1:${porta}/`, { timeoutMs: 2000 }), true)
  } finally {
    srv.close()
  }
})

test('faz retry até o servidor subir', async () => {
  const porta = await portaLivre()
  const srv = servidor()
  setTimeout(() => ouvir(srv, porta), 300)
  try {
    assert.equal(await aguardarUrl(`http://127.0.0.1:${porta}/`, { timeoutMs: 3000, intervaloMs: 100 }), true)
  } finally {
    srv.close()
  }
})

test('resolve false ao estourar o timeout', async () => {
  const porta = await portaLivre()
  const inicio = Date.now()
  assert.equal(await aguardarUrl(`http://127.0.0.1:${porta}/`, { timeoutMs: 400, intervaloMs: 100 }), false)
  assert.ok(Date.now() - inicio < 1500)
})
