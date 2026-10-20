import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import zlib from 'node:zlib'
import { subirGoogleFalso } from '../conexoes/googleDrive/googleFalso.js'
import { criarConexaoDrive } from '../conexoes/googleDrive/index.js'
import { criarBackup } from './index.js'
import { lerZip } from './zip.js'

const cifra = { disponivel: () => true, cifrar: s => 'C:' + s, decifrar: s => s.slice(2) }
const PASTA = 'application/vnd.google-apps.folder'

const escrever = (base, rel, conteudo) => { const p = path.join(base, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, conteudo); return p }

// Drive conectado de verdade (contra o falso), biblioteca de exemplo e relógio controlável
async function preparar(t, { manter, conectar = true } = {}) {
  const g = await subirGoogleFalso()
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'krakion-bkp-'))
  const bib = fs.mkdtempSync(path.join(os.tmpdir(), 'krakion-bib-'))
  t.after(async () => { await g.fechar(); fs.rmSync(userData, { recursive: true, force: true }); fs.rmSync(bib, { recursive: true, force: true }) })
  escrever(bib, 'Formulas/IPTU/Criciúma - IPTU - 2026.txt', 'valor = 1')
  escrever(bib, 'Scripts/Componentes/util.txt', 'def x() {}')
  escrever(bib, 'Scripts/__pycache__/lixo.pyc', 'x')
  escrever(bib, 'README.md', '# raiz')
  const drive = criarConexaoDrive({ userData, cifra, base: g.base, abrirNavegador: u => { fetch(u).catch(() => {}) } })
  drive.configurarApp({ clientId: g.clientId, clientSecret: g.clientSecret })
  if (conectar) await drive.conectar()
  let relogio = new Date(2026, 9, 20, 9, 0)
  let exportacoes = 0
  const backup = criarBackup({
    userData, drive, pastaBiblioteca: () => bib, manter, agora: () => relogio,
    exportarBanco: async () => { exportacoes++; return { conteudo: zlib.gzipSync(JSON.stringify({ n: exportacoes })), contagens: { Nota: 2 } } },
  })
  const noDrive = pasta => {
    const pai = [...g.estado.arquivos.values()].find(a => a.name === pasta && a.mimeType === PASTA)
    return pai ? [...g.estado.arquivos.values()].filter(a => a.parents?.includes(pai.id)).map(a => a.name).sort() : []
  }
  return { g, drive, backup, bib, userData, noDrive, avancar: min => { relogio = new Date(relogio.getTime() + min * 60_000) } }
}

test('1ª execução: banco + um zip por pasta (e a raiz), na estrutura Backups/Banco e Backups/Biblioteca', async t => {
  const { g, backup, noDrive } = await preparar(t)
  const r = await backup.executar()
  assert.equal(r.ok, true)
  assert.deepEqual(noDrive('Banco'), ['banco-2026-10-20_090000.json.gz'])
  assert.deepEqual(noDrive('Biblioteca'), ['Formulas-2026-10-20_090000.zip', 'Scripts-2026-10-20_090000.zip', '_raiz-2026-10-20_090000.zip'])
  const zipScripts = [...g.estado.arquivos.values()].find(a => a.name.startsWith('Scripts-'))
  const tmp = path.join(os.tmpdir(), `teste-${Date.now()}.zip`)
  fs.writeFileSync(tmp, zipScripts.conteudo)
  assert.deepEqual(lerZip(tmp).map(e => e.nome), ['Componentes/util.txt']) // sem __pycache__
  fs.rmSync(tmp)
  const raiz = [...g.estado.arquivos.values()].find(a => a.name.startsWith('_raiz-'))
  assert.ok(raiz.conteudo.length > 0)
})

test('2ª execução sem mudanças: só o banco sobe; a biblioteca é pulada', async t => {
  const { backup, noDrive, avancar } = await preparar(t)
  await backup.executar()
  avancar(60)
  const r = await backup.executar()
  assert.deepEqual(r.enviados.map(e => e.tipo), ['banco'])
  assert.deepEqual(r.pulados.sort(), ['Formulas', 'Scripts', '_raiz'])
  assert.equal(noDrive('Banco').length, 2)
  assert.equal(noDrive('Biblioteca').length, 3)
})

