import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { interpretarNome, lerCabecalho, resolverDentro, indexar, lerItem, buscarConteudo } from './biblioteca.js'

function pastaExemplo() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'biblioteca-'))
  const escrever = (rel, texto) => {
    fs.mkdirSync(path.dirname(path.join(raiz, rel)), { recursive: true })
    fs.writeFileSync(path.join(raiz, rel), texto)
  }
  escrever('Scripts/Componentes/Atibaia - Similaridade Strings.txt', 'def similar(a, b) {\n  retornar a == b\n}')
  escrever("Scripts/Criticas/Atibaia - IMOVEIS - {'identificador'_ 'ALTERACAO', 'tipo'_ 'NATUREZA', 'compartilhado'_ False} - Alteração de proprietários.txt", 'se (imovel) { erro("Proprietário") }')
  escrever('Formulas/ITBI/Bom Jesus - 1787182060739823900 - ITBI_TRANSFERENCIA_CREDITOS - Transferência de créditos - 2026.txt',
    '// Descrição         : Transferência de créditos\n// ID                : 298283\n// Tipo Lançamento   : None\n\n//inicio\nCreditos.transferir()')
  escrever('Relatorios/Andradas - Dividas a prescrever/Dividas a prescrever.jrxml', '<jasperReport/>')
  escrever('Relatorios/Andradas - Dividas a prescrever/fonte_dinamica.txt', 'fonte = Dados.dividas.v1')
  escrever('Relatorios/Andradas - Dividas a prescrever/parametros.txt', 'Nome : DtInicio')
  escrever('Relatorios/Andradas - Dividas a prescrever/relatorio_info.txt', 'RELATÓRIO : Dividas a prescrever')
  escrever('Formulas/leia-me.md', 'ignorado: não está numa área')
  return raiz
}

test('interpretarNome: fórmula com id, código e ano', () => {
  assert.deepEqual(interpretarNome('formula', 'Bom Jesus - 1787182060739823900 - ITBI_TRANSFERENCIA_CREDITOS - Transferência de créditos - 2026.txt'),
    { municipio: 'Bom Jesus', nome: 'Transferência de créditos', detalhe: 'ITBI_TRANSFERENCIA_CREDITOS · 2026', ano: '2026', codigo: 'ITBI_TRANSFERENCIA_CREDITOS' })
  assert.equal(interpretarNome('formula', 'Atibaia - CONVENIO_BANCARIO - FEBRABAN CNAB 240 - 2026.txt').nome, 'FEBRABAN CNAB 240')
})

test('interpretarNome: crítica separa área e evento; script simples fica com o resto do nome', () => {
  assert.deepEqual(interpretarNome('script', "Atibaia - PARCELAMENTOS - {'identificador'_ 'CRIACAO', 'tipo'_ 'NATUREZA'} - [PMA] - BLOQUEIA PARCELAMENTO.txt"),
    { municipio: 'Atibaia', nome: '[PMA] - BLOQUEIA PARCELAMENTO', detalhe: 'PARCELAMENTOS · CRIACAO' })
  assert.deepEqual(interpretarNome('script', 'Atibaia - [DEV] Base64 Encoder.txt'), { municipio: 'Atibaia', nome: '[DEV] Base64 Encoder', detalhe: null })
  assert.equal(interpretarNome('relatorio', 'Andradas - Certidão - Não').nome, 'Certidão - Não')
})

test('lerCabecalho pega "// Chave : Valor" do topo e ignora None', () => {
  const meta = lerCabecalho('// Descrição : Transferência\n// ID   : 298283\n// Tipo Lançamento : None\n\n//inicio\nx = 1 // Obs: não é cabeçalho')
  assert.deepEqual(meta, [['Descrição', 'Transferência'], ['ID', '298283']])
  assert.deepEqual(lerCabecalho('se (x) {}'), [])
})

test('resolverDentro barra caminho que sai da biblioteca', () => {
  const raiz = path.join(os.tmpdir(), 'bib')
  assert.equal(resolverDentro(raiz, 'Scripts/a.txt'), path.join(raiz, 'Scripts', 'a.txt'))
  assert.throws(() => resolverDentro(raiz, '../segredo.txt'), /fora da biblioteca/)
  assert.throws(() => resolverDentro(raiz, 'C:/Windows/win.ini'), /fora da biblioteca/)
})

test('indexar lista scripts, fórmulas e relatórios só pelos nomes', async () => {
  const raiz = pastaExemplo()
  const { existe, itens } = await indexar(raiz)
  assert.equal(existe, true)
  assert.deepEqual(itens.map(i => i.tipo).sort(), ['formula', 'relatorio', 'script', 'script'])
  const rel = itens.find(i => i.tipo === 'relatorio')
  assert.equal(rel.id, 'Relatorios/Andradas - Dividas a prescrever')
  assert.equal(itens.find(i => i.tipo === 'formula').grupo, 'ITBI')
  assert.equal((await indexar(path.join(raiz, 'nao-existe'))).existe, false)
})

test('lerItem: fórmula traz texto e metadados; relatório traz os arquivos na ordem útil', async () => {
  const raiz = pastaExemplo()
  const { itens } = await indexar(raiz)
  const f = await lerItem(raiz, itens.find(i => i.tipo === 'formula').id)
  assert.match(f.arquivos[0].texto, /Creditos\.transferir/)
  assert.deepEqual(f.meta[0], ['Descrição', 'Transferência de créditos'])
  const r = await lerItem(raiz, 'Relatorios/Andradas - Dividas a prescrever')
  assert.deepEqual(r.arquivos.map(a => a.rotulo), ['Fonte dinâmica', 'Layout (jrxml)', 'Parâmetros', 'Informações'])
  await assert.rejects(lerItem(raiz, '../fora'), /fora da biblioteca/)
})

test('buscarConteudo acha sem acento, dentro das pastas de relatório, e devolve a linha', async () => {
  const raiz = pastaExemplo()
  const { itens } = await indexar(raiz)
  const ids = itens.map(i => i.id)
  const r = await buscarConteudo(raiz, ids, 'PROPRIETARIO')
  assert.equal(r.achados.length, 1)
  assert.equal(r.achados[0].linha, 1)
  assert.match(r.achados[0].trecho, /Proprietário/)
  assert.equal((await buscarConteudo(raiz, ids, 'dados.dividas')).achados[0].arquivo, 'fonte_dinamica.txt')
  assert.deepEqual((await buscarConteudo(raiz, ids, 'ab')).achados, []) // menos de 3 letras não busca
  assert.equal((await buscarConteudo(raiz, ids, 'e', { limite: 1 })).achados.length, 0)
})
