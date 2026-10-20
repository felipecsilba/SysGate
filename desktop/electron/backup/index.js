import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { criarZip } from './zip.js'
import { listarArquivos, impressao } from './impressao.js'
import { carimbo, paraApagar } from './retencao.js'

// Backup no Google Drive: o banco do App todo dia; a biblioteca em um zip por pasta principal, só quando a pasta muda.
// Estado em <userData>/backup.json (último resultado, último sucesso, impressão de cada pasta já enviada).
// No Drive: Krakion App/Backups/Banco e Krakion App/Backups/Biblioteca.

export const MANTER_PADRAO = { banco: 30, biblioteca: 3 }
export const INTERVALO_MS = 24 * 60 * 60 * 1000
const RAIZ = '_raiz' // arquivos soltos na raiz da biblioteca

const nomeSeguro = s => s.replace(/[<>:"/\\|?*]/g, '_')

function falha(mensagem) {
  const err = new Error(mensagem)
  err.amigavel = true
  return err
}

// Pastas principais da biblioteca (e a raiz, se tiver arquivos soltos) → [{ secao, listar() }]
function secoesDaBiblioteca(base) {
  const entradas = fs.readdirSync(base, { withFileTypes: true }).filter(e => !e.name.startsWith('.'))
  const secoes = entradas
    .filter(e => e.isDirectory() && e.name !== '__pycache__')
    .map(e => ({ secao: e.name, listar: () => listarArquivos(path.join(base, e.name)) }))
    .sort((a, b) => (a.secao < b.secao ? -1 : 1))
  if (entradas.some(e => e.isFile())) {
    secoes.push({
      secao: RAIZ,
      listar: () => entradas.filter(e => e.isFile()).map(e => {
        const caminho = path.join(base, e.name)
        const st = fs.statSync(caminho)
        return { nome: e.name, caminho, tamanho: st.size, mtimeMs: Math.trunc(st.mtimeMs), data: st.mtime }
      }).sort((a, b) => (a.nome < b.nome ? -1 : 1)),
    })
  }
  return secoes
}

export function criarBackup({ userData, drive, pastaBiblioteca, exportarBanco, manter = MANTER_PADRAO, intervaloMs = INTERVALO_MS, agora = () => new Date() }) {
  const arquivo = path.join(userData, 'backup.json')
  let emAndamento = false
  let progresso = null

  const ler = () => { try { return JSON.parse(fs.readFileSync(arquivo, 'utf8')) } catch { return {} } }
  const gravar = d => { fs.mkdirSync(userData, { recursive: true }); fs.writeFileSync(arquivo, JSON.stringify(d, null, 2)) }
  const atualizar = mudancas => gravar({ ...ler(), ...mudancas })

  function status() {
    const d = ler()
    const ultimoSucesso = d.ultimoSucesso || null
    return {
      conectado: !!drive.status().conectado,
      emAndamento,
      progresso: emAndamento ? progresso : null,
      ultimo: d.ultimo || null,
      ultimoSucesso,
      proximo: ultimoSucesso ? new Date(new Date(ultimoSucesso).getTime() + intervaloMs).toISOString() : null,
    }
  }

  function precisaRodar() {
    if (emAndamento || !drive.status().conectado) return false
    const { ultimoSucesso } = ler()
    return !ultimoSucesso || agora().getTime() - new Date(ultimoSucesso).getTime() >= intervaloMs
  }

  async function executar({ aoProgresso } = {}) {
    if (emAndamento) throw falha('Já existe um backup em andamento.')
    if (!drive.status().conectado) throw falha('Conecte o Google Drive antes de fazer o backup.')
    emAndamento = true
    const informar = p => { progresso = p; aoProgresso?.(p) }
    const inicio = agora()
    const marca = carimbo(inicio)
    const enviados = []
    const pulados = []
    let aviso = null
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'krakion-backup-'))
    try {
      const c = drive.cliente()
      informar({ etapa: 'preparando', texto: 'Preparando as pastas no Drive…' })
      const raiz = await drive.pastaApp()
      const pastaBackups = await c.garantirPasta('Backups', raiz)
      const pastaBanco = await c.garantirPasta('Banco', pastaBackups)
      const pastaBib = await c.garantirPasta('Biblioteca', pastaBackups)

      // 1. Banco — todo backup
      informar({ etapa: 'banco', texto: 'Exportando o banco do App…' })
      const banco = await exportarBanco()
      const nomeBanco = `banco-${marca}.json.gz`
      informar({ etapa: 'enviando', texto: `Enviando ${nomeBanco}…`, enviado: 0, total: banco.conteudo.length })
      await c.enviar({
        pastaId: pastaBanco, nome: nomeBanco, conteudo: banco.conteudo, tipo: 'application/gzip',
        aoProgresso: p => informar({ etapa: 'enviando', texto: `Enviando ${nomeBanco}…`, ...p }),
      })
      enviados.push({ tipo: 'banco', nome: nomeBanco, tamanho: banco.conteudo.length, tabelas: Object.keys(banco.contagens).length })

      // 2. Biblioteca — só as pastas que mudaram desde o último envio com sucesso
      const base = pastaBiblioteca()
      if (!base || !fs.existsSync(base)) {
        aviso = 'A pasta da biblioteca não existe nesta máquina — só o banco foi copiado.'
      } else {
        for (const { secao, listar } of secoesDaBiblioteca(base)) {
          const lista = listar()
          if (!lista.length) continue
          const marcaAtual = impressao(lista)
          if (ler().impressoes?.[secao] === marcaAtual) { pulados.push(secao); continue }

          const nome = `${nomeSeguro(secao)}-${marca}.zip`
          const destino = path.join(tmp, nome)
          informar({ etapa: 'compactando', texto: `Compactando ${secao} (${lista.length} arquivos)…`, feitos: 0, total: lista.length })
          const z = await criarZip(destino, lista, {
            aoProgresso: p => { if (p.feitos % 200 === 0 || p.feitos === p.total) informar({ etapa: 'compactando', texto: `Compactando ${secao}…`, ...p }) },
          })
          informar({ etapa: 'enviando', texto: `Enviando ${nome}…`, enviado: 0, total: z.tamanho })
          await c.enviar({
            pastaId: pastaBib, nome, caminho: destino, tipo: 'application/zip',
            aoProgresso: p => informar({ etapa: 'enviando', texto: `Enviando ${nome}…`, ...p }),
          })
          fs.rmSync(destino, { force: true })
          enviados.push({ tipo: 'biblioteca', secao, nome, tamanho: z.tamanho, arquivos: lista.length })
          // grava já: se o próximo envio falhar, esta pasta não é reenviada à toa
          const d = ler()
          gravar({ ...d, impressoes: { ...(d.impressoes || {}), [secao]: marcaAtual } })
        }
      }

      // 3. Retenção — apaga no Drive o que passou do limite
      informar({ etapa: 'limpando', texto: 'Apagando backups antigos…' })
      let apagados = 0
      // Uma vez só: backups de banco de antes de 2026-10-20 levavam tokens e hashes de senha — saem todos
      if (!ler().bancoSemSegredos) {
        for (const velho of (await c.listar(pastaBanco)).filter(a => a.name !== nomeBanco)) { await c.excluir(velho.id); apagados++ }
        atualizar({ bancoSemSegredos: true })
      }
      for (const [pasta, n] of [[pastaBanco, manter.banco], [pastaBib, manter.biblioteca]]) {
        for (const velho of paraApagar(await c.listar(pasta), n)) { await c.excluir(velho.id); apagados++ }
      }

      const fim = agora().toISOString()
      const ultimo = { ok: true, inicio: inicio.toISOString(), fim, enviados, pulados, apagados, aviso }
      atualizar({ ultimo, ultimoSucesso: fim })
      return ultimo
    } catch (err) {
      const mensagem = err.amigavel ? err.message : `Falha inesperada: ${err.message}`
      atualizar({ ultimo: { ok: false, inicio: inicio.toISOString(), fim: agora().toISOString(), enviados, pulados, erro: mensagem } })
      throw err
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true })
      emAndamento = false
      progresso = null
    }
  }

  return { status, precisaRodar, executar }
}
