import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { caminhoLongo } from './zip.js'

// "Impressão" de uma pasta: caminho + tamanho + data de cada arquivo. Muda quando qualquer arquivo muda, entra ou sai —
// sem ler o conteúdo (a biblioteca tem ~19 mil arquivos; isso leva milissegundos).

const IGNORAR = new Set(['__pycache__'])

export function listarArquivos(pasta) {
  const saida = []
  const andar = (dir, prefixo) => {
    for (const e of fs.readdirSync(caminhoLongo(dir), { withFileTypes: true })) {
      if (IGNORAR.has(e.name)) continue
      const caminho = path.join(dir, e.name)
      const nome = prefixo ? `${prefixo}/${e.name}` : e.name
      if (e.isDirectory()) andar(caminho, nome)
      else if (e.isFile()) {
        const st = fs.statSync(caminhoLongo(caminho))
        saida.push({ nome, caminho, tamanho: st.size, mtimeMs: Math.trunc(st.mtimeMs), data: st.mtime })
      }
    }
  }
  andar(pasta, '')
  return saida.sort((a, b) => (a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0))
}

export function impressao(lista) {
  const h = crypto.createHash('sha256')
  for (const f of lista) h.update(`${f.nome}|${f.tamanho}|${f.mtimeMs}\n`)
  return h.digest('hex')
}
