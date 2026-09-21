/*
 * krakion-api.js — cliente minimo da API do Krakion para scripts locais.
 *
 * Credenciais ficam em ~/.krakion/cred.json (fora do repositorio, fora do git):
 *   { "baseUrl": "https://krakionlabs.cloud/api", "login": "...", "senha": "..." }
 *
 * Uso:
 *   const { login, api, proxy } = require('./tools/krakion-api')
 *   await login()
 *   const r = await api('GET', '/municipios')
 *   const betha = await proxy({ municipioId: 10, sistemaId: 3, path: '/api/pessoas', metodo: 'GET' })
 *
 * Requer Node >= 18 (fetch global). Zero dependencias.
 */
const fs = require('fs')
const os = require('os')
const path = require('path')

const CRED_PATH = process.env.KRAKION_CRED || path.join(os.homedir(), '.krakion', 'cred.json')

let cred = null
let TOKEN = null

function carregarCred() {
  if (cred) return cred
  if (!fs.existsSync(CRED_PATH)) {
    throw new Error(`Credenciais nao encontradas em ${CRED_PATH}. Crie o arquivo com { baseUrl, login, senha }.`)
  }
  cred = JSON.parse(fs.readFileSync(CRED_PATH, 'utf8'))
  return cred
}

async function api(metodo, rota, corpo) {
  const { baseUrl } = carregarCred()
  const r = await fetch(baseUrl + rota, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: 'Bearer ' + TOKEN } : {}) },
    ...(corpo ? { body: JSON.stringify(corpo) } : {}),
  })
  const txt = await r.text()
  let dados
  try { dados = JSON.parse(txt) } catch { dados = txt }
  return { status: r.status, dados }
}

async function login() {
  const { login: usuario, senha } = carregarCred()
  const r = await api('POST', '/auth/login', { login: usuario, senha })
  if (r.status !== 200) throw new Error(`login falhou (${r.status}): ${JSON.stringify(r.dados)}`)
  TOKEN = r.dados.token
  return r.dados.usuario
}

/** Executa uma chamada na API Betha atraves do proxy do Krakion (usa o token do municipio). */
async function proxy({ municipioId, sistemaId, path: apiPath, metodo, body, tipo = 'individual' }) {
  const r = await api('POST', '/proxy/executar', { municipioId, sistemaId, path: apiPath, metodo, body, tipo })
  return r.dados
}

/** Consulta o status de um lote ate um estado final. NAO_PROCESSADO significa "ainda na fila". */
async function aguardarLote({ municipioId, sistemaId, path: apiPath, idLote, timeoutMs = 120000, intervaloMs = 5000 }) {
  const limite = Date.now() + timeoutMs
  while (true) {
    const d = await proxy({ municipioId, sistemaId, path: `${apiPath}/${idLote}`, metodo: 'GET' })
    const st = d?.data?.statusLote
    if (st === 'PROCESSADO' || st === 'PROCESSADO_COM_ERRO') return d.data
    if (Date.now() >= limite) return d?.data || null
    await new Promise((r) => setTimeout(r, intervaloMs))
  }
}

module.exports = { api, login, proxy, aguardarLote, CRED_PATH }
