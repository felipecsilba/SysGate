import { BrowserWindow, session } from 'electron'
import { URL_API, URL_TELA, cabecalhosDaSessao, chamadaPermitida } from './regras.js'

// Sessão do tributos para a Migração Espelho: o Felipe entra numa janela do App e a sessão é lida das chamadas
// da própria tela (Authorization + User-Access). Partição só em memória: nada vai para o disco e o token nunca
// volta para a interface — ela só pede GET/PUT permitidos (regras.js) e recebe status + JSON.

const PARTICAO = 'sessao-tributos'
let janela = null
let sessao = null // { authorization, userAccess, desde }
let avisar = () => {}

const estado = () => ({ conectado: !!sessao, desde: sessao?.desde ?? null, janelaAberta: !!janela && !janela.isDestroyed() })

export function aoMudar(fn) { avisar = fn }

function registrarEscuta() {
  const ses = session.fromPartition(PARTICAO)
  ses.webRequest.onBeforeSendHeaders({ urls: ['https://tributos.betha.cloud/tributos/*'] }, (detalhes, seguir) => {
    const cab = cabecalhosDaSessao(detalhes.requestHeaders)
    if (cab && (cab.authorization !== sessao?.authorization || cab.userAccess !== sessao?.userAccess)) {
      sessao = { ...cab, desde: new Date().toISOString() }
      console.log('[tributos] sessão capturada da tela') // sem token no log
      avisar(estado())
    }
    seguir({ requestHeaders: detalhes.requestHeaders })
  })
}
let escutando = false

export function entrar() {
  if (!escutando) { registrarEscuta(); escutando = true }
  if (janela && !janela.isDestroyed()) { janela.show(); janela.focus(); return estado() }
  janela = new BrowserWindow({
    width: 1200, height: 850, title: 'Tributos — Krakion App (sessão da Migração Espelho)',
    webPreferences: { partition: PARTICAO, contextIsolation: true, nodeIntegration: false, sandbox: true },
  })
  janela.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  janela.on('closed', () => { janela = null; avisar(estado()) })
  janela.loadURL(URL_TELA)
  avisar(estado())
  return estado()
}

export function status() { return estado() }

export async function sair() {
  sessao = null
  if (janela && !janela.isDestroyed()) janela.close()
  await session.fromPartition(PARTICAO).clearStorageData().catch(() => {})
  avisar(estado())
  return estado()
}

export async function chamar(metodo, path, corpo) {
  if (!chamadaPermitida(metodo, path)) throw new Error(`Chamada não permitida: ${metodo} ${path}`)
  if (!sessao) return { status: 401, data: { message: 'Sem sessão do tributos — clique em Entrar no tributos' } }
  const res = await fetch(`${URL_API}${path}`, {
    method: metodo,
    headers: {
      Authorization: sessao.authorization,
      'User-Access': sessao.userAccess,
      Accept: 'application/json',
      ...(corpo ? { 'Content-Type': 'application/json;charset=UTF-8' } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  })
  const texto = await res.text()
  let data = texto
  try { data = texto ? JSON.parse(texto) : null } catch { /* resposta não-JSON: devolve o texto */ }
  if (res.status === 401) { sessao = null; avisar(estado()) }
  // Erro vai para o krakion.log (sem token) — a tela perde o estado ao fechar
  if (res.status >= 300) console.log('[tributos]', metodo, path, '→', res.status, (typeof data === 'string' ? data : JSON.stringify(data)).slice(0, 500))
  return { status: res.status, data }
}
