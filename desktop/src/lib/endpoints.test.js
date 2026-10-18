import { test } from 'node:test'
import assert from 'node:assert/strict'
import { agruparPorModulo, avisoUrlBase, buscarEndpoints, modulosDe, recursosDoModulo, metodoPadrao, basePath } from './endpoints.js'

const API = [
  { id: 1, modulo: 'dividas (Inscrição em dívida)', path: '/api/dividas', metodo: 'PUT', nome: 'Atualiza' },
  { id: 2, modulo: 'dividas (Inscrição em dívida)', path: '/api/dividas', metodo: 'POST', nome: 'Cria' },
  { id: 3, modulo: 'dividas (Inscrição em dívida)', path: '/api/dividas/{id}', metodo: 'GET', nome: 'Consulta' },
  { id: 4, modulo: 'dividas (Inscrição em dívida)', path: '/api/dividasStatus', metodo: 'POST', nome: 'Status' },
  { id: 5, modulo: 'anistias (Manutenção da dívida)', path: '/api/anistias', metodo: 'POST', nome: 'Cria' },
  { id: 6, modulo: 'economicos', path: '/api/economicos', metodo: 'POST', nome: 'Cria' },
]

test('modulosDe: um item por módulo com contagem de recursos, filtrado sem acento', () => {
  assert.deepEqual(modulosDe(API, 'divida'), [
    { modulo: 'anistias (Manutenção da dívida)', recursos: 1 },
    { modulo: 'dividas (Inscrição em dívida)', recursos: 2 },
  ])
  assert.equal(modulosDe(API, '').length, 3)
})

test('basePath tira só o {param} do final', () => {
  assert.equal(basePath('/api/dividas/{id}'), '/api/dividas')
  assert.equal(basePath('/api/dividas'), '/api/dividas')
  assert.equal(basePath('/api/a/{id}/itens'), '/api/a/{id}/itens')
})

test('recursosDoModulo: /x e /x/{id} são o mesmo recurso — o método se escolhe nos botões', () => {
  assert.deepEqual(recursosDoModulo(API, 'dividas (Inscrição em dívida)').map(r => [r.path, r.metodos.join(','), r.endpoints.length]), [
    ['/api/dividas', 'GET,POST,PUT', 3],
    ['/api/dividasStatus', 'POST', 1],
  ])
})

test('metodoPadrao: POST se houver, senão o primeiro na ordem GET/POST/PUT/PATCH/DELETE', () => {
  assert.equal(metodoPadrao(['PUT', 'POST', 'GET']), 'POST')
  assert.equal(metodoPadrao(['DELETE', 'GET']), 'GET')
})

test('buscarEndpoints: o que bate no path/módulo vem antes do que só bate na descrição (caso real "divida")', () => {
  // Endpoints do SIMAM citam "dívida ativa" na descrição e vinham antes, enchendo o limite;
  // o módulo dividas (o que se usa) ficava de fora
  const simam = Array.from({ length: 70 }, (_, i) => ({
    id: 100 + i, modulo: 'Integração de registros do Simam', path: `/api/simam${i}`, metodo: 'PATCH',
    nome: `Atualiza registros de dívida ativa do SIMAM ${i}`,
  }))
  const reais = [
    { id: 1, modulo: 'dividasMovtosReceitas (Movimentação de dívida - Receitas)', path: '/api/dividasMovtosReceitas', metodo: 'POST', nome: 'Criar' },
    { id: 2, modulo: 'dividas (Inscrição em dívida)', path: '/api/dividas', metodo: 'POST', nome: 'Criar' },
    { id: 3, modulo: 'dividas (Inscrição em dívida)', path: '/api/dividas/{id}', metodo: 'GET', nome: 'Buscar' },
  ]
  const r = buscarEndpoints([...simam, ...reais], 'divida', 60)
  assert.deepEqual(r.slice(0, 3).map(e => e.id), [2, 3, 1]) // /api/dividas (curto) primeiro
  assert.equal(r.length, 60)
  assert.ok(r.slice(3).every(e => e.id >= 100)) // descrição só depois
})

