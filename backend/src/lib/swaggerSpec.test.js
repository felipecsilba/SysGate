const { test } = require('node:test')
const assert = require('node:assert/strict')
const { metadadosSpec } = require('./swaggerSpec')

test('OpenAPI 3: versão, servers[0] e título', () => {
  assert.deepEqual(
    metadadosSpec({ openapi: '3.0.1', info: { title: 'Tributos' }, servers: [{ url: 'https://tributos.betha.cloud/service-layer' }] }),
    { versao: '3.0.1', urlBase: 'https://tributos.betha.cloud/service-layer', titulo: 'Tributos' }
  )
})

test('Swagger 2: monta a URL com scheme, host e basePath', () => {
  assert.deepEqual(
    metadadosSpec({ swagger: '2.0', host: 'api.x.com', basePath: '/v1', schemes: ['http'] }),
    { versao: '2.0', urlBase: 'http://api.x.com/v1', titulo: null }
  )
  assert.equal(metadadosSpec({ swagger: '2.0', host: 'api.x.com' }).urlBase, 'https://api.x.com')
})

test('sem informação: versão "?" e URL nula', () => {
  assert.deepEqual(metadadosSpec({ paths: {} }), { versao: '?', urlBase: null, titulo: null })
})
