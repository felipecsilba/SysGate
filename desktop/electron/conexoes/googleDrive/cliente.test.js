import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { subirGoogleFalso } from './googleFalso.js'
import { criarCliente, TAMANHO_PARTE } from './cliente.js'

// Cliente com um acesso válido emitido pelo Google falso (sem passar pelo login)
async function preparar() {
  const g = await subirGoogleFalso()
  let renovacoes = 0
  const novoAcesso = () => { const a = `at-manual-${++renovacoes}`; g.estado.acessos.add(a); return a }
  let atual = novoAcesso()
  const cliente = criarCliente({
    api: g.base,
    obterAcesso: async ({ forcar } = {}) => { if (forcar) atual = novoAcesso(); return atual },
  })
  return { g, cliente, renovacoes: () => renovacoes }
}

test('sobre devolve o email da conta', async t => {
  const { g, cliente } = await preparar()
  t.after(g.fechar)
  assert.equal((await cliente.sobre()).email, 'felipe@exemplo.com')
})

test('garantirPasta cria uma vez e reaproveita depois (nome com apóstrofo)', async t => {
  const { g, cliente } = await preparar()
  t.after(g.fechar)
  const id1 = await cliente.garantirPasta('Krakion App')
  const id2 = await cliente.garantirPasta('Krakion App')
  assert.equal(id1, id2)
  const id3 = await cliente.garantirPasta("Pasta d'água")
  assert.notEqual(id3, id1)
  assert.equal(await cliente.garantirPasta("Pasta d'água"), id3)
})

test('enviar conteúdo pequeno, baixar de volta e excluir', async t => {
  const { g, cliente } = await preparar()
  t.after(g.fechar)
  const pasta = await cliente.garantirPasta('Krakion App')
  const f = await cliente.enviar({ pastaId: pasta, nome: 'teste.txt', conteudo: 'olá Drive', tipo: 'text/plain' })
  assert.equal(f.nome, 'teste.txt')
  assert.equal(await cliente.baixarTexto(f.id), 'olá Drive')
  await cliente.excluir(f.id)
  await assert.rejects(cliente.baixarTexto(f.id), /not found/i)
})

test('enviar arquivo grande do disco vai em partes e chega íntegro', async t => {
  const { g, cliente } = await preparar()
  t.after(g.fechar)
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'drive-'))
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }))
  const caminho = path.join(dir, 'grande.zip')
  const dados = crypto.randomBytes(TAMANHO_PARTE * 2 + 12345)
  fs.writeFileSync(caminho, dados)

  const progresso = []
  const pasta = await cliente.garantirPasta('Krakion App')
  const f = await cliente.enviar({ pastaId: pasta, nome: 'grande.zip', caminho, aoProgresso: p => progresso.push(p) })
  assert.equal(g.estado.partesRecebidas, 3)
  assert.ok(g.estado.arquivos.get(f.id).conteudo.equals(dados))
  assert.equal(progresso.at(-1).enviado, dados.length)
})

test('listar devolve os arquivos de uma pasta (com tamanho), sem os de outras', async t => {
  const { g, cliente } = await preparar()
  t.after(g.fechar)
  const a = await cliente.garantirPasta('A')
  const b = await cliente.garantirPasta('B')
  await cliente.enviar({ pastaId: a, nome: 'um.txt', conteudo: '123' })
  await cliente.enviar({ pastaId: a, nome: 'dois.txt', conteudo: '12' })
  await cliente.enviar({ pastaId: b, nome: 'outro.txt', conteudo: 'x' })
  const lista = await cliente.listar(a)
  assert.deepEqual(lista.map(f => f.name).sort(), ['dois.txt', 'um.txt'])
  assert.equal(lista.find(f => f.name === 'um.txt').tamanho, 3)
})

test('acesso vencido no meio do caminho: renova uma vez e repete', async t => {
  const { g, cliente, renovacoes } = await preparar()
  t.after(g.fechar)
  g.invalidarAcessos()
  assert.equal((await cliente.sobre()).email, 'felipe@exemplo.com')
  assert.equal(renovacoes(), 2)
})
