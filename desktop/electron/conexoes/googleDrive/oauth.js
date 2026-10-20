import crypto from 'node:crypto'
import http from 'node:http'

// Login do Google para app desktop: PKCE + retorno num servidor local em 127.0.0.1 (porta livre).
// Sem import de electron — testável no Node. O navegador é aberto por quem chama.

// drive.file: o app só enxerga os arquivos que ele mesmo criou (não é escopo sensível — dispensa verificação)
export const ESCOPO = 'https://www.googleapis.com/auth/drive.file'

// base: Google falso dos testes (KRAKION_GOOGLE_BASE). Sem base, os endereços reais.
export function enderecos(base) {
  if (!base) {
    return {
      autorizacao: 'https://accounts.google.com/o/oauth2/v2/auth',
      token: 'https://oauth2.googleapis.com/token',
      revogacao: 'https://oauth2.googleapis.com/revoke',
      api: 'https://www.googleapis.com',
    }
  }
  const b = base.replace(/\/+$/, '')
  return { autorizacao: `${b}/o/oauth2/v2/auth`, token: `${b}/token`, revogacao: `${b}/revoke`, api: b }
}

export function gerarPkce() {
  const verificador = crypto.randomBytes(48).toString('base64url')
  const desafio = crypto.createHash('sha256').update(verificador).digest('base64url')
  return { verificador, desafio }
}

export function urlAutorizacao({ autorizacao, clientId, redirectUri, desafio, estado }) {
  const u = new URL(autorizacao)
  u.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: ESCOPO,
    code_challenge: desafio,
    code_challenge_method: 'S256',
    state: estado,
    access_type: 'offline', // devolve refresh token
    prompt: 'consent', // garante o refresh token mesmo em reconexão
  }).toString()
  return u.toString()
}

const PAGINA = (titulo, texto) => `<!doctype html><meta charset="utf-8"><title>Krakion App</title>
<body style="font-family:system-ui,sans-serif;display:grid;place-items:center;height:100vh;margin:0;background:#f8fafc;color:#1e293b">
<div style="text-align:center"><h2 style="margin:0 0 8px">${titulo}</h2><p style="margin:0;color:#64748b">${texto}</p></div>`

function falha(mensagem) {
  const err = new Error(mensagem)
  err.amigavel = true
  return err
}

// Sobe o servidor de retorno e devolve { redirectUri, codigo: Promise<string>, cancelar }.
// O servidor fecha sozinho no primeiro retorno, no tempo limite ou no cancelamento.
export function aguardarRetorno({ estado, tempoLimite = 5 * 60 * 1000 }) {
  return new Promise((resolverInicio, rejeitarInicio) => {
    let resolver, rejeitar
    const codigo = new Promise((res, rej) => { resolver = res; rejeitar = rej })
    codigo.catch(() => {}) // quem chama trata; evita rejeição solta se ninguém aguardar

    const servidor = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://127.0.0.1')
      if (u.pathname !== '/') { res.writeHead(404).end(); return }
      const p = u.searchParams
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      if (p.get('state') !== estado) {
        res.end(PAGINA('Não deu certo', 'A resposta não corresponde a esta conexão. Volte ao Krakion App e tente de novo.'))
        encerrar(() => rejeitar(falha('A resposta do Google não confere com esta conexão (state). Tente de novo.')))
      } else if (p.get('error')) {
        res.end(PAGINA('Conexão não autorizada', 'Você pode fechar esta aba e voltar ao Krakion App.'))
        encerrar(() => rejeitar(falha(`Autorização recusada no Google (${p.get('error')}).`)))
      } else if (p.get('code')) {
        res.end(PAGINA('Google Drive conectado', 'Pode fechar esta aba e voltar ao Krakion App.'))
        encerrar(() => resolver(p.get('code')))
      } else {
        res.end(PAGINA('Não deu certo', 'O Google não devolveu o código. Tente de novo.'))
        encerrar(() => rejeitar(falha('O Google não devolveu o código de autorização.')))
      }
    })

    let relogio
    let encerrado = false
    function encerrar(depois) {
      if (encerrado) return
      encerrado = true
      clearTimeout(relogio)
      servidor.close()
      servidor.closeAllConnections?.()
      depois()
    }

    servidor.on('error', rejeitarInicio)
    servidor.listen(0, '127.0.0.1', () => {
      relogio = setTimeout(() => encerrar(() => rejeitar(falha('Tempo esgotado esperando a autorização no navegador.'))), tempoLimite)
      resolverInicio({
        redirectUri: `http://127.0.0.1:${servidor.address().port}`,
        codigo,
        cancelar: () => encerrar(() => rejeitar(falha('Conexão cancelada.'))),
      })
    })
  })
}

async function postarForm(url, campos, f = fetch) {
  const resp = await f(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(campos).toString(),
  })
  const dados = await resp.json().catch(() => ({}))
  if (!resp.ok) {
    const err = falha(`Google recusou: ${dados.error_description || dados.error || `HTTP ${resp.status}`}`)
    err.codigo = dados.error
    throw err
  }
  return dados
}

const tokens = d => ({ accessToken: d.access_token, refreshToken: d.refresh_token, expiraEm: Date.now() + (d.expires_in || 3600) * 1000 })

export async function trocarCodigo({ token, clientId, clientSecret, codigo, verificador, redirectUri, fetch: f }) {
  return tokens(await postarForm(token, {
    grant_type: 'authorization_code', code: codigo, code_verifier: verificador,
    client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri,
  }, f))
}

export async function renovarAcesso({ token, clientId, clientSecret, refreshToken, fetch: f }) {
  return tokens(await postarForm(token, {
    grant_type: 'refresh_token', refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret,
  }, f))
}

// Revogar o refresh token derruba a permissão inteira no Google. Falha aqui não impede desconectar localmente.
export async function revogar({ revogacao, token, fetch: f = fetch }) {
  try { await postarForm(revogacao, { token }, f); return true } catch { return false }
}
