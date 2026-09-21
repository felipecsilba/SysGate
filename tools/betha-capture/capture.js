/*
 * capture.js — escuta o Chrome via DevTools Protocol e grava cada chamada de API.
 *
 * Uso:
 *   1) abrir o Chrome com a porta de depuracao (ver abrir-chrome.cmd)
 *   2) node capture.js
 *
 * Variaveis de ambiente:
 *   CDP_PORT   porta de depuracao do Chrome (default 9222)
 *   CAP_DIR    pasta de saida (default ./capturas)
 *   CAP_HOSTS  substrings de host a capturar, separadas por virgula (default "betha")
 *   CAP_GET    "1" para capturar GET tambem (default so POST/PUT/PATCH/DELETE)
 *   CAP_TOKEN  "1" para gravar o Authorization inteiro (default mascarado)
 */
const fs = require('fs')
const path = require('path')

const PORT = process.env.CDP_PORT || 9222
const OUT = process.env.CAP_DIR || path.join(__dirname, 'capturas')
const HOSTS = (process.env.CAP_HOSTS || 'betha').split(',').map(s => s.trim()).filter(Boolean)
const CAP_GET = process.env.CAP_GET === '1'
const CAP_TOKEN = process.env.CAP_TOKEN === '1'
const METODOS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const TIPOS = new Set(['XHR', 'Fetch'])   // ignora imagem, css, js, fonte

// Ruido: telemetria e heartbeats de sessao que aparecem as centenas e nunca
// interessam. CAP_TUDO=1 desliga o filtro.
const RUIDO = [
  'google-analytics.com', 'googletagmanager.com',
  'sessions/api/verify', 'sessions/api/activity', 'login-session-verifier',
  'plataforma-notificacoes', 'plataforma-avisos',
  'licenses/v0.1/api/atendimento', 'caseinfo.faces', 'e-gov.betha.com.br/pesquisa',
]
const CAP_TUDO = process.env.CAP_TUDO === '1'

fs.mkdirSync(OUT, { recursive: true })

let seq = fs.readdirSync(OUT).filter(f => /^\d{3}-/.test(f)).length
const pendentes = new Map()   // `${sessionId}:${requestId}` -> registro
let id = 0
const aguardando = new Map()
let ws

function enviar(method, params, sessionId) {
  const msgId = ++id
  return new Promise((resolve, reject) => {
    aguardando.set(msgId, { resolve, reject })
    ws.send(JSON.stringify({ id: msgId, method, params: params || {}, ...(sessionId ? { sessionId } : {}) }))
  })
}

function interessa(url, metodo, tipo) {
  if (!HOSTS.some(h => url.includes(h))) return false
  if (!CAP_TUDO && RUIDO.some(r => url.includes(r))) return false
  if (tipo && !TIPOS.has(tipo)) return false          // so chamada de API, nao asset
  if (metodo === 'OPTIONS') return false
  if (METODOS.has(metodo)) return true
  return CAP_GET && metodo === 'GET'
}

function mascarar(headers) {
  const out = {}
  for (const [k, v] of Object.entries(headers || {})) {
    if (!CAP_TOKEN && /^authorization$/i.test(k)) out[k] = String(v).slice(0, 19) + '…[mascarado]'
    else if (!CAP_TOKEN && /cookie/i.test(k)) out[k] = '…[mascarado]'
    else out[k] = v
  }
  return out
}

function tentarJson(txt) {
  if (txt == null || txt === '') return null
  try { return JSON.parse(txt) } catch { return txt }
}

function slug(url) {
  try {
    const p = new URL(url).pathname
    return p.replace(/^\/+|\/+$/g, '').replace(/[^\w.-]+/g, '_').slice(0, 60) || 'raiz'
  } catch { return 'url' }
}

