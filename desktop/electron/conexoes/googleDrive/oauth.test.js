import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { enderecos, gerarPkce, urlAutorizacao, aguardarRetorno, trocarCodigo, renovarAcesso, ESCOPO } from './oauth.js'

test('enderecos: Google de verdade por padrão, tudo num servidor só com base', () => {
  assert.equal(enderecos().autorizacao, 'https://accounts.google.com/o/oauth2/v2/auth')
  assert.equal(enderecos().token, 'https://oauth2.googleapis.com/token')
  const falso = enderecos('http://127.0.0.1:9999/')
  assert.equal(falso.autorizacao, 'http://127.0.0.1:9999/o/oauth2/v2/auth')
  assert.equal(falso.api, 'http://127.0.0.1:9999')
})

test('gerarPkce: desafio é o SHA-256 base64url do verificador', () => {
  const { verificador, desafio } = gerarPkce()
  assert.match(verificador, /^[A-Za-z0-9_-]{43,128}$/)
  assert.equal(desafio, crypto.createHash('sha256').update(verificador).digest('base64url'))
  assert.notEqual(gerarPkce().verificador, verificador)
})

test('urlAutorizacao leva client, retorno, escopo drive.file, PKCE, state e pede refresh token', () => {
  const u = new URL(urlAutorizacao({ autorizacao: 'https://x/auth', clientId: 'cid', redirectUri: 'http://127.0.0.1:5000', desafio: 'D', estado: 'E' }))
  const p = Object.fromEntries(u.searchParams)
  assert.equal(p.client_id, 'cid')
  assert.equal(p.redirect_uri, 'http://127.0.0.1:5000')
  assert.equal(p.response_type, 'code')
  assert.equal(p.scope, ESCOPO)
  assert.match(ESCOPO, /drive\.file/)
  assert.equal(p.code_challenge, 'D')
  assert.equal(p.code_challenge_method, 'S256')
  assert.equal(p.state, 'E')
  assert.equal(p.access_type, 'offline')
  assert.equal(p.prompt, 'consent')
})

test('aguardarRetorno devolve o código quando o state confere', async () => {
  const r = await aguardarRetorno({ estado: 'ok', tempoLimite: 5000 })
  assert.match(r.redirectUri, /^http:\/\/127\.0\.0\.1:\d+$/)
  const resp = await fetch(`${r.redirectUri}/?code=ABC&state=ok`)
  assert.equal(resp.status, 200)
  assert.equal(await r.codigo, 'ABC')
})

test('aguardarRetorno rejeita state diferente (outra aba / ataque) e erro do Google', async () => {
  const r1 = await aguardarRetorno({ estado: 'certo', tempoLimite: 5000 })
  const p1 = assert.rejects(r1.codigo, /não confere/)
  await fetch(`${r1.redirectUri}/?code=ABC&state=errado`)
  await p1

  const r2 = await aguardarRetorno({ estado: 'x', tempoLimite: 5000 })
  const p2 = assert.rejects(r2.codigo, /recusada/)
  await fetch(`${r2.redirectUri}/?error=access_denied&state=x`)
  await p2
})

test('aguardarRetorno desiste depois do tempo limite e pode ser cancelado', async () => {
  const r1 = await aguardarRetorno({ estado: 'x', tempoLimite: 50 })
  await assert.rejects(r1.codigo, /Tempo esgotado/)
  const r2 = await aguardarRetorno({ estado: 'x', tempoLimite: 5000 })
  r2.cancelar()
  await assert.rejects(r2.codigo, /cancelada/)
})

function fetchQueGuarda(resposta, status = 200) {
  const chamadas = []
  const f = async (url, opcoes) => {
    chamadas.push({ url, opcoes, form: Object.fromEntries(new URLSearchParams(opcoes.body)) })
    return new Response(JSON.stringify(resposta), { status, headers: { 'content-type': 'application/json' } })
  }
  return { f, chamadas }
}

test('trocarCodigo manda code + verificador + segredo e calcula quando o acesso vence', async () => {
  const { f, chamadas } = fetchQueGuarda({ access_token: 'AT', refresh_token: 'RT', expires_in: 3600 })
  const antes = Date.now()
  const t = await trocarCodigo({ token: 'https://x/token', clientId: 'cid', clientSecret: 'sec', codigo: 'C', verificador: 'V', redirectUri: 'http://127.0.0.1:1', fetch: f })
  assert.equal(chamadas[0].form.grant_type, 'authorization_code')
  assert.equal(chamadas[0].form.code, 'C')
  assert.equal(chamadas[0].form.code_verifier, 'V')
  assert.equal(chamadas[0].form.client_secret, 'sec')
  assert.equal(t.accessToken, 'AT')
  assert.equal(t.refreshToken, 'RT')
  assert.ok(t.expiraEm >= antes + 3500 * 1000)
})

test('renovarAcesso usa refresh_token; erro do Google vira mensagem legível', async () => {
  const { f, chamadas } = fetchQueGuarda({ access_token: 'AT2', expires_in: 3600 })
  const t = await renovarAcesso({ token: 'https://x/token', clientId: 'cid', clientSecret: 'sec', refreshToken: 'RT', fetch: f })
  assert.equal(chamadas[0].form.grant_type, 'refresh_token')
  assert.equal(chamadas[0].form.refresh_token, 'RT')
  assert.equal(t.accessToken, 'AT2')

  const ruim = fetchQueGuarda({ error: 'invalid_grant', error_description: 'Token has been expired or revoked.' }, 400)
  await assert.rejects(
    renovarAcesso({ token: 'https://x/token', clientId: 'cid', clientSecret: 'sec', refreshToken: 'RT', fetch: ruim.f }),
    err => err.codigo === 'invalid_grant' && /revoked/.test(err.message)
  )
})
