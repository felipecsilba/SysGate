import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nomeModulo, nomeCadastro, opcoesCadastros, marcacaoRedundante, filtrarCamposSpec, aplicarMarcacao, ROTULO_SPEC } from './checagem.js'

test('nomeModulo usa o texto entre parênteses do Swagger', () => {
  assert.equal(nomeModulo('dividas (Inscrição em dívida)'), 'Inscrição em dívida')
  assert.equal(nomeModulo('Imóveis'), 'Imóveis')
  assert.equal(nomeModulo(null), 'Geral')
})

test('nomeCadastro tira o "Cria um registro de" repetido', () => {
  assert.equal(nomeCadastro({ nome: 'Cria um registro de Dívidas', path: '/api/dividas' }), 'Dívidas')
  assert.equal(nomeCadastro({ nome: '', path: '/api/x' }), '/api/x')
})

test('opcoesCadastros: rótulo legível com módulo e marcações, ordenado, valor = path', () => {
  const ops = opcoesCadastros([
    { path: '/api/imoveis', nome: 'Cria um registro de Imóveis', modulo: 'imoveis (Imobiliário)', marcacoes: 0 },
    { path: '/api/dividas', nome: 'Cria um registro de Dívidas', modulo: 'dividas (Inscrição em dívida)', marcacoes: 2 },
  ])
  assert.deepEqual(ops.map(o => o.valor), ['/api/dividas', '/api/imoveis'])
  assert.equal(ops[0].rotulo, 'Dívidas · Inscrição em dívida · 2 marcados')
  assert.equal(ops[1].rotulo, 'Imóveis · Imobiliário')
})

test('marcação igual à spec e sem observação é redundante (apagar em vez de gravar)', () => {
  const c = { obrigatorioSpec: false }
  assert.equal(marcacaoRedundante(c, false, '  '), true)
  assert.equal(marcacaoRedundante(c, true, ''), false)
  assert.equal(marcacaoRedundante(c, false, 'quebra o cancelamento'), false)
})

test('aplicarMarcacao atualiza o campo e recalcula "marcado"', () => {
  const lista = [{ caminho: 'a', obrigatorioSpec: false, obrigatorio: false, marcado: false, observacao: '' }, { caminho: 'b' }]
  const r = aplicarMarcacao(lista, 'a', true, '')
  assert.deepEqual(r[0], { caminho: 'a', obrigatorioSpec: false, obrigatorio: true, marcado: true, observacao: '' })
  assert.equal(aplicarMarcacao(r, 'a', false, '')[0].marcado, false)
  assert.equal(r[1], lista[1])
})

test('filtrarCamposSpec: busca sem acento no caminho e na descrição; só obrigatórios', () => {
  const campos = [
    { caminho: 'dividas.sistemaOrigem', descricao: 'Sistema de origem', obrigatorio: false },
    { caminho: 'dividas.idPessoa', descricao: 'Pessoa', obrigatorio: true },
  ]
  assert.deepEqual(filtrarCamposSpec(campos, { busca: 'ORIGÉM' }).map(c => c.caminho), ['dividas.sistemaOrigem'])
  assert.deepEqual(filtrarCamposSpec(campos, { soObrigatorios: true }).map(c => c.caminho), ['dividas.idPessoa'])
  assert.equal(filtrarCamposSpec(campos, {}).length, 2)
  assert.equal(ROTULO_SPEC.desconhecido, 'Campo inexistente')
})