async function finalizar(chave, extra) {
  const reg = pendentes.get(chave)
  if (!reg) return
  pendentes.delete(chave)

  if (reg.postData == null) {
    try {
      const r = await enviar('Network.getRequestPostData', { requestId: reg.requestId }, reg.sessionId)
      reg.postData = r.postData
    } catch { /* sem corpo */ }
  }
  let corpoResposta = null
  try {
    const r = await enviar('Network.getResponseBody', { requestId: reg.requestId }, reg.sessionId)
    corpoResposta = r.base64Encoded ? Buffer.from(r.body, 'base64').toString('utf8') : r.body
  } catch (e) { corpoResposta = null }

  const n = String(++seq).padStart(3, '0')
  const registro = {
    seq: n,
    quando: new Date().toISOString(),
    metodo: reg.metodo,
    url: reg.url,
    status: reg.status ?? extra?.status ?? null,
    erro: extra?.erro || null,
    duracaoMs: reg.t0 ? Math.round((Date.now() - reg.t0)) : null,
    requestHeaders: mascarar(reg.headers),
    requestJson: tentarJson(reg.postData),
    responseJson: tentarJson(corpoResposta),
  }
  const arquivo = path.join(OUT, `${n}-${reg.metodo}-${slug(reg.url)}.json`)
  fs.writeFileSync(arquivo, JSON.stringify(registro, null, 2), 'utf8')
  fs.appendFileSync(path.join(OUT, 'index.log'),
    `${registro.quando}  ${n}  ${reg.metodo} ${registro.status ?? '---'}  ${reg.url}  -> ${path.basename(arquivo)}\n`, 'utf8')
  console.log(`[cap] ${n} ${reg.metodo} ${registro.status ?? '---'} ${reg.url}`)
}

async function esperarChrome(tentativas = 60) {
  for (let i = 0; i < tentativas; i++) {
    try { return await fetch(`http://127.0.0.1:${PORT}/json/version`).then(r => r.json()) }
    catch { if (i === 0) console.log(`[cap] aguardando o Chrome abrir a porta ${PORT}...`)
            await new Promise(r => setTimeout(r, 1000)) }
  }
  throw new Error(`Chrome nao respondeu em :${PORT}. Abriu o Chrome com --remote-debugging-port=${PORT}?`)
}

async function principal() {
  const info = await esperarChrome()
  ws = new WebSocket(info.webSocketDebuggerUrl)

  ws.addEventListener('message', async ev => {
    const msg = JSON.parse(ev.data)
    if (msg.id && aguardando.has(msg.id)) {
      const { resolve, reject } = aguardando.get(msg.id)
      aguardando.delete(msg.id)
      return msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
    }
    const { method, params, sessionId } = msg
    if (method === 'Target.attachedToTarget') {
      const s = params.sessionId
      try { await enviar('Network.enable', { maxPostDataSize: 8 * 1024 * 1024 }, s) } catch {}
      return
    }
    if (!sessionId) return
    const chave = k => `${sessionId}:${k}`

    if (method === 'Network.requestWillBeSent') {
      const { request, requestId } = params
      if (!interessa(request.url, request.method, params.type)) return
      pendentes.set(chave(requestId), {
        sessionId, requestId, url: request.url, metodo: request.method,
        headers: request.headers, postData: request.postData ?? null,
        t0: Date.now(), status: null,
      })
    } else if (method === 'Network.responseReceived') {
      const reg = pendentes.get(chave(params.requestId))
      if (reg) reg.status = params.response.status
    } else if (method === 'Network.loadingFinished') {
      if (pendentes.has(chave(params.requestId))) await finalizar(chave(params.requestId))
    } else if (method === 'Network.loadingFailed') {
      if (pendentes.has(chave(params.requestId))) await finalizar(chave(params.requestId), { erro: params.errorText })
    }
  })

  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true })
    ws.addEventListener('error', rej, { once: true })
  })
  await enviar('Target.setDiscoverTargets', { discover: true })
  await enviar('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true })
  console.log(`[cap] escutando Chrome em :${PORT} | hosts=${HOSTS.join(',')} | GET=${CAP_GET ? 'sim' : 'nao'}`)
  console.log(`[cap] gravando em ${OUT}`)
}

principal().catch(e => { console.error('[cap] ERRO:', e.message); process.exit(1) })
