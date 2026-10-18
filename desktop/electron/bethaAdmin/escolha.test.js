import { test } from 'node:test'
import assert from 'node:assert/strict'
import { escolherOpcao, ehPrefeituraDe, chaveLembranca } from './escolha.js'

test('chaveLembranca: por município (entidade/database), por sistema e única para revenda', () => {
  assert.equal(chaveLembranca('entidade', { municipio: 'Rurópolis', sistema: 'Tributos' }), 'entidade|RUROPOLIS')
  assert.equal(chaveLembranca('database', { municipio: 'viseu' }), 'database|VISEU')
  assert.equal(chaveLembranca('sistema', { municipio: 'Viseu', sistema: 'Tributos' }), 'sistema|TRIBUTOS')
  assert.equal(chaveLembranca('revenda', { municipio: 'Viseu' }), 'revenda')
})

const op = (valor, texto) => ({ valor, texto })
const PLACEHOLDER = op('0', '--- Selecione uma Entidade ---')

test('ignora o placeholder (valor 0) e escolhe a única opção real', () => {
  const r = escolherOpcao('revenda', [op('0', '--- Selecione uma Revenda ---'), op('67', 'SISTEMATICA CONTABILIDADE LTDA')], {})
  assert.deepEqual(r, { valor: '67', texto: 'SISTEMATICA CONTABILIDADE LTDA' })
})

test('entidade: acha a prefeitura do município, sem acento e entre câmaras e fundos', () => {
  const opcoes = [PLACEHOLDER, op('12067', 'CAMARA MUNICIPAL DE ALTAMIRA'), op('12031', 'FUNDEB RUROPOLIS'),
    op('12036', 'PREFEITURA MUNICIPAL DE VISEU'), op('12040', 'PREFEITURA MUNICIPAL DE RUROPOLIS')]
  assert.equal(escolherOpcao('entidade', opcoes, { municipio: 'Viseu' }).valor, '12036')
  assert.equal(escolherOpcao('entidade', opcoes, { municipio: 'Rurópolis' }).valor, '12040')
})

test('ehPrefeituraDe aceita as formas usadas pela Betha', () => {
  assert.equal(ehPrefeituraDe('PREFEITURA MUNICIPAL DE VISEU', 'Viseu'), true)
  assert.equal(ehPrefeituraDe('PREFEITURA DE VISEU', 'viseu'), true)
  assert.equal(ehPrefeituraDe('MUNICIPIO DE VISEU', 'Viseu'), true)
  assert.equal(ehPrefeituraDe('MUNICÍPIO DE SÃO JOÃO', 'Sao Joao'), true)
  assert.equal(ehPrefeituraDe('CAMARA MUNICIPAL DE VISEU', 'Viseu'), false)
  assert.equal(ehPrefeituraDe('PREFEITURA MUNICIPAL DE VISEU NOVO', 'Viseu'), false)
})

test('nenhuma ou várias candidatas → pede escolha com as opções reais', () => {
  const opcoes = [PLACEHOLDER, op('1', 'CAMARA MUNICIPAL DE X'), op('2', 'FUNDO DE X')]
  const r = escolherOpcao('entidade', opcoes, { municipio: 'Y' })
  assert.equal(r.precisaEscolher, true)
  assert.deepEqual(r.opcoes.map(o => o.valor), ['1', '2'])
})

test('lembrança salva vence (pelo texto, que não muda entre sessões)', () => {
  const opcoes = [PLACEHOLDER, op('1', 'CAMARA MUNICIPAL DE X'), op('2', 'FUNDO DE X')]
  assert.equal(escolherOpcao('entidade', opcoes, { municipio: 'Y' }, 'FUNDO DE X').valor, '2')
  // lembrança que não existe mais na lista → volta a perguntar
  assert.equal(escolherOpcao('entidade', opcoes, { municipio: 'Y' }, 'SUMIU').precisaEscolher, true)
})

test('sistema: casa pelo nome do sistema no Krakion; database: único ou pelo município', () => {
  const sistemas = [op('0', '--- Selecione ---'), op('58', 'Tributos'), op('12', 'Contábil')]
  assert.equal(escolherOpcao('sistema', sistemas, { sistema: 'tributos' }).valor, '58')
  const bancos = [op('0', '---'), op('1', 'PREFEITURA MUNICIPAL DE VISEU'), op('2', 'PREFEITURA MUNICIPAL DE VISEU - TESTE')]
  assert.equal(escolherOpcao('database', bancos, { municipio: 'Viseu' }).valor, '1')
})

test('lista vazia → erro claro (não pergunta o impossível)', () => {
  assert.equal(escolherOpcao('sistema', [op('0', '---')], { sistema: 'Tributos' }).semOpcoes, true)
})
