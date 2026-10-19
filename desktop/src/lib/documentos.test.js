import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tituloDocumento, detalheDocumento, visualizacao, agruparDocumentos, urlDocumento, filtrarMunicipios, tamanhoArquivo } from './documentos.js'

test('tamanhoArquivo em B, KB ou MB', () => {
  assert.equal(tamanhoArquivo(512), '512 B')
  assert.equal(tamanhoArquivo(57 * 1024), '57 KB')
  assert.equal(tamanhoArquivo(47 * 1024 * 1024 + 500000), '47,5 MB')
})

const d = (tipo, extra) => ({ tipo, numero: '', ano: '', assunto: '', ext: 'pdf', arquivo: 'x.pdf', ...extra })

test('tituloDocumento: "Lei nº 524/2021", código só com ano, ou o assunto', () => {
  assert.equal(tituloDocumento(d('leis', { numero: '524', ano: '2021', assunto: 'PROREFIS' })), 'Lei nº 524/2021')
  assert.equal(tituloDocumento(d('codigo-tributario', { ano: '2015' })), 'Código Tributário 2015')
  assert.equal(tituloDocumento(d('anotacoes', { assunto: 'Alíquotas de ISS', ext: 'md' })), 'Alíquotas de ISS')
  assert.equal(tituloDocumento(d('outros', { arquivo: 'scan.pdf' })), 'scan.pdf')
})

test('detalheDocumento mostra o assunto quando o título é o número, e o formato', () => {
  assert.equal(detalheDocumento(d('leis', { numero: '524', ano: '2021', assunto: 'PROREFIS' })), 'PROREFIS · PDF')
  assert.equal(detalheDocumento(d('anotacoes', { assunto: 'ISS', ext: 'md' })), 'MD')
})

test('visualizacao por extensão', () => {
  assert.equal(visualizacao('PDF'), 'pdf')
  assert.equal(visualizacao('md'), 'texto')
  assert.equal(visualizacao('csv'), 'csv')
  assert.equal(visualizacao('jpg'), 'imagem')
  assert.equal(visualizacao('docx'), 'externo')
})

test('agruparDocumentos: ordem dos tipos, mais novo primeiro, busca sem acento, grupos vazios somem', () => {
  const docs = [
    d('leis', { numero: '10', ano: '2019' }), d('leis', { numero: '524', ano: '2021', assunto: 'PROREFIS' }),
    d('codigo-tributario', { ano: '2015' }), d('anotacoes', { assunto: 'Alíquotas', ext: 'md' }),
  ]
  const g = agruparDocumentos(docs)
  assert.deepEqual(g.map(x => x.id), ['codigo-tributario', 'leis', 'anotacoes'])
  assert.deepEqual(g[1].docs.map(x => x.numero), ['524', '10'])
  assert.deepEqual(agruparDocumentos(docs, 'prorefis').map(x => x.docs.length), [1])
  assert.deepEqual(agruparDocumentos(docs, 'aliquotas')[0].id, 'anotacoes')
})

test('urlDocumento codifica o caminho inteiro; filtrarMunicipios sem acento', () => {
  assert.equal(urlDocumento('Criciúma/Legislacao/Leis/Lei 1.pdf'), 'krakion-doc://municipios/Crici%C3%BAma%2FLegislacao%2FLeis%2FLei%201.pdf')
  const ms = [{ nome: 'Criciúma', entidade: 'PREFEITURA MUNICIPAL DE CRICIUMA' }, { nome: 'Ruropólis', entidade: null }]
  assert.deepEqual(filtrarMunicipios(ms, 'rurop').map(m => m.nome), ['Ruropólis'])
  assert.equal(filtrarMunicipios(ms, '').length, 2)
})
