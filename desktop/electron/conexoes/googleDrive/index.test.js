import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { subirGoogleFalso } from './googleFalso.js'
import { criarConexaoDrive, NOME_PASTA } from './index.js'

// Cifra de mentira (o main usa safeStorage); o teste confere que nada vai em claro para o disco
const cifra = {
  disponivel: () => true,
  cifrar: s => 'CIFRADO:' + Buffer.from(s).toString('base64'),
  decifrar: s => Buffer.from(s.replace(/^CIFRADO:/, ''), 'base64').toString(),
}

// "Navegador": segue o redirect do login falso até o servidor de retorno do app
const navegador = url => { fetch(url).catch(() => {}) }

async function preparar(opcoesGoogle) {
  const g = await subirGoogleFalso(opcoesGoogle)
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'krakion-drive-'))
  const nova = () => criarConexaoDrive({ userData, cifra, base: g.base, abrirNavegador: navegador })
  return { g, userData, drive: nova(), nova, arquivo: () => fs.readFileSync(path.join(userData, 'google-drive.json'), 'utf8') }
}

async function conectado(t, opcoesGoogle) {
  const p = await preparar(opcoesGoogle)
  t.after(p.g.fechar)
  p.drive.configurarApp({ clientId: p.g.clientId, clientSecret: p.g.clientSecret })
  await p.drive.conectar()
  return p
}

test('sem app do Google configurado: status diz isso e conectar explica o que falta', async t => {
  const { g, drive } = await preparar()
  t.after(g.fechar)
  assert.deepEqual(drive.status(), { appConfigurado: false, conectado: false })
  await assert.rejects(drive.conectar(), /ID do cliente/)
})

test('configurarApp exige os dois campos e não grava o segredo em claro', async t => {
  const { g, drive, arquivo } = await preparar()
  t.after(g.fechar)
  assert.throws(() => drive.configurarApp({ clientId: ' ', clientSecret: 'x' }), /ID do cliente/)
  drive.configurarApp({ clientId: ' cid-teste ', clientSecret: 'segredo-teste' })
  assert.equal(drive.status().appConfigurado, true)
  assert.ok(!arquivo().includes('segredo-teste'))
})

test('conectar ponta a ponta: autoriza, pega a conta e cria a pasta Krakion App', async t => {
  const { g, drive, arquivo } = await conectado(t)
  const s = drive.status()
  assert.equal(s.conectado, true)
  assert.equal(s.email, 'felipe@exemplo.com')
  assert.ok(s.pastaId)
  assert.equal(s.pastaUrl, `https://drive.google.com/drive/folders/${s.pastaId}`)
  assert.ok(s.conectadoEm)
  assert.equal(g.estado.arquivos.get(s.pastaId).name, NOME_PASTA)
  // status nunca carrega segredo; no disco, o refresh token está cifrado
  assert.ok(!JSON.stringify(s).match(/rt-|segredo|CIFRADO/))
  const rt = [...g.estado.refresh][0]
  assert.ok(!arquivo().includes(rt))
})

test('testar grava, lê de volta e apaga um arquivo na pasta; registra o último uso', async t => {
  const { g, drive } = await conectado(t)
  const r = await drive.testar()
  assert.equal(r.ok, true)
  const sobrou = [...g.estado.arquivos.values()].filter(a => a.mimeType !== 'application/vnd.google-apps.folder')
  assert.equal(sobrou.length, 0)
  assert.ok(drive.status().ultimoUso)
})

test('reabrir o app: a conexão continua, e o acesso é renovado pelo refresh token guardado', async t => {
  const { g, nova } = await conectado(t)
  g.invalidarAcessos()
  const reaberto = nova()
  assert.equal(reaberto.status().conectado, true)
  assert.equal((await reaberto.testar()).ok, true)
})

test('pasta apagada no Drive: testar recria e atualiza', async t => {
  const { g, drive } = await conectado(t)
  const antiga = drive.status().pastaId
  g.estado.arquivos.delete(antiga)
  await drive.testar()
  assert.notEqual(drive.status().pastaId, antiga)
})

test('permissão revogada no Google: avisa e marca como desconectado', async t => {
  const { g, drive } = await conectado(t)
  g.estado.refresh.clear()
  g.invalidarAcessos()
  await assert.rejects(drive.testar(), /Conecte de novo/)
  assert.equal(drive.status().conectado, false)
})

test('desconectar revoga no Google e apaga a credencial; o app configurado fica', async t => {
  const { g, drive, arquivo } = await conectado(t)
  const rt = [...g.estado.refresh][0]
  await drive.desconectar()
  assert.deepEqual(g.estado.revogados, [rt])
  const s = drive.status()
  assert.equal(s.conectado, false)
  assert.equal(s.appConfigurado, true)
  assert.ok(!arquivo().includes('CIFRADO:' + Buffer.from(rt).toString('base64')))
})

test('trocar o app do Google derruba a conexão (o refresh token é do app antigo)', async t => {
  const { drive } = await conectado(t)
  drive.configurarApp({ clientId: 'outro', clientSecret: 'outro' })
  assert.equal(drive.status().conectado, false)
})

test('cancelar uma conexão em andamento', async t => {
  const { g, userData } = await preparar()
  t.after(g.fechar)
  const drive = criarConexaoDrive({ userData, cifra, base: g.base, abrirNavegador: () => {} }) // navegador nunca volta
  drive.configurarApp({ clientId: g.clientId, clientSecret: g.clientSecret })
  const p = drive.conectar()
  await new Promise(r => setTimeout(r, 30))
  drive.cancelarConexao()
  await assert.rejects(p, /cancelada/)
  assert.equal(drive.status().conectado, false)
})

test('sem cifragem disponível no Windows, não guarda nada', async t => {
  const { g, userData } = await preparar()
  t.after(g.fechar)
  const drive = criarConexaoDrive({ userData, cifra: { ...cifra, disponivel: () => false }, base: g.base, abrirNavegador: navegador })
  assert.throws(() => drive.configurarApp({ clientId: 'a', clientSecret: 'b' }), /cifragem/)
})
