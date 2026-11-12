import fs from 'node:fs'
import path from 'node:path'

// Backup completo da Migração Espelho: antes do primeiro PUT, o objeto que a tela devolveu no GET (o registro inteiro,
// como a Betha guarda — no contribuinte, com endereços, telefones, sócios e campos adicionais) vai para um .jsonl
// por cadastro e por dia. Uma linha por registro: { salvoEm, registro }. Só acrescenta, nunca reescreve.

export function arquivoBackup(pasta, cadastroId, agora = new Date()) {
  if (!/^[a-z0-9-]+$/.test(String(cadastroId))) throw new Error(`Cadastro inválido: ${cadastroId}`)
  const dia = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`
  return path.join(pasta, `${cadastroId}-${dia}.jsonl`)
}

export function anexarBackup(pasta, cadastroId, registro, agora = new Date()) {
  const arq = arquivoBackup(pasta, cadastroId, agora)
  fs.mkdirSync(pasta, { recursive: true })
  fs.appendFileSync(arq, `${JSON.stringify({ salvoEm: agora.toISOString(), registro })}\n`, 'utf8')
  return arq
}
