import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'
import { criarZip, lerZip } from './zip.js'
import { listarArquivos, impressao } from './impressao.js'
import { paraApagar, carimbo } from './retencao.js'
import { exportarBanco } from './exportarBanco.js'

const tmp = t => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-')); t.after(() => fs.rmSync(d, { recursive: true, force: true })); return d }
const escrever = (base, rel, conteudo) => { const p = path.join(base, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, conteudo); return p }

test('zip: ida e volta com acento, pasta aninhada, binário e arquivo vazio', async t => {
  const d = tmp(t)
  const binario = crypto.randomBytes(300_000)
  const arquivos = [
    { caminho: escrever(d, 'src/Fórmulas/IPTU — Criciúma.txt', 'valor = área * 2'), nome: 'Fórmulas/IPTU — Criciúma.txt' },
    { caminho: escrever(d, 'src/bin.dat', binario), nome: 'bin.dat' },
    { caminho: escrever(d, 'src/vazio.txt', ''), nome: 'vazio.txt' },
  ]
  const destino = path.join(d, 'saida.zip')
  const r = await criarZip(destino, arquivos)
  assert.equal(r.entradas, 3)
  assert.equal(r.tamanho, fs.statSync(destino).size)
  const lido = lerZip(destino)
  assert.deepEqual(lido.map(e => e.nome), arquivos.map(a => a.nome))
  assert.equal(lido[0].conteudo.toString(), 'valor = área * 2')
  assert.ok(lido[1].conteudo.equals(binario))
  assert.equal(lido[2].conteudo.length, 0)
})

test('zip: sem arquivos gera um zip vazio válido', async t => {
  const d = tmp(t)
  await criarZip(path.join(d, 'v.zip'), [])
  assert.deepEqual(lerZip(path.join(d, 'v.zip')), [])
})

test('impressão muda com conteúdo, data ou arquivo novo; ignora __pycache__', async t => {
  const d = tmp(t)
  const a = escrever(d, 'x/a.txt', 'um')
  escrever(d, 'x/sub/b.txt', 'dois')
  const lista = listarArquivos(path.join(d, 'x'))
  assert.deepEqual(lista.map(f => f.nome), ['a.txt', 'sub/b.txt'])
  const h1 = impressao(lista)
  assert.equal(impressao(listarArquivos(path.join(d, 'x'))), h1)

  escrever(d, 'x/__pycache__/c.pyc', 'lixo')
  assert.equal(impressao(listarArquivos(path.join(d, 'x'))), h1)

  fs.writeFileSync(a, 'umm')
  const h2 = impressao(listarArquivos(path.join(d, 'x')))
  assert.notEqual(h2, h1)

  fs.utimesSync(a, new Date(2020, 0, 1), new Date(2020, 0, 1))
  assert.notEqual(impressao(listarArquivos(path.join(d, 'x'))), h2)

  escrever(d, 'x/novo.txt', '')
  assert.ok(listarArquivos(path.join(d, 'x')).some(f => f.nome === 'novo.txt'))
})

test('carimbo de data ordena como texto', () => {
  assert.equal(carimbo(new Date(2026, 9, 20, 9, 5, 7)), '2026-10-20_090507')
})

test('retenção mantém os N mais recentes de cada grupo', () => {
  const arquivos = [
    'banco-2026-10-18_0900.json.gz', 'banco-2026-10-20_0900.json.gz', 'banco-2026-10-19_0900.json.gz',
    'Formulas-2026-10-01_1000.zip', 'Formulas-2026-10-02_1000.zip', 'Scripts-2026-10-01_1000.zip',
    'outra-coisa.txt',
  ].map((name, i) => ({ id: `id${i}`, name }))
  const apagar = paraApagar(arquivos, 2).map(a => a.name).sort()
  assert.deepEqual(apagar, ['banco-2026-10-18_0900.json.gz'])
  assert.deepEqual(paraApagar(arquivos, 1).map(a => a.name).sort(), ['Formulas-2026-10-01_1000.zip', 'banco-2026-10-18_0900.json.gz', 'banco-2026-10-19_0900.json.gz'])
})

test('exportarBanco: todas as tabelas do schema public, em JSON compactado', async () => {
  const consultas = []
  const consultar = async sql => {
    consultas.push(sql)
    if (sql.includes('information_schema')) return [{ table_name: 'Nota' }, { table_name: 'Usuario' }]
    if (sql.includes('"Nota"')) return [{ id: 1, titulo: 'olá', criadoEm: new Date('2026-10-20T00:00:00Z') }]
    if (sql.includes('"Usuario"')) return [{ id: 7, login: 'felipe' }]
    throw new Error('sql inesperado: ' + sql)
  }
  const r = await exportarBanco(consultar)
  const dados = JSON.parse(zlib.gunzipSync(r.conteudo).toString())
  assert.equal(dados.formato, 'krakion-banco-v2')
  assert.deepEqual(Object.keys(dados.tabelas), ['Nota', 'Usuario'])
  assert.equal(dados.tabelas.Nota[0].titulo, 'olá')
  assert.equal(dados.tabelas.Nota[0].criadoEm, '2026-10-20T00:00:00.000Z')
  assert.deepEqual(r.contagens, { Nota: 1, Usuario: 1 })
  assert.ok(consultas[0].includes("table_schema = 'public'"))
})

test('exportarBanco nunca leva segredo: tokens, hashes de senha e Authorization do histórico', async () => {
  const consultar = async sql => {
    if (sql.includes('information_schema')) return [{ table_name: 'MunicipioSistema' }, { table_name: 'Requisicao' }, { table_name: 'Usuario' }]
    if (sql.includes('"MunicipioSistema"')) return [{ id: 1, municipioId: 3, token: 'eyJ-token-betha', dataVencimento: null }]
    if (sql.includes('"Usuario"')) return [{ id: 1, login: 'felipe', senhaHash: '$2a$10$abc', recuperacaoToken: 'x', recuperacaoExpira: null, tentativasLogin: 0 }]
    if (sql.includes('"Requisicao"')) return [
      { id: 9, headers: JSON.stringify({ Authorization: 'Bearer segredo', 'Content-Type': 'application/json', 'X-Api-Token': 'y' }), body: '{}' },
      { id: 10, headers: 'texto que não é JSON', body: null },
    ]
    throw new Error(sql)
  }
  const r = await exportarBanco(consultar)
  const texto = zlib.gunzipSync(r.conteudo).toString()
  for (const segredo of ['eyJ-token-betha', '$2a$10$abc', 'Bearer segredo', '"y"']) assert.ok(!texto.includes(segredo), segredo)
  const dados = JSON.parse(texto)
  assert.equal(dados.formato, 'krakion-banco-v2')
  assert.deepEqual(dados.omitidos, { MunicipioSistema: ['token'], Usuario: ['senhaHash', 'recuperacaoToken'] })
  assert.deepEqual(Object.keys(dados.tabelas.MunicipioSistema[0]), ['id', 'municipioId', 'dataVencimento'])
  assert.equal(dados.tabelas.Usuario[0].login, 'felipe')
  assert.equal(dados.tabelas.Usuario[0].tentativasLogin, 0) // bloqueio de login não é segredo
  const h = JSON.parse(dados.tabelas.Requisicao[0].headers)
  assert.equal(h.Authorization, '[omitido no backup]')
  assert.equal(h['X-Api-Token'], '[omitido no backup]')
  assert.equal(h['Content-Type'], 'application/json')
  assert.equal(dados.tabelas.Requisicao[1].headers, '[omitido no backup]') // não deu para ler: não arrisca
})