test('mudar um arquivo reenvia só aquela pasta', async t => {
  const { backup, bib, avancar } = await preparar(t)
  await backup.executar()
  avancar(60)
  escrever(bib, 'Formulas/IPTU/novo.txt', 'outra fórmula')
  const r = await backup.executar()
  assert.deepEqual(r.enviados.map(e => e.nome), ['banco-2026-10-20_100000.json.gz', 'Formulas-2026-10-20_100000.zip'])
})

test('retenção: guarda os N mais recentes de banco e de cada pasta, apagando no Drive', async t => {
  const { backup, bib, noDrive, avancar } = await preparar(t, { manter: { banco: 2, biblioteca: 2 } })
  for (let i = 0; i < 4; i++) {
    escrever(bib, 'Formulas/x.txt', String(i))
    await backup.executar()
    avancar(60)
  }
  assert.deepEqual(noDrive('Banco'), ['banco-2026-10-20_110000.json.gz', 'banco-2026-10-20_120000.json.gz'])
  assert.deepEqual(noDrive('Biblioteca').filter(n => n.startsWith('Formulas')), ['Formulas-2026-10-20_110000.zip', 'Formulas-2026-10-20_120000.zip'])
  assert.deepEqual(noDrive('Biblioteca').filter(n => n.startsWith('Scripts')), ['Scripts-2026-10-20_090000.zip']) // não mudou: fica a única versão
})

test('falha no meio: o que subiu fica marcado, o resto continua pendente e o erro é registrado', async t => {
  const { g, backup, avancar } = await preparar(t)
  g.estado.falharEnvio = nome => nome.startsWith('Scripts-')
  await assert.rejects(backup.executar(), /Backend Error/)
  const s = backup.status()
  assert.equal(s.ultimo.ok, false)
  assert.match(s.ultimo.erro, /Backend Error/)
  assert.deepEqual(s.ultimo.enviados.map(e => e.tipo + ':' + (e.secao || '')), ['banco:', 'biblioteca:Formulas'])
  assert.equal(s.ultimoSucesso, null)
  assert.equal(backup.precisaRodar(), true)

  g.estado.falharEnvio = null
  avancar(10)
  const r = await backup.executar()
  assert.deepEqual(r.enviados.map(e => e.secao).filter(Boolean), ['Scripts', '_raiz'])
  assert.deepEqual(r.pulados, ['Formulas'])
})

test('precisaRodar: só conectado, e depois de 24 h do último backup com sucesso', async t => {
  const { backup, avancar } = await preparar(t)
  assert.equal(backup.precisaRodar(), true)
  await backup.executar()
  assert.equal(backup.precisaRodar(), false)
  avancar(23 * 60)
  assert.equal(backup.precisaRodar(), false)
  avancar(61)
  assert.equal(backup.precisaRodar(), true)
  assert.ok(backup.status().proximo)
})

test('sem Drive conectado: não roda e explica', async t => {
  const { backup } = await preparar(t, { conectar: false })
  assert.equal(backup.precisaRodar(), false)
  await assert.rejects(backup.executar(), /Conecte o Google Drive/)
})

test('uma execução por vez e progresso informado', async t => {
  const { backup } = await preparar(t)
  const etapas = new Set()
  const p = backup.executar({ aoProgresso: e => etapas.add(e.etapa) })
  await assert.rejects(backup.executar(), /em andamento/)
  assert.equal(backup.status().emAndamento, true)
  await p
  assert.equal(backup.status().emAndamento, false)
  assert.ok(etapas.has('banco') && etapas.has('compactando') && etapas.has('enviando'))
})

test('dois backups no mesmo minuto não geram nomes repetidos', async t => {
  const { backup, noDrive, avancar } = await preparar(t)
  await backup.executar()
  avancar(0.5)
  await backup.executar()
  const banco = noDrive('Banco')
  assert.equal(new Set(banco).size, 2)
})

test('biblioteca ausente nesta máquina: faz só o banco e avisa', async t => {
  const { backup, bib } = await preparar(t)
  fs.rmSync(bib, { recursive: true, force: true })
  const r = await backup.executar()
  assert.equal(r.ok, true)
  assert.deepEqual(r.enviados.map(e => e.tipo), ['banco'])
  assert.match(r.aviso, /biblioteca/i)
})
