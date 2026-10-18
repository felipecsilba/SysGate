import crypto from 'node:crypto'
import fs from 'node:fs'

export function hashArquivo(caminho) {
  return crypto.createHash('sha256').update(fs.readFileSync(caminho)).digest('hex')
}

// O schema só é reaplicado (prisma db push) quando o schema.prisma muda.
export function precisaAplicarSchema(hashAtual, hashSalvo) {
  return hashAtual !== hashSalvo
}
