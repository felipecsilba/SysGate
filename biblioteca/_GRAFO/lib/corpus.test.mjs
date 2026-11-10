import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lerNomeFormula, lerNomeScript, lerInfoRelatorio, normalizarCodigo, familia, trechos, jaccard, municipioDe } from './corpus.mjs'

test('lerNomeFormula: tipo, descrição e ano; id numérico vira descrição', () => {
  assert.deepEqual(lerNomeFormula('Andradas - GERACAO_CREDITO_IMOVEIS - IPTU - Valor Venal - 2026.txt'),
    { municipio: 'Andradas', tipoFormula: 'GERACAO_CREDITO_IMOVEIS', descricao: 'IPTU - Valor Venal', ano: '2026' })
  assert.deepEqual(lerNomeFormula('Atibaia - FORMULA_ACRESCIMO_DEBITO - 38951 - 1900.txt'),
    { municipio: 'Atibaia', tipoFormula: 'FORMULA_ACRESCIMO_DEBITO', descricao: '38951', ano: '1900' })
  assert.deepEqual(lerNomeFormula('Criciúma - Fórmula sem tipo no nome.txt'),
    { municipio: 'Criciúma', tipoFormula: null, descricao: 'Fórmula sem tipo no nome', ano: null })
})

test('lerNomeScript: subtipo pela pasta; crítica traz cadastro e evento', () => {
  assert.deepEqual(lerNomeScript('Fontes Dinamicas', 'Andradas - FONTE GUIA UNIFICADA COM PIX.txt'),
    { municipio: 'Andradas', subtipo: 'fonte-dinamica', titulo: 'FONTE GUIA UNIFICADA COM PIX' })
  assert.deepEqual(lerNomeScript('Criticas', "Atibaia - IMOVEIS - {'identificador'_ 'ALTERACAO', 'tipo'_ 'NATUREZA', 'compartilhado'_ False} - Alteração de proprietários dos imóveis.txt"),
    { municipio: 'Atibaia', subtipo: 'critica', titulo: 'Alteração de proprietários dos imóveis', cadastro: 'IMOVEIS', evento: 'ALTERACAO' })
  assert.equal(lerNomeScript('Componentes', 'Lagoa Santa - enumerador.txt').subtipo, 'componente')
  assert.equal(lerNomeScript('Scripts', 'Andradas - 01 - REATIVA ACORDOS.txt').titulo, '01 - REATIVA ACORDOS')
})

test('lerInfoRelatorio: título, descrição e chaveNatureza; nada de createdBy', () => {
  const t = `══════
  RELATÓRIO      : [PMA-MC] Espelho do IPTU
  ID (Referência): 3167745
  Metadados adicionais:
    titulo                          : [PMA-MC] Espelho do IPTU
    descricao                       : Este relatório não foi desenvolvido pra ser utilizado pelo F4.
    chaveNatureza                   : ESPELHO_CADASTRAL_IMOVEL
    createdBy                       : fulano.de.tal`
  assert.deepEqual(lerInfoRelatorio(t), { titulo: '[PMA-MC] Espelho do IPTU', descricao: 'Este relatório não foi desenvolvido pra ser utilizado pelo F4.', chaveNatureza: 'ESPELHO_CADASTRAL_IMOVEL' })
  assert.deepEqual(lerInfoRelatorio('  RELATÓRIO      : Só o título'), { titulo: 'Só o título', descricao: null, chaveNatureza: null })
})

test('familia: igual com comentário, espaço e quebra de linha diferentes; diferente com código diferente', () => {
  const a = 'x = Dados.tributos.v2.imoveis.busca()\n// comentário de Andradas\nimprimir x'
  const b = '/* versão de Atibaia */\nx  =  Dados.tributos.v2.imoveis.busca()\r\n\r\nimprimir x  '
  assert.equal(normalizarCodigo(a), normalizarCodigo(b))
  assert.equal(familia(a), familia(b))
  assert.notEqual(familia(a), familia('x = 1'))
  assert.match(familia(a), /^[0-9a-f]{12}$/)
})

test('trechos + jaccard: idênticos = 1, adaptação leve alta, código diferente baixa', () => {
  const base = 'fonte = Dados.tributos.v2.imoveis\nlista = fonte.busca(criterio: "codigo >= 1", campos: "id, codigo")\nlista.each { imovel ->\n  imprimir imovel.codigo\n  total = total + 1\n}\nimprimir total'
  const adaptado = base.replace('"codigo >= 1"', '"codigo >= 500"').replace('imprimir total', 'imprimir "Total: " + total')
  const outro = 'valor = receita.valor * 0.02\nretornar valor'
  assert.equal(jaccard(trechos(base), trechos(base)), 1)
  assert.ok(jaccard(trechos(base), trechos(adaptado)) > 0.6)
  assert.ok(jaccard(trechos(base), trechos(outro)) < 0.05)
  assert.equal(jaccard(trechos(''), trechos('')), 0)
})

test('municipioDe: slug estável; Bom Jesus marcado ambíguo', () => {
  assert.deepEqual(municipioDe('Jaraguá do Sul'), { id: 'municipio:jaragua-do-sul', tipo: 'municipio', rotulo: 'Jaraguá do Sul' })
  assert.deepEqual(municipioDe('Bom Jesus').notas, ['⚠ Dois municípios diferentes chamados Bom Jesus estão misturados neste prefixo (ver biblioteca/README.md). Não dá para saber de qual prefeitura é cada arquivo.'])
})
