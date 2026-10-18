import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

// Segredos e estado por instalação, em <userData>/local.json.
// Gerados na primeira abertura — cada máquina tem os seus.
function arquivo(userData) {
  return path.join(userData, 'local.json')
}

export function lerConfig(userData) {
  let cfg = {}
  try {
    cfg = JSON.parse(fs.readFileSync(arquivo(userData), 'utf8'))
  } catch {}
  let mudou = false
  if (!cfg.pgSenha) { cfg.pgSenha = crypto.randomBytes(24).toString('hex'); mudou = true }
  if (!cfg.jwtSecret) { cfg.jwtSecret = crypto.randomBytes(48).toString('hex'); mudou = true }
  if (mudou) salvarConfig(userData, cfg)
  return cfg
}

export function salvarConfig(userData, cfg) {
  fs.mkdirSync(userData, { recursive: true })
  fs.writeFileSync(arquivo(userData), JSON.stringify(cfg, null, 2))
}
