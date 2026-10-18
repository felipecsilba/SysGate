import { safeStorage } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

// Usuário e senha do Betha Admin + escolhas lembradas, em <userData>/betha-admin.json.
// A senha é cifrada com safeStorage (DPAPI do Windows: só este usuário, nesta máquina, decifra).
// Nunca vai para o banco, para a tela ou para log.

function arquivo(userData) {
  return path.join(userData, 'betha-admin.json')
}

function ler(userData) {
  try { return JSON.parse(fs.readFileSync(arquivo(userData), 'utf8')) } catch { return {} }
}

function gravar(userData, dados) {
  fs.mkdirSync(userData, { recursive: true })
  fs.writeFileSync(arquivo(userData), JSON.stringify(dados, null, 2))
}

export function status(userData) {
  const d = ler(userData)
  return { configurado: !!(d.usuario && d.senhaCifrada), usuario: d.usuario || '', lembrancas: d.lembrancas || {} }
}

export function salvar(userData, usuario, senha) {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('A cifragem do Windows não está disponível nesta máquina.')
  const d = ler(userData)
  d.usuario = String(usuario).trim()
  if (senha) d.senhaCifrada = safeStorage.encryptString(String(senha)).toString('base64')
  gravar(userData, d)
}

export function apagar(userData) {
  const d = ler(userData)
  delete d.usuario
  delete d.senhaCifrada
  gravar(userData, d)
}

// Só o agente chama — a senha decifrada nunca sai do processo main
export function obter(userData) {
  const d = ler(userData)
  if (!d.usuario || !d.senhaCifrada) return null
  return { usuario: d.usuario, senha: safeStorage.decryptString(Buffer.from(d.senhaCifrada, 'base64')) }
}

// Lembranças: chave "etapa|contexto" → texto da opção (ex.: "entidade|VISEU" → "PREFEITURA MUNICIPAL DE VISEU")
export function lembrar(userData, chave, texto) {
  const d = ler(userData)
  d.lembrancas = { ...(d.lembrancas || {}), [chave]: texto }
  gravar(userData, d)
}

export function esquecer(userData, chave) {
  const d = ler(userData)
  if (d.lembrancas) delete d.lembrancas[chave]
  gravar(userData, d)
}

export function lembranca(userData, chave) {
  return ler(userData).lembrancas?.[chave]
}