test('buscarEndpoints: cada palavra precisa casar, sem acento, em método/path/nome/módulo', () => {
  const lista = [
    { id: 1, modulo: 'Dívidas', nome: 'Dívidas - Criar', path: '/api/dividas', metodo: 'POST' },
    { id: 2, modulo: 'Dívidas', nome: 'Dívidas - Buscar', path: '/api/dividas/{id}', metodo: 'GET' },
    { id: 3, modulo: 'Econômicos', nome: 'Econômicos - Criar', path: '/api/economicos', metodo: 'POST' },
  ]
  assert.deepEqual(buscarEndpoints(lista, 'dividas post').map(e => e.id), [1])
  assert.deepEqual(buscarEndpoints(lista, 'POST').map(e => e.id), [1, 3])
  assert.deepEqual(buscarEndpoints(lista, 'econ').map(e => e.id), [3])
  assert.deepEqual(buscarEndpoints(lista, '').map(e => e.id), [1, 2, 3])
  assert.equal(buscarEndpoints(lista, '', 2).length, 2)
})

const eps = [
  { id: 1, modulo: 'Econômicos', nome: 'Econômicos - Criar', path: '/api/economicos', metodo: 'POST' },
  { id: 2, modulo: 'Dívidas', nome: 'Dívidas - Buscar', path: '/api/dividas/{id}', metodo: 'GET' },
  { id: 3, modulo: 'Dívidas', nome: 'Dívidas - Criar', path: '/api/dividas', metodo: 'POST' },
]

test('agrupa por módulo em ordem alfabética, itens por path e método', () => {
  const g = agruparPorModulo(eps, '')
  assert.deepEqual(g.map(x => x.modulo), ['Dívidas', 'Econômicos'])
  assert.deepEqual(g[0].itens.map(e => e.id), [3, 2])
})

test('busca sem acento em módulo, nome, path e método', () => {
  assert.deepEqual(agruparPorModulo(eps, 'divida').flatMap(x => x.itens.map(e => e.id)), [3, 2])
  assert.deepEqual(agruparPorModulo(eps, 'economicos').flatMap(x => x.itens.map(e => e.id)), [1])
  assert.deepEqual(agruparPorModulo(eps, 'get').flatMap(x => x.itens.map(e => e.id)), [2])
  assert.deepEqual(agruparPorModulo(eps, 'nada'), [])
})

test('módulo vazio vira "Sem módulo"', () => {
  assert.equal(agruparPorModulo([{ id: 9, modulo: '', nome: 'x', path: '/x', metodo: 'GET' }], '')[0].modulo, 'Sem módulo')
})

test('avisoUrlBase acusa URL terminando em /api', () => {
  assert.match(avisoUrlBase('https://tributos.betha.cloud/service-layer/api'), /\/api\/api/)
  assert.match(avisoUrlBase('https://x.com/api/'), /\/api\/api/)
  assert.equal(avisoUrlBase('https://tributos.betha.cloud/service-layer-tributos'), null)
  assert.equal(avisoUrlBase(''), null)
})

test('nomeRecurso: mesma regra do Krakion web (path em palavras, sem o prefixo do módulo)', async () => {
  const { nomeRecurso } = await import('./endpoints.js')
  const mod = 'dividas (Inscrição em dívida)'
  assert.equal(nomeRecurso({ nome: 'Cria um registro', path: '/api/dividas' }, mod), 'Dividas')
  assert.equal(nomeRecurso({ nome: 'Cria um registro', path: '/api/dividasMovtos' }, mod), 'Movtos')
  assert.equal(nomeRecurso({ nome: 'Cria', path: '/api/dividaDebitoInscrito' }, mod), 'Divida Debito Inscrito')
  assert.equal(nomeRecurso({ nome: 'Econômicos - Informação Complementar', path: '/api/x' }, 'economicos'), 'Informação Complementar')
})
