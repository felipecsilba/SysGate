import crypto from 'node:crypto'
import http from 'node:http'

// Google falso, só para testes: login (redireciona direto com o código), token com PKCE, revogação e o pedaço da
// API do Drive que o app usa (about, busca de pasta, criação, upload resumable, download, exclusão).
// Endereços iguais aos reais a partir da base — ver enderecos(base) em oauth.js.

const PASTA = 'application/vnd.google-apps.folder'
const PARTE_MINIMA = 256 * 1024 // o Drive exige partes múltiplas de 256 KB (menos a última)

export async function subirGoogleFalso({ clientId = 'cid-teste', clientSecret = 'segredo-teste', email = 'felipe@exemplo.com', duracaoAcesso = 3600 } = {}) {
  const estado = {
    codigos: new Map(), // código → { desafio, redirectUri }
    refresh: new Set(),
    acessos: new Set(),
    revogados: [],
    arquivos: new Map(), // id → { id, name, mimeType, parents, conteudo: Buffer }
    sessoes: new Map(), // id → { meta, total, recebido: Buffer[] }
    partesRecebidas: 0,
    duracaoAcesso,
    falharEnvio: null, // nome => true faz o envio daquele arquivo falhar (testes de falha no meio)
  }
  let seq = 0
  const novoId = p => `${p}${++seq}`

  const ler = req => new Promise(res => { const b = []; req.on('data', c => b.push(c)); req.on('end', () => res(Buffer.concat(b))) })
  const json = (res, status, dados, cab = {}) => { res.writeHead(status, { 'content-type': 'application/json', ...cab }); res.end(JSON.stringify(dados)) }
  const erroApi = (res, status, mensagem) => json(res, status, { error: { code: status, message: mensagem } })

  const servidor = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://x')
    const corpo = await ler(req)

    // --- OAuth ---
    if (u.pathname === '/o/oauth2/v2/auth') {
      const p = u.searchParams
      if (p.get('client_id') !== clientId) { res.writeHead(400).end('client_id desconhecido'); return }
      const codigo = novoId('cod-')
      estado.codigos.set(codigo, { desafio: p.get('code_challenge'), redirectUri: p.get('redirect_uri') })
      res.writeHead(302, { location: `${p.get('redirect_uri')}/?code=${codigo}&state=${encodeURIComponent(p.get('state'))}` }).end()
      return
    }
    if (u.pathname === '/token' && req.method === 'POST') {
      const f = Object.fromEntries(new URLSearchParams(corpo.toString()))
      if (f.client_id !== clientId || f.client_secret !== clientSecret) return json(res, 401, { error: 'invalid_client', error_description: 'The OAuth client was not found.' })
      const acesso = () => { const a = novoId('at-'); estado.acessos.add(a); return a }
      if (f.grant_type === 'authorization_code') {
        const c = estado.codigos.get(f.code)
        estado.codigos.delete(f.code)
        const desafio = f.code_verifier && crypto.createHash('sha256').update(f.code_verifier).digest('base64url')
        if (!c || c.desafio !== desafio || c.redirectUri !== f.redirect_uri) return json(res, 400, { error: 'invalid_grant', error_description: 'Bad code or verifier.' })
        const rt = novoId('rt-')
        estado.refresh.add(rt)
        return json(res, 200, { access_token: acesso(), refresh_token: rt, expires_in: estado.duracaoAcesso, token_type: 'Bearer' })
      }
      if (f.grant_type === 'refresh_token') {
        if (!estado.refresh.has(f.refresh_token)) return json(res, 400, { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' })
        return json(res, 200, { access_token: acesso(), expires_in: estado.duracaoAcesso, token_type: 'Bearer' })
      }
      return json(res, 400, { error: 'unsupported_grant_type' })
    }
    if (u.pathname === '/revoke' && req.method === 'POST') {
      const t = new URLSearchParams(corpo.toString()).get('token')
      estado.revogados.push(t)
      estado.refresh.delete(t)
      estado.acessos.clear()
      return json(res, 200, {})
    }

    // --- Drive (exige Bearer válido) ---
    const bearer = (req.headers.authorization || '').replace(/^Bearer /, '')
    if (!estado.acessos.has(bearer)) return erroApi(res, 401, 'Request had invalid authentication credentials.')

    if (u.pathname === '/drive/v3/about') {
      return json(res, 200, { user: { emailAddress: email, displayName: 'Felipe' } })
    }
    if (u.pathname === '/drive/v3/files' && req.method === 'GET') {
      const q = u.searchParams.get('q') || ''
      const nome = /name = '((?:\\'|[^'])*)'/.exec(q)?.[1]?.replace(/\\'/g, "'")
      const soPasta = q.includes(`mimeType = '${PASTA}'`)
      const pai = /'([^']+)' in parents/.exec(q)?.[1]
      const files = [...estado.arquivos.values()]
        .filter(a => (!nome || a.name === nome) && (!soPasta || a.mimeType === PASTA) && (!pai || a.parents?.includes(pai)))
        .map(({ id, name, mimeType, conteudo }) => ({ id, name, mimeType, size: String(conteudo?.length ?? 0) }))
      return json(res, 200, { files })
    }
    if (u.pathname === '/drive/v3/files' && req.method === 'POST') {
      const meta = JSON.parse(corpo.toString() || '{}')
      const a = { id: novoId('f-'), name: meta.name, mimeType: meta.mimeType, parents: meta.parents || ['root'], conteudo: Buffer.alloc(0) }
      estado.arquivos.set(a.id, a)
      return json(res, 200, { id: a.id, name: a.name })
    }
    if (u.pathname === '/upload/drive/v3/files' && req.method === 'POST' && u.searchParams.get('uploadType') === 'resumable') {
      const meta = JSON.parse(corpo.toString() || '{}')
      const id = novoId('s-')
      estado.sessoes.set(id, { meta, total: Number(req.headers['x-upload-content-length']), recebido: [], tipo: req.headers['x-upload-content-type'] })
      res.writeHead(200, { location: `http://127.0.0.1:${servidor.address().port}/upload/sessao/${id}` }).end()
      return
    }
    const sessao = /^\/upload\/sessao\/(.+)$/.exec(u.pathname)?.[1]
    if (sessao && req.method === 'PUT') {
      const s = estado.sessoes.get(sessao)
      if (!s) return erroApi(res, 404, 'Sessão de upload não encontrada.')
      if (estado.falharEnvio?.(s.meta.name)) return erroApi(res, 503, 'Backend Error')
      const m = /bytes (\d+)-(\d+)\/(\d+)/.exec(req.headers['content-range'] || '')
      const jaTem = s.recebido.reduce((n, b) => n + b.length, 0)
      if (!m || Number(m[1]) !== jaTem || Number(m[2]) - Number(m[1]) + 1 !== corpo.length || Number(m[3]) !== s.total) return erroApi(res, 400, 'Content-Range inválido.')
      const ultima = Number(m[2]) + 1 === s.total
      if (!ultima && corpo.length % PARTE_MINIMA !== 0) return erroApi(res, 400, 'Parte não é múltipla de 256 KB.')
      s.recebido.push(corpo)
      estado.partesRecebidas++
      if (!ultima) { res.writeHead(308, { range: `bytes=0-${m[2]}` }).end(); return }
      estado.sessoes.delete(sessao)
      const a = { id: novoId('f-'), name: s.meta.name, mimeType: s.tipo, parents: s.meta.parents || ['root'], conteudo: Buffer.concat(s.recebido) }
      estado.arquivos.set(a.id, a)
      return json(res, 200, { id: a.id, name: a.name, size: String(a.conteudo.length) })
    }
    const idArquivo = /^\/drive\/v3\/files\/([^/]+)$/.exec(u.pathname)?.[1]
    if (idArquivo) {
      const a = estado.arquivos.get(idArquivo)
      if (!a) return erroApi(res, 404, `File not found: ${idArquivo}.`)
      if (req.method === 'DELETE') { estado.arquivos.delete(idArquivo); res.writeHead(204).end(); return }
      if (req.method === 'GET' && u.searchParams.get('alt') === 'media') { res.writeHead(200, { 'content-type': a.mimeType || 'application/octet-stream' }); res.end(a.conteudo); return }
    }
    res.writeHead(404).end()
  })

  await new Promise(r => servidor.listen(0, '127.0.0.1', r))
  return {
    base: `http://127.0.0.1:${servidor.address().port}`,
    clientId, clientSecret, estado,
    // simula o acesso vencer no Google antes da hora (o app tem que renovar sozinho)
    invalidarAcessos: () => estado.acessos.clear(),
    fechar: () => new Promise(r => { servidor.closeAllConnections?.(); servidor.close(r) }),
  }
}
