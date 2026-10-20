import { test } from 'node:test'
import assert from 'node:assert/strict'
import { agruparPorCategoria, chamadaFonte, descricaoAcao } from './mapa.js'

const nos = [
  { recurso: 'a', categoria: 'cadastro', status: 'confirmado' },
  { recurso: 'b', categoria: 'financeiro', status: 'inferido' },
  { recurso: 'c', categoria: 'cadastro', status: 'inferido' },
  { recurso: 'd', categoria: 'documentos', status: 'inferido' },
]

test('agruparPorCategoria: na ordem Cadastro, Financeiro, Documentos, só os grupos com nós', () => {
  const g = agruparPorCategoria(nos)
  assert.deepEqual(g.map(x => x.categoria), ['cadastro', 'financeiro', 'documentos'])
  assert.deepEqual(g[0].nos.map(n => n.recurso), ['a', 'c'])
  assert.equal(g[1].rotulo, 'Financeiro')
})

test('agruparPorCategoria: filtros de categoria e "só confirmados"', () => {
  assert.deepEqual(agruparPorCategoria(nos, { categorias: new Set(['cadastro']) }).map(x => x.categoria), ['cadastro'])
  const so = agruparPorCategoria(nos, { soConfirmados: true })
  assert.deepEqual(so.flatMap(x => x.nos).map(n => n.recurso), ['a'])
})

test('chamadaFonte: criterio pelo filtro, parametros pelo parâmetro, nada sem fonte', () => {
  assert.equal(chamadaFonte({ bfc: 'imoveis.movimentacoes', filtro: 'idImovel' }), 'Dados.tributos.v2.imoveis.movimentacoes.busca(criterio: "idImovel in (…)")')
  assert.equal(chamadaFonte({ bfc: 'imovel.testadas', parametro: 'idImovel' }), 'Dados.tributos.v2.imovel.testadas.busca(parametros: ["idImovel": …])')
  assert.equal(chamadaFonte({ bfc: 'guiasUnificadas', semLigacao: true }), 'Dados.tributos.v2.guiasUnificadas.busca(…)')
  assert.equal(chamadaFonte(null), null)
})

test('descricaoAcao: o que fazer com o nó', () => {
  assert.equal(descricaoAcao({ acao: 'saiJunto', saiCom: 'imoveisMovimentacoes' }, r => r === 'imoveisMovimentacoes' ? 'Movimentações' : r), 'Sai junto com Movimentações — não exclua à parte')
  assert.equal(descricaoAcao({ acao: 'reprocessar' }), 'Derivado — reprocessar (sem DELETE)')
  assert.equal(descricaoAcao({ acao: 'excluir', temDelete: true }), 'Excluir pelo DELETE')
  assert.equal(descricaoAcao({ acao: null, temDelete: false }), 'Sem DELETE na API')
})
