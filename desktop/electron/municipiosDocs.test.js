import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  limparNome, interpretarPastaMunicipio, nomeDocumento, interpretarDocumento, resolverDoc,
  listarMunicipios, criarMunicipio, listarDocumentos, anexar, lerTexto, salvarTexto, renomear,
} from './municipiosDocs.js'

function raizExemplo() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'municipios-'))
  fs.mkdirSync(path.join(raiz, 'Municipios', 'PREFEITURA MUNICIPAL DE CRICIUMA — Criciúma', 'metadados'), { recursive: true })
  fs.writeFileSync(path.join(raiz, 'Municipios', 'PREFEITURA MUNICIPAL DE CRICIUMA — Criciúma', 'metadados', 'x.json'), '{}')
  const origem = path.join(raiz, 'lei.pdf')
  fs.writeFileSync(origem, '%PDF-1.4 teste')
  return { raiz, origem, crici: 'PREFEITURA MUNICIPAL DE CRICIUMA — Criciúma' }
}

test('limparNome tira o que o Windows não aceita', () => {
  assert.equal(limparNome('Lei 1/2021: "REFIS"?  '), 'Lei 1 2021 REFIS')
  assert.equal(limparNome('a.. '), 'a')
})

test('interpretarPastaMunicipio separa entidade e nome', () => {
  assert.deepEqual(interpretarPastaMunicipio('PREFEITURA MUNICIPAL DE CRICIUMA — Criciúma'), { entidade: 'PREFEITURA MUNICIPAL DE CRICIUMA', nome: 'Criciúma' })
  assert.deepEqual(interpretarPastaMunicipio('Ruropólis'), { entidade: null, nome: 'Ruropólis' })
})

test('nomeDocumento e interpretarDocumento são inversos', () => {
  const casos = [
    [{ tipo: 'leis', numero: '524', ano: '2021', assunto: 'PROREFIS', ext: 'pdf' }, 'Lei 524-2021 - PROREFIS.pdf'],
    [{ tipo: 'decretos', numero: '1.234', ano: '', assunto: 'Regulamenta o ITBI', ext: '.PDF' }, 'Decreto 1.234 - Regulamenta o ITBI.pdf'],
    [{ tipo: 'codigo-tributario', numero: '', ano: '2015', assunto: '', ext: 'pdf' }, 'Código Tributário 2015.pdf'],
  ]
  for (const [meta, nome] of casos) {
    assert.equal(nomeDocumento(meta), nome)
    const volta = interpretarDocumento(meta.tipo, nome)
    assert.equal(volta.numero, meta.numero)
    assert.equal(volta.ano, meta.ano)
    assert.equal(volta.assunto, meta.assunto)
  }
  assert.equal(interpretarDocumento('leis', 'Lei 524-2021 - PROREFIS (2).pdf').assunto, 'PROREFIS')
  assert.deepEqual(interpretarDocumento('leis', 'scan_0001.pdf'), { numero: '', ano: '', assunto: 'scan_0001', ext: 'pdf' })
  assert.equal(nomeDocumento({ tipo: 'outros', assunto: 'Planilha de alíquotas', ext: 'csv' }), 'Planilha de alíquotas.csv')
})

test('resolverDoc só aceita arquivos dentro de Municipios/<município>/Legislacao', () => {
  const raiz = path.join(os.tmpdir(), 'r')
  assert.ok(resolverDoc(raiz, 'Criciúma/Legislacao/Leis/a.pdf').endsWith(path.join('Legislacao', 'Leis', 'a.pdf')))
  assert.throws(() => resolverDoc(raiz, 'Criciúma/metadados/x.json'), /fora da pasta/)
  assert.throws(() => resolverDoc(raiz, '../Scripts/a.txt'), /fora da pasta/)
  assert.throws(() => resolverDoc(raiz, 'Criciúma/Legislacao/../../x'), /fora da pasta/)
})

test('listar, criar município, anexar com nome padronizado, sem sobrescrever', () => {
  const { raiz, origem, crici } = raizExemplo()
  assert.equal(criarMunicipio(raiz, 'Ruropólis'), 'Ruropólis')
  assert.throws(() => criarMunicipio(raiz, 'ruropolis'), /Já existe/)
  assert.throws(() => criarMunicipio(raiz, 'criciuma'), /Já existe/)
  const ids = anexar(raiz, crici, 'leis', [origem], { numero: '524', ano: '2021', assunto: 'PROREFIS' })
  assert.deepEqual(ids, [`${crici}/Legislacao/Leis/Lei 524-2021 - PROREFIS.pdf`])
  const [id2] = anexar(raiz, crici, 'leis', [origem], { numero: '524', ano: '2021', assunto: 'PROREFIS' })
  assert.match(id2, /PROREFIS \(2\)\.pdf$/)
  const [semMeta] = anexar(raiz, crici, 'outros', [origem])
  assert.match(semMeta, /Outros\/lei\.pdf$/)
  const { municipios } = listarMunicipios(raiz)
  assert.deepEqual(municipios.map(m => [m.nome, m.documentos]), [['Criciúma', 3], ['Ruropólis', 0]])
  const docs = listarDocumentos(raiz, crici)
  assert.deepEqual(docs.filter(d => d.tipo === 'leis').map(d => d.numero), ['524', '524'])
  assert.throws(() => listarDocumentos(raiz, '../fora'), /inválido/)
})

test('anotação em Markdown: cria, lê, regrava; renomear muda de tipo mantendo a extensão', () => {
  const { raiz, origem, crici } = raizExemplo()
  const id = salvarTexto(raiz, { pasta: crici, titulo: 'Alíquotas de ISS', texto: '# ISS\n2%' })
  assert.match(id, /Anotacoes\/Alíquotas de ISS\.md$/)
  assert.equal(lerTexto(raiz, id).texto, '# ISS\n2%')
  salvarTexto(raiz, { id, texto: '# ISS\n3%' })
  assert.equal(lerTexto(raiz, id).texto, '# ISS\n3%')
  const [lei] = anexar(raiz, crici, 'outros', [origem])
  const novo = renomear(raiz, lei, { tipo: 'decretos', numero: '77', ano: '2020', assunto: 'ITBI' })
  assert.match(novo, /Decretos\/Decreto 77-2020 - ITBI\.pdf$/)
  assert.ok(!fs.existsSync(resolverDoc(raiz, lei)))
  assert.throws(() => salvarTexto(raiz, { id: `${crici}/metadados/x.json`, texto: 'x' }), /fora da pasta/)
})
