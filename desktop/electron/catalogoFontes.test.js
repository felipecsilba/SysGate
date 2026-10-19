import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { nomeBfc, listarFontes, detalheFonte } from './catalogoFontes.js'

function pastaExemplo() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'catalogo-'))
  fs.mkdirSync(path.join(raiz, 'FontesDeDados'))
  const catalogo = [
    {
      nome: 'debitos', operacao: 'busca', path: '/debitos', natureza: 'LEITURA', descricao: 'Débitos',
      filtros: [{ campo: 'situacao', tipo: 'SituacaoParcela', eh_enum: true }, { campo: 'idCredito', tipo: 'Long', eh_enum: false }],
      ordenacao: [{ campo: 'id' }], parametros_obrigatorios: [], campos_retorno: [{ campo: 'id', tipo: 'Long' }],
      enums: { SituacaoParcela: { values: [{ key: 'ABERTO', description: 'Em aberto' }] } },
    },
    { nome: 'imoveis', operacao: 'buscaTestadas', path: '/imoveis/{idImovel}/testadas', natureza: 'LEITURA', filtros: [], ordenacao: [], parametros_obrigatorios: [{ nome: 'idImovel', tipo: 'Long' }], campos_retorno: [] },
    { nome: 'certidoes-negativas', operacao: 'busca', path: '/certidoes-negativas', natureza: 'LEITURA', filtros: [], ordenacao: [], parametros_obrigatorios: [], campos_retorno: [] },
    { nome: 'imoveis', operacao: 'preenche', path: '/imoveis/campos-adicionais', natureza: 'ESCRITA', filtros: [] },
  ]
  const mapa = {
    por_operacao: { 'debitos|busca|/debitos': { bfc: 'debitos', usos_producao: 1021 } },
    rest_para_bfc: { imoveis: { bfc: 'imoveis', usos_producao: 1760 } },
  }
  fs.writeFileSync(path.join(raiz, 'FontesDeDados', 'catalogo_v2.json'), JSON.stringify(catalogo))
  fs.writeFileSync(path.join(raiz, 'FontesDeDados', 'mapa_bfc_rest.json'), JSON.stringify(mapa))
  return raiz
}

test('nomeBfc: mapa por operação, depois por nome, senão o nome REST sem confirmação', () => {
  const mapa = { por_operacao: { 'a|busca|/a': { bfc: 'aBfc', usos_producao: 3 } }, rest_para_bfc: { b: { bfc: 'bBfc' } } }
  assert.deepEqual(nomeBfc({ nome: 'a', operacao: 'busca', path: '/a' }, mapa), { bfc: 'aBfc', confirmado: true, usos: 3 })
  assert.equal(nomeBfc({ nome: 'b', operacao: 'busca', path: '/b' }, mapa).bfc, 'bBfc')
  assert.deepEqual(nomeBfc({ nome: 'certidoes-negativas', operacao: 'busca', path: '/x' }, mapa), { bfc: 'certidoes-negativas', confirmado: false, usos: 0 })
})

test('listarFontes: só leitura, mais usadas primeiro, com parâmetros obrigatórios', () => {
  const { existe, fontes } = listarFontes(pastaExemplo())
  assert.equal(existe, true)
  assert.deepEqual(fontes.map(f => `${f.bfc}.${f.operacao}`), ['imoveis.buscaTestadas', 'debitos.busca', 'certidoes-negativas.busca'])
  assert.deepEqual(fontes[0].parametros, ['idImovel'])
  assert.equal(fontes.find(f => f.nome === 'certidoes-negativas').confirmado, false)
  assert.equal(listarFontes(path.join(os.tmpdir(), 'nao-existe-xyz')).existe, false)
})

test('detalheFonte: enums dos filtros já com os valores aceitos', () => {
  const raiz = pastaExemplo()
  const d = detalheFonte(raiz, 'debitos|busca|/debitos')
  assert.deepEqual(d.filtros[0].valores, [{ key: 'ABERTO', descricao: 'Em aberto' }])
  assert.deepEqual(d.filtros[1].valores, [])
  assert.deepEqual(d.ordenacao, ['id'])
  assert.equal(detalheFonte(raiz, 'nada|x|/y'), null)
})
